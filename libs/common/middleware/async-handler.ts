import { NextFunction, Request, Response } from 'express';

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown> | unknown;

export function asyncHandler(fn: AsyncHandler) {
  return function asyncHandlerWrapper(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;