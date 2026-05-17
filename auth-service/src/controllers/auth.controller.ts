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

export default function AuthController(userService?: IUserService) {
  const authService: IAuthService = new AuthService(userService);

  async function registerController(req: Request, res: Response, next: NextFunction) {
    const parsedResult = parseRegisterBody(req.body);
    if (parsedResult.error) {
      return next(new AppError('INVALID_INPUT', parsedResult.error.message || 'invalid', 400));
    }
    const parsed = parsedResult.value;

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
