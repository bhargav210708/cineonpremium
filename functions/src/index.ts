import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';

initializeApp();
const db = getFirestore();
const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

/** Keep all community scores server-computed; clients can only submit individual reports. */
export const rollUpCinemaReport = onDocumentCreated('cinemaReports/{reportId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const report = snapshot.data();
  const cinemaId = typeof report.cinemaId === 'string' ? report.cinemaId : '';
  const screen = typeof report.screen === 'string' ? report.screen : 'unspecified';
  const format = typeof report.format === 'string' ? report.format : '2D';
  if (!cinemaId) {
    logger.warn('Cinema report has no cinemaId', { reportId: event.params.reportId });
    return;
  }
  const cinemaRef = db.collection('cinemas').doc(cinemaId);
  await db.runTransaction(async (tx) => {
    const cinemaSnap = await tx.get(cinemaRef);
    const cinema = cinemaSnap.exists ? cinemaSnap.data() ?? {} : {};
    const aggregate = (cinema.aggregates ?? {}) as Record<string, Record<string, { count?: number; picture?: number; sound?: number; seats?: number; crowd?: number }>>;
    const byScreen = { ...(aggregate.byScreen ?? {}) };
    const byFormat = { ...(aggregate.byFormat ?? {}) };
    const metrics = ['picture', 'sound', 'seats', 'crowd'] as const;
    const apply = (old: {count?:number;picture?:number;sound?:number;seats?:number;crowd?:number} | undefined) => {
      const next = { count: (old?.count ?? 0) + 1, picture: old?.picture ?? 0, sound: old?.sound ?? 0, seats: old?.seats ?? 0, crowd: old?.crowd ?? 0 };
      for (const metric of metrics) {
        const score = Number(report[metric]);
        if (Number.isFinite(score) && score >= 1 && score <= 5) next[metric] += score;
      }
      return next;
    };
    byScreen[screen] = apply(byScreen[screen]);
    byFormat[format] = apply(byFormat[format]);
    tx.set(cinemaRef, { aggregates: { byScreen, byFormat }, reportCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
});

/** Recompute simple server-side badges whenever a user's diary count changes. */
export const updateUserBadges = onDocumentUpdated('users/{uid}', async (event) => {
  const after = event.data?.after.data();
  if (!after) return;
  const entriesCount = Number(after.counts?.entries ?? 0);
  const badges: string[] = [];
  if (entriesCount >= 1) badges.push('first-frame');
  if (entriesCount >= 10) badges.push('regular-at-the-movies');
  if (entriesCount >= 50) badges.push('cinema-enthusiast');
  await db.collection('badges').doc(event.params.uid).set({ items: badges, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
});

/** Authenticated AI proxy: the provider secret never reaches the browser. */
export const aiAssist = onRequest({ cors: true, secrets: [anthropicKey], timeoutSeconds: 60, memory: '256MiB' }, async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST required' }); return; }
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return; }
  let uid: string;
  try { uid = (await getAuth().verifyIdToken(token)).uid; }
  catch { res.status(401).json({ error: 'Invalid authentication token' }); return; }
  const text = typeof req.body?.text === 'string' ? req.body.text.slice(0, 5000).trim() : '';
  const mode = ['polish', 'caption', 'spoiler-free'].includes(req.body?.mode) ? req.body.mode as string : 'polish';
  if (!text) { res.status(400).json({ error: 'Text is required' }); return; }
  const rateRef = db.collection('aiRateLimits').doc(uid);
  const allowed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(rateRef);
    const now = Date.now();
    const windowStart = Number(snap.data()?.windowStart ?? now);
    const count = windowStart + 60_000 < now ? 0 : Number(snap.data()?.count ?? 0);
    if (count >= 10) return false;
    tx.set(rateRef, { windowStart: windowStart + 60_000 < now ? now : windowStart, count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
  if (!allowed) { res.status(429).json({ error: 'Rate limit reached. Try again in a minute.' }); return; }
  const instruction = mode === 'caption'
    ? 'Suggest three short, original social captions for a cinema ticket card. Do not invent factual details.'
    : mode === 'spoiler-free'
      ? 'Rewrite the supplied text as a spoiler-free summary. If key plot details cannot be safely removed, say so.'
      : 'Polish the supplied film review for clarity while preserving the writer’s opinion, voice, and meaning. Do not add facts.';
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': anthropicKey.value(), 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-3-5-haiku-latest', max_tokens: 700, system: instruction, messages: [{ role: 'user', content: text }] }),
    });
    if (!response.ok) { logger.error('AI provider error', { status: response.status, uid }); res.status(502).json({ error: 'AI provider unavailable' }); return; }
    const payload = await response.json() as { content?: { type: string; text?: string }[] };
    const result = (payload.content ?? []).filter(c => c.type === 'text').map(c => c.text ?? '').join('\n').trim();
    res.json({ result });
  } catch (error) {
    logger.error('AI request failed', error);
    res.status(500).json({ error: 'Could not generate a suggestion' });
  }
});

/** Account deletion callable via authenticated HTTP endpoint; removes owned app data. */
export const deleteAccount = onRequest({ cors: true, timeoutSeconds: 120, memory: '512MiB' }, async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST required' }); return; }
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return; }
  let uid: string;
  try { uid = (await getAuth().verifyIdToken(token)).uid; }
  catch { res.status(401).json({ error: 'Invalid authentication token' }); return; }
  try {
    // Paginate every known uid-owned collection, then recursively remove user subcollections.
    for (const collection of ['entries', 'lists', 'parties', 'reports', 'cinemaReports', 'posts']) {
      while (true) {
        const owned = await db.collection(collection).where('uid', '==', uid).limit(100).get();
        if (owned.empty) break;
        await Promise.all(owned.docs.map(doc => db.recursiveDelete(doc.ref)));
      }
    }
    const userRef = db.collection('users').doc(uid);
    await db.recursiveDelete(userRef);
    await db.recursiveDelete(db.collection('notifications').doc(uid));
    await db.recursiveDelete(db.collection('badges').doc(uid));
    for (const followField of ['followerUid', 'followeeUid']) {
      while (true) {
        const follows = await db.collection('follows').where(followField, '==', uid).limit(400).get();
        if (follows.empty) break;
        const batch = db.batch();
        follows.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }
    await db.collection('aiRateLimits').doc(uid).delete();
    await getStorage().bucket().deleteFiles({ prefix: `users/${uid}/` });
    await getAuth().deleteUser(uid);
    res.json({ ok: true });
  } catch (error) {
    logger.error('Account deletion failed', { uid, error });
    res.status(500).json({ error: 'Account deletion did not complete; contact support before retrying.' });
  }
});
