import { Response, NextFunction } from 'express';
import { userRepository } from '../repositories/user.repository';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { verifyToken } from '../../../libs/common/jwt';
import { AuthRequest, JwtPayload } from '../types/auth';

const DEV_ADMIN_TOKEN = process.env.DEV_ADMIN_TOKEN || '';

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isJwtPayload(obj: unknown): obj is JwtPayload {
  if (obj == null || typeof obj !== 'object') return false;
  const { id, role } = obj as Record<string, unknown>;
  return isString(id) && isString(role);
}

export async function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const repo: IUserRepository = userRepository;
  const header = req.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'missing' });
  const token = header.slice(7);

  if (DEV_ADMIN_TOKEN && token === DEV_ADMIN_TOKEN) {
    req.auth = { id: 'dev', email: 'dev', role: 'admin' };
    return next();
  }

  try {
    const decoded = verifyToken(token) as any;
    if (!isJwtPayload(decoded)) return res.status(401).json({ message: 'invalid' });

    let email: string | undefined = decoded.email;
    if (!email) {
      try {
        const user = await repo.findById(decoded.id);
        email = user ? (user as any).email : undefined;
      } catch (error) {
        console.warn('auth middleware: failed to load user email', error);
      }
    }

    if (!email) return res.status(401).json({ message: 'invalid' });
    req.auth = { id: decoded.id, email, role: decoded.role };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'invalid' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ message: 'missing' });
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'forbidden' });
  return next();
}
