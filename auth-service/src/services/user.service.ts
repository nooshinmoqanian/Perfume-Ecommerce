import { userRepository } from '../repositories/user.repository';
import { RepoUser } from '../types/user';
import bcrypt from 'bcryptjs';
import { AppError } from '../../../libs/common/errors';
import { info } from '../../../libs/common/logger';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IUserService, PublicUser } from '../interfaces/user-service.interface';

function isValidRole(r: unknown) {
  return typeof r === 'string' && (r === 'user' || r === 'admin');
}

export default class UserService implements IUserService {
  private repo: IUserRepository;
  constructor(repo?: IUserRepository) {
    this.repo = repo ?? userRepository;
  }

  async listUsers(opts?: { page?: number; limit?: number; q?: string }) {
    try {
      const { rows, total } = await this.repo.list(opts);
      const users = rows.map((u: RepoUser) => ({ id: String((u as any)._id || u.id), email: u.email, role: u.role, createdAt: u.createdAt }));
      return { users, total };
    } catch (error) {
      console.warn('user.service: listUsers failed', error);
      throw new AppError('DB_ERROR', 'Failed to list users', 500);
    }
  }

  async getById(id: string) {
    try {
      return await this.repo.findById(id);
    } catch (error) {
      console.warn('user.service: getById failed', error);
      throw new AppError('DB_ERROR', 'Failed to fetch user', 500);
    }
  }

  async setRole(userId: string, role: string) {
    // validate role
    if (!isValidRole(role)) throw new AppError('INVALID_ROLE', 'Invalid role', 400);

    // attempt update
    try {
      const ok = await this.repo.updateRole(userId, role as 'user' | 'admin');
      if (!ok) throw new AppError('NOT_FOUND', 'User not found', 404);
    } catch (error) {
      console.warn('user.service: setRole failed', error);
      if (error instanceof AppError) throw error;
      throw new AppError('DB_ERROR', 'Failed to update role', 500);
    }

    // previously emitted role change to Kafka; now log instead
    try { info({ scope: 'auth', action: 'user_role_updated', id: userId, role }); } catch (e) { console.warn('Failed to log user.role.updated event', e); }

    return { updated: true };
  }

  // Register user: validate business rules, hash password, persist
  async register(email: string, password: string, role: 'user' | 'admin' = 'user') {
    if (!isValidRole(role)) throw new Error('invalid role');
    try {
      const existing = await this.repo.findByEmail(email);
      if (existing) {
        const err: any = new Error('email exists');
        err.code = 11000;
        throw err;
      }
    } catch (error) {
      console.warn('user.service: register failed checking existing user', error);
      throw new AppError('DB_ERROR', 'Failed to check existing user', 500);
    }
    const hash = await bcrypt.hash(password, 10);
    let created: RepoUser | null = null;
    try {
      created = await this.repo.create(email, hash, role);
    } catch (error) {
      console.warn('user.service: create failed', error);
      throw error;
    }
    if (!created) {
      throw new AppError('DB_ERROR', 'Failed to create user', 500);
    }
    // remove password before returning by returning a shallow copy without password
    const safeCreated: PublicUser & { password?: string } = Object.assign({}, created);
    if (safeCreated.password) delete safeCreated.password;
    // previously emitted user.created to Kafka; now log instead
    try { info({ scope: 'auth', action: 'user_created', id: (created as any)._id?.toString?.() || (created as any).id, email: created.email }); } catch (e) { console.warn('Failed to log user.created event', e); }
    return safeCreated;
  }

  // Login: verify credentials and return user or null
  async login(email: string, password: string) {
    try {
      const user = await this.repo.findByEmail(email);
      if (!user) return null;
      const isMatch = await bcrypt.compare(password, (user as RepoUser).password);
      if (!isMatch) return null;
      const safeUser: PublicUser & { password?: string } = Object.assign({}, user);
      if (safeUser.password) delete safeUser.password;
      return safeUser;
    } catch (error) {
      console.warn('user.service: login failed', error);
      throw new AppError('DB_ERROR', 'Failed to verify credentials', 500);
    }
  }
 
  // Fetch purchases for a given user by email via order-service
  async getPurchasesByEmail(email: string) {
    try {
      const ordersBase = process.env.ORDERS_BASE || 'http://order-service:3001';
      const url = `${ordersBase}/api/orders?customerEmail=${encodeURIComponent(email)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('Failed to fetch purchases', e);
      return [];
    }
  }

  // Admin-only dashboard summary
  async adminDashboard() {
    try {
      // total users and recent users
      const firstPage = await this.repo.list({ page: 1, limit: 5 });
      const totalUsers = firstPage.total || 0;
      const recentUsers = firstPage.rows.map((u: RepoUser) => ({ id: String((u as any)._id || u.id), email: u.email, role: u.role, createdAt: u.createdAt }));
      return { totalUsers, recentUsers };
    } catch (error) {
      console.warn('user.service: adminDashboard failed', error);
      throw new AppError('DB_ERROR', 'Failed to load dashboard', 500);
    }
  }
}
