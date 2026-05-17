import { Request } from 'express';

export interface AuthRequest extends Request {
  auth?: { id: string; email: string; role: string };
}

export interface JwtPayload {
  id: string;
  role: string;
  email?: string;
}
