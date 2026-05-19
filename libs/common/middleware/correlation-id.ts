import { NextFunction, Request, Response } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';

function generateRequestId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

type RequestWithRequestId = Request & { requestId?: string };

export default function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers[REQUEST_ID_HEADER] ?? req.headers[REQUEST_ID_HEADER.toLowerCase()];
  const existingId = Array.isArray(incoming) ? incoming[0] : incoming;
  const id = existingId || generateRequestId();

  (req as RequestWithRequestId).requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);

  next();
}