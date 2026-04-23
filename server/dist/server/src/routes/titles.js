"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const middleware_1 = require("../middleware");
const types_1 = require("../../../src/types");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * GET /api/titles - Get all titles with filtering and pagination
 */
router.get('/', async (req, res) => {
    try {
        const { type, search, page = 1, limit = 12 } = req.query;
        const where = {};
        if (type && type !== 'ALL') {
            where.type = type;
        }
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { description: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [titles, total] = await Promise.all([
            prisma.title.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            prisma.title.count({ where }),
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
/**
 * GET /api/titles/:id - Get a specific title with reviews and stats
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const title = await prisma.title.findUnique({
            where: { id },
            include: {
                reviews: {
                    include: { user: true, replies: { include: { user: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!title) {
            res.status(404).json({ message: 'Title not found' });
            return;
        }
        // Calculate stats
        const reviews = title.reviews;
        const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
        // Check if user has favorited or in watchlist (if authenticated)
        let isFavorited = false;
        let watchlistStatus = null;
        if (req.user) {
            const [favorite, watchlist] = await Promise.all([
                prisma.favorite.findUnique({
                    where: {
                        userId_titleId: { userId: req.user.userId, titleId: id },
                    },
                }),
                prisma.watchlist.findUnique({
                    where: {
                        userId_titleId: { userId: req.user.userId, titleId: id },
                    },
                }),
            ]);
            isFavorited = !!favorite;
            watchlistStatus = watchlist?.status || null;
        }
        res.json({
            ...title,
            reviewCount: reviews.length,
            averageRating: Number(averageRating.toFixed(1)),
            isFavorited,
            watchlistStatus,
        });
    }
    catch (error) {
        console.error('Get title error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/titles - Create a new title (authenticated)
 */
router.post('/', middleware_1.authMiddleware, async (req, res) => {
    try {
        const { name, description, releaseYear, type, genres, coverImage } = req.body;
        if (!name || !description || !releaseYear || !type) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        // Validate type
        if (!Object.values(types_1.TitleType).includes(type)) {
            res.status(400).json({ message: 'Invalid title type' });
            return;
        }
        const title = await prisma.title.create({
            data: {
                name,
                description,
                releaseYear,
                type,
                genres: genres || [],
                coverImage,
            },
        });
        res.status(201).json(title);
    }
    catch (error) {
        console.error('Create title error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * DELETE /api/titles/:id - Delete a title (admin only)
 */
router.delete('/:id', middleware_1.authMiddleware, middleware_1.adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const title = await prisma.title.findUnique({ where: { id } });
        if (!title) {
            res.status(404).json({ message: 'Title not found' });
            return;
        }
        // Delete related data first
        await Promise.all([
            prisma.favorite.deleteMany({ where: { titleId: id } }),
            prisma.watchlist.deleteMany({ where: { titleId: id } }),
            prisma.review.deleteMany({ where: { titleId: id } }),
        ]);
        await prisma.title.delete({ where: { id } });
        res.json({ message: 'Title deleted successfully' });
    }
    catch (error) {
        console.error('Delete title error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=titles.js.map