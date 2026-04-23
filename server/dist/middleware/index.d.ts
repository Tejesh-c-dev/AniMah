import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../../../src/types';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
/**
 * Middleware to authenticate user via JWT
 */
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to check if user is admin
 */
export declare function adminMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware for CORS
 */
export declare function corsMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Input sanitization middleware
 */
export declare function sanitizeInputMiddleware(req: Request, _res: Response, next: NextFunction): void;
/**
 * Error handling middleware
 */
export declare function errorHandler(error: any, _req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=index.d.ts.map