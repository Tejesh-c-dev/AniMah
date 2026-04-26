"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const prisma_1 = require("../utils/prisma");
const types_1 = require("../../../src/types");
const router = (0, express_1.Router)();
/**
 * GET /api/admin/users - List all users
 */
router.get('/users', (0, middleware_1.authorize)(types_1.Role.ADMIN), async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { username: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    _count: { select: { reviews: true, favorites: true, watchlist: true } },
                },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        res.json({
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * DELETE /api/admin/users/:id - Delete a user
 */
router.delete('/users/:id', (0, middleware_1.authorize)(types_1.Role.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent deleting yourself
        if (id === req.user.userId) {
            res.status(400).json({ message: 'Cannot delete yourself' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Prevent deleting other admins
        if (user.role === types_1.Role.ADMIN) {
            res.status(403).json({ message: 'Cannot delete admin users' });
            return;
        }
        // Delete user and related data
        await Promise.all([
            prisma_1.prisma.favorite.deleteMany({ where: { userId: id } }),
            prisma_1.prisma.watchlist.deleteMany({ where: { userId: id } }),
            prisma_1.prisma.reviewVote.deleteMany({ where: { userId: id } }),
            prisma_1.prisma.reviewReply.deleteMany({ where: { userId: id } }),
            prisma_1.prisma.review.deleteMany({ where: { userId: id } }),
            prisma_1.prisma.user.delete({ where: { id } }),
        ]);
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * GET /api/admin/stats - Get admin dashboard statistics
 */
router.get('/stats', (0, middleware_1.authorize)(types_1.Role.ADMIN), async (_req, res) => {
    try {
        const [userCount, titleCount, reviewCount, watchlistCount, favoriteCount] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.title.count(),
            prisma_1.prisma.review.count(),
            prisma_1.prisma.watchlist.count(),
            prisma_1.prisma.favorite.count(),
        ]);
        // Get recent signups (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentSignups = await prisma_1.prisma.user.count({
            where: { createdAt: { gte: sevenDaysAgo } },
        });
        // Get admin count
        const adminCount = await prisma_1.prisma.user.count({
            where: { role: types_1.Role.ADMIN },
        });
        // Get trending titles
        const trendingTitles = await prisma_1.prisma.title.findMany({
            include: {
                _count: { select: { reviews: true, favorites: true } },
            },
            orderBy: { reviews: { _count: 'desc' } },
            take: 5,
        });
        // Get recent users
        const recentUsers = await prisma_1.prisma.user.findMany({
            select: { id: true, username: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        res.json({
            overview: {
                totalUsers: userCount,
                totalTitles: titleCount,
                totalReviews: reviewCount,
                totalWatchlistEntries: watchlistCount,
                totalFavorites: favoriteCount,
            },
            recentStats: {
                newUsersLast7Days: recentSignups,
                totalAdmins: adminCount,
            },
            trendingTitles,
            recentUsers,
        });
    }
    catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * PATCH /api/admin/users/:id/role - Change user role
 */
router.patch('/users/:id/role', (0, middleware_1.authorize)(types_1.Role.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role || !Object.values(types_1.Role).includes(role)) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }
        // Prevent changing your own role
        if (id === req.user.userId) {
            res.status(400).json({ message: 'Cannot change your own role' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Prevent demoting the last admin
        if (user.role === types_1.Role.ADMIN && role !== types_1.Role.ADMIN) {
            const adminCount = await prisma_1.prisma.user.count({
                where: { role: types_1.Role.ADMIN },
            });
            if (adminCount <= 1) {
                res.status(400).json({ message: 'Cannot demote the last admin user' });
                return;
            }
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Change user role error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/admin/users/:id/promote - Promote user to admin
 */
router.post('/users/:id/promote', (0, middleware_1.authorize)(types_1.Role.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent promoting yourself
        if (id === req.user.userId) {
            res.status(400).json({ message: 'Cannot promote yourself' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (user.role === types_1.Role.ADMIN) {
            res.status(400).json({ message: 'User is already an admin' });
            return;
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id },
            data: { role: types_1.Role.ADMIN },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        res.json({ ...updated, message: 'User promoted to admin' });
    }
    catch (error) {
        console.error('Promote user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/admin/users/:id/demote - Demote admin to user
 */
router.post('/users/:id/demote', (0, middleware_1.authorize)(types_1.Role.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent demoting yourself
        if (id === req.user.userId) {
            res.status(400).json({ message: 'Cannot demote yourself' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (user.role !== types_1.Role.ADMIN) {
            res.status(400).json({ message: 'User is not an admin' });
            return;
        }
        // Prevent demoting the last admin
        const adminCount = await prisma_1.prisma.user.count({
            where: { role: types_1.Role.ADMIN },
        });
        if (adminCount <= 1) {
            res.status(400).json({ message: 'Cannot demote the last admin user' });
            return;
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id },
            data: { role: types_1.Role.USER },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        res.json({ ...updated, message: 'Admin demoted to user' });
    }
    catch (error) {
        console.error('Demote user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * GET /api/admin/titles - List all titles (admin view)
 */
router.get('/titles', (0, middleware_1.authorize)(types_1.Role.ADMIN), async (req, res) => {
    try {
        const { search, type, page = 1, limit = 20 } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { description: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        if (type) {
            where.type = type;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [titles, total] = await Promise.all([
            prisma_1.prisma.title.findMany({
                where,
                include: {
                    _count: { select: { reviews: true, favorites: true, watchlist: true } },
                },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.title.count({ where }),
        ]);
        res.json({
            data: titles,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get titles error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map