/** Same-origin TMDB proxy for Vercel. Keep the TMDB token server-side. */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ status_message: 'Method not allowed.' });

  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) return res.status(503).json({ status_message: 'Cinéon server is missing the TMDB_READ_ACCESS_TOKEN environment variable.' });

  const rawPath = typeof req.query?.path === 'string' ? req.query.path : '';
  // Only allow TMDB resource paths used by this app; never accept arbitrary URLs.
  const allowed = /^\/(trending\/movie\/(week|day)|movie\/(\d+|now_playing|upcoming|top_rated)|search\/(movie|person)|discover\/movie|person\/\d+\/movie_credits)$/;
  if (!allowed.test(rawPath)) return res.status(400).json({ status_message: 'Unsupported TMDB resource path.' });

  const target = new URL(`https://api.themoviedb.org/3${rawPath}`);
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === 'path' || value === undefined || value === null) continue;
    if (Array.isArray(value)) target.searchParams.set(key, value.join(','));
    else target.searchParams.set(key, String(value));
  }
  if (!target.searchParams.has('language')) target.searchParams.set('language', 'en-US');

  try {
    const upstream = await fetch(target, {
      headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    const body = await upstream.text();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    return res.status(upstream.status).send(body);
  } catch {
    return res.status(502).json({ status_message: 'Cinéon could not reach TMDB right now. Please try again shortly.' });
  }
}
