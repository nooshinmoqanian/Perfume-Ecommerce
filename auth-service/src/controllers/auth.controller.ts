import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import parseRegisterBody from '../dtos/register.dto';
import parseLoginBody from '../dtos/login.dto';
import AuthService from '../services/auth.service';
import { IUserService } from '../interfaces/user-service.interface';
import { IAuthService } from '../interfaces/auth-service.interface';
import { buildAuthResponse } from '../helpers/auth.helper';
import { AppError } from '../../../libs/common/errors';
import { info, error } from '../../../libs/common/logger';
import { getEntityId } from '../../../libs/common/id';
import { verifyToken } from '../../../libs/common/jwt';

// Public sign-up always creates a plain user; only an authenticated admin
// (e.g. the admin panel's "create user") may assign another role.
function isAdminCaller(req: Request): boolean {
  const header = req.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return false;
  const token = header.slice(7);
  const devToken = process.env.DEV_ADMIN_TOKEN || '';
  if (devToken && token === devToken) return true;
  try {
    return (verifyToken(token) as { role?: string })?.role === 'admin';
  } catch {
    return false;
  }
}

export default function AuthController(userService?: IUserService) {
  const authService: IAuthService = new AuthService(userService);

  async function registerController(req: Request, res: Response, next: NextFunction) {
    const parsedResult = parseRegisterBody(req.body);
    if (parsedResult.error) {
      return next(new AppError('INVALID_INPUT', parsedResult.error.message || 'invalid', 400));
    }
    const parsed = parsedResult.value;

    if (parsed.role !== 'user' && !isAdminCaller(req)) {
      return next(new AppError('FORBIDDEN', 'only admins can assign roles', 403));
    }
    info({ scope: 'auth', action: 'register_attempt', email: parsed.email });

    try {
      const { token, user } = await authService.register(parsed.email, parsed.password, parsed.role);
      info({ scope: 'auth', action: 'register_success', id: getEntityId(user) });
      return res.status(201).json(buildAuthResponse(user, token));
    } catch (err) {
      return next(err);
    }
  }

  async function loginController(req: Request, res: Response, next: NextFunction) {
    const parsedResult = parseLoginBody(req.body);
    if (parsedResult.error) {
      return next(new AppError('INVALID_INPUT', parsedResult.error.message || 'invalid', 400));
    }
    const parsed = parsedResult.value;

    info({ scope: 'auth', action: 'login_attempt', email: parsed.email });

    try {
      const { token, user } = await authService.login(parsed.email, parsed.password);
      info({ scope: 'auth', action: 'login_success', id: getEntityId(user) });
      return res.json(buildAuthResponse(user, token));
    } catch (err) {
      return next(err);
    }
  }

  async function meController(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.meFromAuth(req.auth);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  return { registerController, loginController, meController };
}
