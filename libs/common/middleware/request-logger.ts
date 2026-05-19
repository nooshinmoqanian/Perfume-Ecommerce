import http from 'http';
import https from 'https';
import { NextFunction, Request, Response } from 'express';
import { URL } from 'url';

const INSPECTOR_ENDPOINT = process.env.INSPECTOR_URL || 'http://notification-service:3003/api/inspector/logs';
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown-service';
const POST_TIMEOUT_MS = 2000;

type RequestWithRequestId = Request & { requestId?: string };

function safeStringify(v: unknown, max = 1000) {
  try {
    if (v === undefined) return undefined;
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return s.length > max ? s.slice(0, max) : s;
  } catch {
    return undefined;
  }
}

function sendToInspector(target: string, obj: unknown, headers: Record<string, string> = {}) {
  try {
    const u = new URL(target);
    const lib = u.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(obj);

    const opts: http.RequestOptions = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + (u.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
      timeout: POST_TIMEOUT_MS,
    };

    const req = lib.request(opts, (res) => {
      res.on('data', () => {
        // consume response to free socket
      });
      res.on('end', () => {
        // noop
      });
    });

    req.on('error', (err) => {
      // Non-fatal: inspector logger is best-effort.
      console.debug('Inspector post error:', err?.message || err);
    });

    req.on('timeout', () => {
      req.destroy();
    });

    req.write(payload);
    req.end();
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.debug('Failed to send inspector payload', err?.message || e);
  }
}

export default function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const requestId =
      req.headers['x-request-id'] || (req as RequestWithRequestId).requestId || null;

    const payload = {
      service: SERVICE_NAME,
      level: 'info',
      message: `${req.method} ${req.originalUrl} -> ${res.statusCode}`,
      meta: {
        requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration,
        clientIp: req.ip || req.headers['x-forwarded-for'] || null,
        body: safeStringify(req.body, 1000),
      },
    };

    const headers: Record<string, string> = { 'x-service': SERVICE_NAME };
    if (requestId && typeof requestId === 'string') {
      headers['x-request-id'] = requestId;
    }

    sendToInspector(INSPECTOR_ENDPOINT, payload, headers);
  });

  next();
}