import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../lib/firebase';
import { prisma } from '../lib/prisma';
import { DEV_MODE } from '../lib/env';

export interface AuthedRequest extends Request {
  user?: { id: string; firebaseUid: string; tier: string };
}

// In DEV_MODE, resolve (or lazily create) a single shared dev user instead of
// verifying a Firebase token. The client may pass `x-dev-uid` to simulate
// different users; otherwise everyone shares 'dev-uid'.
export async function resolveDevUser(uid: string) {
  let user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        firebaseUid: uid,
        email: `${uid}@dev.wiselion`,
        username: `dev_${uid.slice(0, 6)}_${Math.floor(Math.random() * 1000)}`,
        coinBalance: 5000, // seed dev wallet so bingo/lotto are playable
      },
    });
  }
  return user;
}

/**
 * Verifies the Firebase ID token from `Authorization: Bearer <token>` and
 * upserts a local User row keyed by firebaseUid. Attaches req.user.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    // DEV_MODE: skip Firebase verification, use a stub dev user.
    if (DEV_MODE) {
      const uid = (req.headers['x-dev-uid'] as string) || 'dev-uid';
      const user = await resolveDevUser(uid);
      req.user = { id: user.id, firebaseUid: user.firebaseUid, tier: user.tier };
      return next();
    }

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });

    const decoded = await firebaseAuth.verifyIdToken(token);

    // Lazily provision the local user on first authenticated request.
    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
    if (!user) {
      const base = (decoded.email?.split('@')[0] || `fan${Date.now()}`).replace(/[^a-z0-9_]/gi, '');
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email || `${decoded.uid}@noemail.wiselion`,
          username: `${base}_${Math.floor(Math.random() * 1000)}`,
          avatarUrl: decoded.picture,
        },
      });
    }
    req.user = { id: user.id, firebaseUid: user.firebaseUid, tier: user.tier };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// For admin-only routes. In production gate on a custom claim; here we check email allowlist.
export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (DEV_MODE) return next(); // any dev user is an admin locally
    const u = await prisma.user.findUnique({ where: { id: req.user!.id } });
    const admins = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim());
    if (!u || !admins.includes(u.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}
