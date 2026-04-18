import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, signToken } from '../utils/auth';
import { authMiddleware } from '../middleware';
import { AuthRequest, Role } from '../../../src/types';

const router = Router();
const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';
const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * POST /api/auth/register - Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body as AuthRequest;

    // Validate input
    if (!username || !email || !password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: Role.USER,
      },
    });

    // Generate token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    });

    // Set cookie
    res.cookie('token', token, authCookieOptions);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login - Login a user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as AuthRequest;

    if (!email || !password) {
      res.status(400).json({ message: 'Missing email or password' });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    });

    // Set cookie
    res.cookie('token', token, authCookieOptions);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout - Logout user
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
  });
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me - Get current user
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      bio: user.bio,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/admin/bootstrap - One-time admin setup
 */
router.post('/admin/bootstrap', async (req: Request, res: Response) => {
  try {
    const { username, email, password, setupKey } = req.body;

    // Validate setup key
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      res.status(403).json({ message: 'Invalid setup key' });
      return;
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
    });

    if (existingAdmin) {
      res.status(409).json({ message: 'Admin already exists' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: Role.ADMIN,
      },
    });

    // Generate token
    const token = signToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role as Role,
    });

    res.cookie('token', token, authCookieOptions);

    res.status(201).json({
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
      token,
    });
  } catch (error) {
    console.error('Admin bootstrap error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/admin/login - Admin login
 */
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Missing email or password' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.role !== Role.ADMIN) {
      res.status(401).json({ message: 'Invalid credentials or not an admin' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    });

    res.cookie('token', token, authCookieOptions);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
