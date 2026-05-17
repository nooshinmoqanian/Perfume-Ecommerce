import { Router } from 'express';
import makeAuthController from '../controllers/auth.controller';
import { authRequired } from '../middleware/auth';
import UserService from '../services/user.service';


export default function makeAuthRouter(userService: UserService) {
	const router = Router();
	const { registerController, loginController, meController } = makeAuthController(userService);

	router.post('/register', registerController);
	router.post('/login', loginController);
	router.get('/me', authRequired, meController);
	
	return router;
}
