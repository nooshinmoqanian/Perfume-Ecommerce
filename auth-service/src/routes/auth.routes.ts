import { Router } from 'express';
import makeAuthController from '../controllers/auth.controller';
import { authRequired } from '../middleware/auth';
import { IUserService } from '../interfaces/user-service.interface';


export default function makeAuthRouter(userService: IUserService) {
	const router = Router();
	const { registerController, loginController, meController } = makeAuthController(userService);

	router.post('/register', registerController);
	router.post('/login', loginController);
	router.get('/me', authRequired, meController);
	
	return router;
}
