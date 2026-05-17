import { PublicUser } from './user-service.interface';

export interface IAuthService {
  register(email: string, password: string, role?: 'user' | 'admin'): Promise<{ token: string; user: PublicUser }>;
  login(email: string, password: string): Promise<{ token: string; user: PublicUser }>;
  meFromAuth(auth: { id: string; email: string; role: string } | undefined): Promise<{ id: string; email: string; role: string }>;
}

export default IAuthService;
