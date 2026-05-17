import UserService from './user.service';
import { signToken } from '../../../libs/common/jwt';
import { getEntityId } from '../../../libs/common/id';
import { AppError } from '../../../libs/common/errors';

export default class AuthService {
  private userService: UserService;

  constructor(userService?: UserService) {
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
    return { id: auth.id, email: auth.email, role: auth.role };
  }
}
