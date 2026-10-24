import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailLink, sendSignInLinkToEmail, signInWithPopup, signOut, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';

const env = import.meta.env;
const configured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID);
let app: FirebaseApp | undefined;
if (configured) app = getApps()[0] ?? initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID, storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID,
});
export const firebaseConfigured = Boolean(app);
export const appCheck: AppCheck | null = app && env.VITE_APP_CHECK_KEY ? initializeAppCheck(app, { provider: new ReCaptchaV3Provider(env.VITE_APP_CHECK_KEY), isTokenAutoRefreshEnabled: true }) : null;
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;
export { GoogleAuthProvider, signInWithEmailLink, sendSignInLinkToEmail, signInWithPopup, signOut };
