import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import { IUserService } from '../interfaces/user-service.interface';
import { getPaginationParams, sendPaginated } from '../../../libs/common/pagination';
import { info, error } from '../../../libs/common/logger';
import { AppError } from '../../../libs/common/errors';

export default function makeUserController(userService: IUserService) {

  async function listUsersController(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, q } = getPaginationParams(req);
      const result = await userService.listUsers({ page, limit, q });
      return sendPaginated(res, { items: result.users, total: result.total }, page, limit);
    } catch (err) {
      return next(err);
    }
  }

  async function setRoleController(req: AuthRequest, res: Response, next: NextFunction) {
    const id = req.params.id as string | undefined;
    const role = (req.body as any)?.role as string | undefined;

    info({ scope: 'user', action: 'set_role_attempt', id, role });

    try {
      if (!id) throw new AppError('INVALID_INPUT', 'id required', 400);
      const result = await userService.setRole(id, role as string);
      info({ scope: 'user', action: 'set_role_success', id });
      return res.json(result);
    } catch (err: unknown) {
      error({ scope: 'user', action: 'set_role_failed', id }, err);
      return next(err);
    }
  }

  async function getPurchasesController(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id as string | undefined;

      if (!userId) throw new AppError('INVALID_INPUT', 'id required', 400);

      const auth = req.auth as { id: string; role: string };
      const isAdmin = auth.role === 'admin';
      const isOwner = auth.id === userId;
      if (!isAdmin && !isOwner) throw new AppError('FORBIDDEN', 'forbidden', 403);

      const user = await userService.getById(userId);
      if (!user) throw new AppError('NOT_FOUND', 'user not found', 404);
      const purchases = await userService.getPurchasesByEmail((user as any).email);
      return res.json(purchases || []);
    } catch (err) {
      error({ scope: 'user', action: 'get_purchases_failed' }, err);
      return next(err);
    }
  }

  async function adminDashboardController(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await userService.adminDashboard();
      return res.json(data);
    } catch (err) {
      error({ scope: 'user', action: 'admin_dashboard_failed' }, err);
      return next(err);
    }
  }

  return { listUsersController, setRoleController, getPurchasesController, adminDashboardController };
};