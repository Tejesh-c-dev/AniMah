import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { JWTPayload } from '../../../src/types';

const resolveJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.trim().length >= 32) {
    return secret;
  }

  throw new Error('JWT_SECRET is required and must be at least 32 characters.');
};

const JWT_SECRET = resolveJwtSecret();
const JWT_EXPIRY = '7d';
const SALT_ROUNDS = 10;

/**
 * Sign a JWT token
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Extract token from Authorization header or cookies
 */
export function extractTokenFromRequest(req: any): string | null {
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
}
