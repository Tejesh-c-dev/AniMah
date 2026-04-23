"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../utils/auth");
const middleware_1 = require("../middleware");
const types_1 = require("../../../src/types");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * POST /api/auth/register - Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
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
        const passwordHash = await (0, auth_1.hashPassword)(password);
        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
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
        res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800`);
        res.status(201).json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            token,
        });
    }
    catch (error) {
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
        const user = await prisma.user.findUnique({ where: { email } });
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
        res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800`);
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            token,
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
    res.setHeader('Set-Cookie', `token=; HttpOnly; Path=/; Max-Age=0`);
    res.json({ message: 'Logged out successfully' });
});
/**
 * GET /api/auth/me - Get current user
 */
router.get('/me', middleware_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
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
        // Validate setup key
        if (setupKey !== process.env.ADMIN_SETUP_KEY) {
            res.status(403).json({ message: 'Invalid setup key' });
            return;
        }
        // Check if admin already exists
        const existingAdmin = await prisma.user.findFirst({
            where: { role: types_1.Role.ADMIN },
        });
        if (existingAdmin) {
            res.status(409).json({ message: 'Admin already exists' });
            return;
        }
        // Hash password
        const passwordHash = await (0, auth_1.hashPassword)(password);
        // Create admin user
        const admin = await prisma.user.create({
            data: {
                username,
                email,
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
        res.status(201).json({
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            },
            token,
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
        const user = await prisma.user.findUnique({ where: { email } });
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
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            token,
        });
    }
    catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map