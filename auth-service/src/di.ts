import UserService from './services/user.service';
import { IUserService } from './interfaces/user-service.interface';

// Simple DI container for auth-service
export const userService: IUserService = new UserService();

export default { userService };
