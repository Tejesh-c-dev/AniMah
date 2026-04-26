import { Request, Response, NextFunction } from 'express';
import { JWTPayload, Role } from '../../../src/types';
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
export declare function authorize(...roles: Role[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional auth parser for public routes that can still use user context.
 */
export declare function optionalAuth(req: Request, _res: Response, next: NextFunction): void;
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const adminMiddleware: (req: Request, res: Response, next: NextFunction) => void;
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