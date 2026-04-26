"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const prisma_1 = require("../utils/prisma");
const types_1 = require("../../../src/types");
const router = (0, express_1.Router)();
/**
 * GET /api/watchlist - Get current user's watchlist
 */
router.get('/', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res) => {
    try {
        const { status, page = 1, limit = 12 } = req.query;
        const where = { userId: req.user.userId };
        if (status) {
            where.status = status;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [watchlist, total] = await Promise.all([
            prisma_1.prisma.watchlist.findMany({
                where,
                include: {
                    title: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            releaseYear: true,
                            coverImage: true,
                        },
                    },
                },
                skip,
                take: Number(limit),
                orderBy: { addedAt: 'desc' },
            }),
            prisma_1.prisma.watchlist.count({ where }),
        ]);
        res.json({
            data: watchlist,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get watchlist error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/watchlist - Add title to watchlist
 */
router.post('/', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res) => {
    try {
        const { titleId, status } = req.body;
        if (!titleId || !status) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        // Validate status
        if (!Object.values(types_1.WatchStatus).includes(status)) {
            res.status(400).json({ message: 'Invalid watch status' });
            return;
        }
        // Check if title exists
        const title = await prisma_1.prisma.title.findUnique({ where: { id: titleId } });
        if (!title) {
            res.status(404).json({ message: 'Title not found' });
            return;
        }
        // Check if already in watchlist
        const existing = await prisma_1.prisma.watchlist.findUnique({
            where: {
                userId_titleId: { userId: req.user.userId, titleId },
            },
        });
        if (existing) {
            res.status(409).json({ message: 'Title already in watchlist' });
            return;
        }
        const watchlist = await prisma_1.prisma.watchlist.create({
            data: {
                userId: req.user.userId,
                titleId,
                status,
            },
            include: { title: true },
        });
        res.status(201).json(watchlist);
    }
    catch (error) {
        console.error('Add to watchlist error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * PUT /api/watchlist/:id - Update watchlist status
 */
router.put('/:id', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            res.status(400).json({ message: 'Missing status' });
            return;
        }
        let watchlist = await prisma_1.prisma.watchlist.findUnique({ where: { id } });
        // Backward compatibility: if caller sends a titleId in path, resolve it.
        if (!watchlist) {
            watchlist = await prisma_1.prisma.watchlist.findUnique({
                where: {
                    userId_titleId: {
                        userId: req.user.userId,
                        titleId: id,
                    },
                },
            });
        }
        if (!watchlist) {
            res.status(404).json({ message: 'Watchlist entry not found' });
            return;
        }
        if (watchlist.userId !== req.user.userId) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        const updated = await prisma_1.prisma.watchlist.update({
            where: { id: watchlist.id },
            data: { status },
            include: {
                title: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        releaseYear: true,
                        coverImage: true,
                    },
                },
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Update watchlist error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * DELETE /api/watchlist/:id - Remove from watchlist
 */
router.delete('/:id', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        let watchlist = await prisma_1.prisma.watchlist.findUnique({ where: { id } });
        if (!watchlist) {
            watchlist = await prisma_1.prisma.watchlist.findUnique({
                where: {
                    userId_titleId: {
                        userId: req.user.userId,
                        titleId: id,
                    },
                },
            });
        }
        if (!watchlist) {
            res.status(404).json({ message: 'Watchlist entry not found' });
            return;
        }
        if (watchlist.userId !== req.user.userId) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        await prisma_1.prisma.watchlist.delete({ where: { id: watchlist.id } });
        res.json({ message: 'Removed from watchlist' });
    }
    catch (error) {
        console.error('Remove from watchlist error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * GET /api/watchlist/stats - Get watchlist statistics
 */
router.get('/stats', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res) => {
    try {
        const counts = await Promise.all([
            prisma_1.prisma.watchlist.count({
                where: { userId: req.user.userId, status: types_1.WatchStatus.PLAN_TO_WATCH },
            }),
            prisma_1.prisma.watchlist.count({
                where: { userId: req.user.userId, status: types_1.WatchStatus.WATCHING },
            }),
            prisma_1.prisma.watchlist.count({
                where: { userId: req.user.userId, status: types_1.WatchStatus.COMPLETED },
            }),
            prisma_1.prisma.watchlist.count({
                where: { userId: req.user.userId, status: types_1.WatchStatus.DROPPED },
            }),
        ]);
        res.json({
            planToWatch: counts[0],
            watching: counts[1],
            completed: counts[2],
            dropped: counts[3],
            total: counts[0] + counts[1] + counts[2] + counts[3],
        });
    }
    catch (error) {
        console.error('Get watchlist stats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=watchlist.js.map