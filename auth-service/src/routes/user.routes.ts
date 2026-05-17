import { Router } from 'express';
import { authRequired, requireAdmin } from '../middleware/auth';
import makeUserController from '../controllers/user.controller';
import { IUserService } from '../interfaces/user-service.interface';
import requestLogger from '../middleware/request-logger';
import errorHandler from '../middleware/error.middleware';

export default function makeUserRouter(userService: IUserService) {

	const router = Router();

	const { listUsersController, setRoleController, getPurchasesController, adminDashboardController } = makeUserController(userService);

	router.get('/users', authRequired, requireAdmin, listUsersController);
	router.put('/users/:id/role', authRequired, requireAdmin, setRoleController);
	router.get('/users/:id/purchases', authRequired, getPurchasesController);
	// Admin-only dashboard summary
	router.get('/admin/dashboard', authRequired, requireAdmin, adminDashboardController);
	
	return router;
}
