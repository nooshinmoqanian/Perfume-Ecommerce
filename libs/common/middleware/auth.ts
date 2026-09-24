import { createHmac, timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';

// Verifies the HS256 JWTs issued by auth-service (shared JWT_SECRET) without
// pulling jsonwebtoken into every service.

export type AuthClaims = {
  id: string;
  email?: string;
  role: 'user' | 'admin' | string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export function verifyJwt(token: string, secret: string): AuthClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
    if (header?.alg !== 'HS256') return null;

    const expected = createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest();
    const actual = base64UrlDecode(signatureB64);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
    if (typeof payload?.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    if (typeof payload?.id !== 'string' || typeof payload?.role !== 'string') return null;

    return { id: payload.id, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

function resolveAuth(req: Request): AuthClaims | null {
  const header = req.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7);

  // Same development bypass auth-service honours; keep DEV_ADMIN_TOKEN empty in production.
  const devToken = process.env.DEV_ADMIN_TOKEN || '';
  if (devToken && token === devToken) return { id: 'dev', email: 'dev', role: 'admin' };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[auth] JWT_SECRET is not configured; rejecting token');
    return null;
  }
  return verifyJwt(token, secret);
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const auth = resolveAuth(req);
  if (!auth) return res.status(401).json({ message: 'Authentication required' });
  req.auth = auth;
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ message: 'Authentication required' });
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  return next();
}

export const adminOnly = [authRequired, requireAdmin];
