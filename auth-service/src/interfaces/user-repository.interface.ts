import { RepoUser } from '../types/user';
import { PaginationOpts } from '../types/pagination';

export interface IUserRepository {
  findByEmail(email: string): Promise<RepoUser | null>;
  findById(id: string): Promise<RepoUser | null>;
  create(email: string, password: string, role?: 'user' | 'admin'): Promise<RepoUser>;
  updateRole(id: string, role: 'user' | 'admin'): Promise<boolean>;
  list(opts?: PaginationOpts): Promise<{ rows: RepoUser[]; total: number }>;
}

export default IUserRepository;
