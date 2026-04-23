import { Request, Response, NextFunction } from 'express';
import { extractTokenFromRequest, verifyToken } from '../utils/auth';
import { JWTPayload, Role } from '../../../src/types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate and optionally authorize user via JWT.
 */
export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = extractTokenFromRequest(req);

    if (!token) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
      return;
    }

    req.user = payload;

    if (roles.length > 0 && !roles.includes(payload.role)) {
      res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
      return;
    }

    next();
  };
}

/**
 * Optional auth parser for public routes that can still use user context.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractTokenFromRequest(req);

  if (!token) {
    next();
    return;
  }

  const payload = verifyToken(token);
  if (payload) {
    req.user = payload;
  }

  next();
}

// Backward-compatible aliases
export const authMiddleware = authorize();
export const adminMiddleware = authorize(Role.ADMIN);

/**
 * Middleware for CORS
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = (
    process.env.CORS_ORIGIN ||
    'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
}

/**
 * Input sanitization middleware
 */
export function sanitizeInputMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const sanitize = (value: any): any => {
    if (typeof value === 'string') {
      return value.trim().replace(/[<>]/g, '');
    }
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitize(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  next();
}

/**
 * Error handling middleware
 */
export function errorHandler(
  error: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.status && error.message) {
    res.status(error.status).json({
      message: error.message,
      code: error.code,
      details: error.details,
    });
  } else {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
