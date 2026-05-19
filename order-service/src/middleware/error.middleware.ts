import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-errors';
import MESSAGES from '../errors/messages';
import { DatabaseError } from '../../../libs/common/db-error';

export default function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof DatabaseError) {
    console.error('DatabaseError:', err.original ?? err.message ?? err);
    return res.status(503).json({ message: MESSAGES.DB_ERROR });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ message: MESSAGES.INTERNAL_ERROR });
}
