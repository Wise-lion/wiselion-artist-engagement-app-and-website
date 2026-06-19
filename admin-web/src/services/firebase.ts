import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);
export const signIn = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const signOut = () => fbSignOut(auth);
export const onAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);
export const getIdToken = () => auth.currentUser?.getIdToken() ?? Promise.resolve(null);
