import { RepoUser } from '../types/user';

export type PublicUser = {
  id?: string;
  _id?: { toString(): string } | string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: string;
};

export interface IUserService {
  listUsers(opts?: { page?: number; limit?: number; q?: string }): Promise<{ users: PublicUser[]; total: number }>;
  getById(id: string): Promise<RepoUser | null>;
  setRole(userId: string, role: string): Promise<{ updated: boolean }>;
  register(email: string, password: string, role?: 'user' | 'admin'): Promise<PublicUser>;
  login(email: string, password: string): Promise<PublicUser | null>;
  getPurchasesByEmail(email: string): Promise<unknown>;
  adminDashboard(): Promise<{ totalUsers: number; recentUsers: PublicUser[] }>;
}

export default IUserService;
