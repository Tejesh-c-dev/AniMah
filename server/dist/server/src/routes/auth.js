"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../utils/auth");
const middleware_1 = require("../middleware");
const prisma_1 = require("../utils/prisma");
const types_1 = require("../../../src/types");
const router = (0, express_1.Router)();
const isProduction = process.env.NODE_ENV === 'production';
const rawSameSite = process.env.AUTH_COOKIE_SAMESITE?.trim().toLowerCase();
const cookieSameSite = rawSameSite === 'lax' || rawSameSite === 'none'
    ? rawSameSite
    : isProduction
        ? 'none'
        : 'lax';
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;
const authCookieOptions = {
    httpOnly: true,
    sameSite: cookieSameSite,
    secure: isProduction || cookieSameSite === 'none',
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const getAuthValidationError = (username, email, password) => {
    if (!username || !email || !password) {
        return 'Missing required fields';
    }
    if (username.trim().length < 3) {
        return 'Username must be at least 3 characters';
    }
    if (!EMAIL_REGEX.test(email)) {
        return 'Please provide a valid email address';
    }
    if (password.length < 8) {
        return 'Password must be at least 8 characters';
    }
    return null;
};
/**
 * POST /api/auth/register - Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const validationError = getAuthValidationError(username, email, password);
        if (validationError) {
            res.status(400).json({ message: validationError });
            return;
        }
        const normalizedUsername = (username ?? '').trim();
        const normalizedEmail = (email ?? '').trim().toLowerCase();
        // Check if user already exists
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: { OR: [{ email: normalizedEmail }, { username: normalizedUsername }] },
        });
        if (existingUser) {
            res.status(409).json({ message: 'User already exists' });
            return;
        }
        // Hash password
        const passwordHash = await (0, auth_1.hashPassword)(password);
        // Create user
        const user = await prisma_1.prisma.user.create({
            data: {
                username: normalizedUsername,
                email: normalizedEmail,
                passwordHash,
                role: types_1.Role.USER,
            },
        });
        // Generate token
        const token = (0, auth_1.signToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
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
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError
            && error.code === 'P2002') {
            res.status(409).json({ message: 'User already exists' });
            return;
        }
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/auth/login - Login a user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Missing email or password' });
            return;
        }
        // Find user
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: 'insensitive',
                },
            },
        });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Compare password
        const isPasswordValid = await (0, auth_1.comparePassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Generate token
        const token = (0, auth_1.signToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
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
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/auth/logout - Logout user
 */
router.post('/logout', (_req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: cookieSameSite,
        secure: isProduction || cookieSameSite === 'none',
        ...(cookieDomain ? { domain: cookieDomain } : {}),
        path: '/',
    });
    res.json({ message: 'Logged out successfully' });
});
/**
 * GET /api/auth/me - Get current user
 */
router.get('/me', middleware_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                profileImage: true,
                bio: true,
            },
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
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/auth/admin/bootstrap - One-time admin setup
 */
router.post('/admin/bootstrap', async (req, res) => {
    try {
        const { username, email, password, setupKey } = req.body;
        const validationError = getAuthValidationError(username, email, password);
        if (validationError) {
            res.status(400).json({ message: validationError });
            return;
        }
        const normalizedUsername = String(username).trim();
        const normalizedEmail = String(email).trim().toLowerCase();
        // Validate setup key
        if (setupKey !== process.env.ADMIN_SETUP_KEY) {
            res.status(403).json({ message: 'Invalid setup key' });
            return;
        }
        // Check if admin already exists
        const existingAdmin = await prisma_1.prisma.user.findFirst({
            where: { role: types_1.Role.ADMIN },
        });
        if (existingAdmin) {
            res.status(409).json({ message: 'Admin already exists' });
            return;
        }
        // Hash password
        const passwordHash = await (0, auth_1.hashPassword)(password);
        // Create admin user
        const admin = await prisma_1.prisma.user.create({
            data: {
                username: normalizedUsername,
                email: normalizedEmail,
                passwordHash,
                role: types_1.Role.ADMIN,
            },
        });
        // Generate token
        const token = (0, auth_1.signToken)({
            userId: admin.id,
            email: admin.email,
            role: admin.role,
        });
        res.cookie('token', token, authCookieOptions);
        res.status(201).json({
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            },
        });
    }
    catch (error) {
        console.error('Admin bootstrap error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/auth/admin/login - Admin login
 */
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Missing email or password' });
            return;
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: 'insensitive',
                },
            },
        });
        if (!user || user.role !== types_1.Role.ADMIN) {
            res.status(401).json({ message: 'Invalid credentials or not an admin' });
            return;
        }
        const isPasswordValid = await (0, auth_1.comparePassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const token = (0, auth_1.signToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        res.cookie('token', token, authCookieOptions);
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map