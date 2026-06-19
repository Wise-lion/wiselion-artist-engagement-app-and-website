import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { config } from '../config';

const app = initializeApp(config.firebase);
export const auth = getAuth(app);

export const signInEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signOut = () => fbSignOut(auth);

// Social sign-in: pass an idToken obtained from the native Google/Apple flow
// (e.g. expo-auth-session / @react-native-google-signin / expo-apple-authentication).
export const signInWithGoogle = (idToken: string) =>
  signInWithCredential(auth, GoogleAuthProvider.credential(idToken));

export const signInWithApple = (idToken: string, nonce?: string) => {
  const provider = new OAuthProvider('apple.com');
  return signInWithCredential(auth, provider.credential({ idToken, rawNonce: nonce }));
};

export const onAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);

// Always fetch a fresh ID token for API/socket auth.
export const getIdToken = async (): Promise<string | null> => {
  const u = auth.currentUser;
  return u ? u.getIdToken() : null;
};
