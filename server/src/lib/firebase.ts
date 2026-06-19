import admin from 'firebase-admin';
import { env, DEV_MODE } from './env';

// In DEV_MODE we skip Firebase Admin entirely — auth is stubbed (see middleware/auth.ts).
if (!DEV_MODE && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    }),
  });
}

// These are only used when DEV_MODE is false.
export const firebaseAuth = DEV_MODE ? (null as any) : admin.auth();
export const messaging = DEV_MODE ? (null as any) : admin.messaging();
export default admin;
