"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * GET /api/favorites - Get current user's favorites
 */
router.get('/', middleware_1.authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 12 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [favorites, total] = await Promise.all([
            prisma.favorite.findMany({
                where: { userId: req.user.userId },
                include: { title: true },
                skip,
                take: Number(limit),
                orderBy: { addedAt: 'desc' },
            }),
            prisma.favorite.count({ where: { userId: req.user.userId } }),
        ]);
        res.json({
            data: favorites,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/favorites - Add to favorites
 */
router.post('/', middleware_1.authMiddleware, async (req, res) => {
    try {
        const { titleId } = req.body;
        if (!titleId) {
            res.status(400).json({ message: 'Missing titleId' });
            return;
        }
        // Check if title exists
        const title = await prisma.title.findUnique({ where: { id: titleId } });
        if (!title) {
            res.status(404).json({ message: 'Title not found' });
            return;
        }
        // Check if already favorited
        const existing = await prisma.favorite.findUnique({
            where: {
                userId_titleId: { userId: req.user.userId, titleId },
            },
        });
        if (existing) {
            res.status(409).json({ message: 'Already in favorites' });
            return;
        }
        const favorite = await prisma.favorite.create({
            data: {
                userId: req.user.userId,
                titleId,
            },
            include: { title: true },
        });
        res.status(201).json(favorite);
    }
    catch (error) {
        console.error('Add to favorites error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * DELETE /api/favorites/:titleId - Remove from favorites
 */
router.delete('/:titleId', middleware_1.authMiddleware, async (req, res) => {
    try {
        const { titleId } = req.params;
        const favorite = await prisma.favorite.findUnique({
            where: {
                userId_titleId: { userId: req.user.userId, titleId },
            },
        });
        if (!favorite) {
            res.status(404).json({ message: 'Not in favorites' });
            return;
        }
        await prisma.favorite.delete({
            where: {
                userId_titleId: { userId: req.user.userId, titleId },
            },
        });
        res.json({ message: 'Removed from favorites' });
    }
    catch (error) {
        console.error('Remove from favorites error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/favorites/toggle/:titleId - Toggle favorite status
 */
router.post('/toggle/:titleId', middleware_1.authMiddleware, async (req, res) => {
    try {
        const { titleId } = req.params;
        // Check if title exists
        const title = await prisma.title.findUnique({ where: { id: titleId } });
        if (!title) {
            res.status(404).json({ message: 'Title not found' });
            return;
        }
        const existing = await prisma.favorite.findUnique({
            where: {
                userId_titleId: { userId: req.user.userId, titleId },
            },
        });
        if (existing) {
            // Remove from favorites
            await prisma.favorite.delete({
                where: {
                    userId_titleId: { userId: req.user.userId, titleId },
                },
            });
            res.json({ message: 'Removed from favorites', isFavorited: false });
        }
        else {
            // Add to favorites
            await prisma.favorite.create({
                data: {
                    userId: req.user.userId,
                    titleId,
                },
            });
            res.json({ message: 'Added to favorites', isFavorited: true });
        }
    }
    catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * GET /api/favorites/check/:titleId - Check if title is favorited
 */
router.get('/check/:titleId', middleware_1.authMiddleware, async (req, res) => {
    try {
        const { titleId } = req.params;
        const favorite = await prisma.favorite.findUnique({
            where: {
                userId_titleId: { userId: req.user.userId, titleId },
            },
        });
        res.json({ isFavorited: !!favorite });
    }
    catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=favorites.js.map