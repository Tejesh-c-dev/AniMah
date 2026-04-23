import { JWTPayload } from '../../../src/types';
/**
 * Sign a JWT token
 */
export declare function signToken(payload: JWTPayload): string;
/**
 * Verify and decode a JWT token
 */
export declare function verifyToken(token: string): JWTPayload | null;
/**
 * Hash a password
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compare a password with its hash
 */
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
/**
 * Extract token from Authorization header or cookies
 */
export declare function extractTokenFromRequest(req: any): string | null;
//# sourceMappingURL=auth.d.ts.map