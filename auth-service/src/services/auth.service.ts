import UserService from './user.service';
import { signToken } from '../../../libs/common/jwt';
import { getEntityId } from '../../../libs/common/id';
import { AppError } from '../../../libs/common/errors';
import { IUserService } from '../interfaces/user-service.interface';
import { IAuthService } from '../interfaces/auth-service.interface';

export default class AuthService implements IAuthService {
  private userService: IUserService;

  constructor(userService?: IUserService) {
    this.userService = userService ?? new UserService();
  }

  async register(email: string, password: string, role: 'user' | 'admin' = 'user') {
    try {
      const created = await this.userService.register(email, password, role);
      const id = getEntityId(created);
      const token = signToken({ id, role: created.role });
      return { token, user: created };
    } catch (err: unknown) {
      // map duplicate key to AppError with code and 409
      if ((err as any)?.code === 11000) {
        throw new AppError('EMAIL_EXISTS', 'Email already exists', 409);
      }
      throw err;
    }
  }

  async login(email: string, password: string) {
    const user = await this.userService.login(email, password);
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }
    const id = getEntityId(user);
    const token = signToken({ id, role: user.role });
    return { token, user };
  }

  async meFromAuth(auth: { id: string; email: string; role: string } | undefined) {
    if (!auth) throw new AppError('UNAUTHORIZED', 'Missing auth', 401);
    const base = { id: auth.id, email: auth.email, role: auth.role };
    // Enrich with stored profile fields for real (DB-backed) users.
    // The dev-admin token has no DB record, so it falls back to the token claims.
    if (auth.id && auth.id !== 'dev') {
      try {
        const user = await this.userService.getById(auth.id) as any;
        if (user) {
          return {
            id: auth.id,
            email: user.email || auth.email,
            role: user.role || auth.role,
            name: user.name || '',
            phone: user.phone || '',
            address: user.address || '',
          };
        }
      } catch (e) {
        console.warn('meFromAuth: failed to load profile', e);
      }
    }
    return base;
  }
}
