"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const prisma_1 = require("../utils/prisma");
const types_1 = require("../../../src/types");
const router = (0, express_1.Router)();
/**
 * GET /api/reviews/:titleId - Get reviews for a title
 */
router.get('/:titleId', async (req, res) => {
    try {
        const { titleId } = req.params;
        const { sort = 'latest', page = 1, limit = 10 } = req.query;
        const orderBy = sort === 'top-rated'
            ? { rating: 'desc' }
            : sort === 'most-helpful'
                ? { helpful: 'desc' }
                : { createdAt: 'desc' };
        const skip = (Number(page) - 1) * Number(limit);
        const [reviews, total] = await Promise.all([
            prisma_1.prisma.review.findMany({
                where: { titleId },
                include: {
                    user: { select: { id: true, username: true, profileImage: true } },
                    replies: {
                        include: {
                            user: { select: { id: true, username: true, profileImage: true } },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
                skip,
                take: Number(limit),
                orderBy,
            }),
            prisma_1.prisma.review.count({ where: { titleId } }),
        ]);
        res.json({
            data: reviews,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/reviews - Create a review
 */
router.post('/', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res) => {
    try {
        const { titleId, rating, content } = req.body;
        if (!titleId || !rating || !content) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        // Validate rating
        if (rating < 1 || rating > 10) {
            res.status(400).json({ message: 'Rating must be between 1 and 10' });
            return;
        }
        // Check if user already reviewed this title
        const existingReview = await prisma_1.prisma.review.findUnique({
            where: {
                userId_titleId: { userId: req.user.userId, titleId },
            },
        });
        if (existingReview) {
            res.status(409).json({ message: 'You have already reviewed this title' });
            return;
        }
        const review = await prisma_1.prisma.review.create({
            data: {
                userId: req.user.userId,
                titleId,
                rating,
                content,
            },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
            },
        });
        res.status(201).json(review);
    }
    catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * PUT /api/reviews/:id - Update a review
 */
router.put('/:id', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, content } = req.body;
        const review = await prisma_1.prisma.review.findUnique({ where: { id } });
        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }
        if (review.userId !== req.user.userId) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        const updated = await prisma_1.prisma.review.update({
            where: { id },
            data: {
                rating: rating || review.rating,
                content: content || review.content,
            },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * DELETE /api/reviews/:id - Delete a review
 */
router.delete('/:id', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const review = await prisma_1.prisma.review.findUnique({ where: { id } });
        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }
        if (review.userId !== req.user.userId) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        await Promise.all([
            prisma_1.prisma.reviewVote.deleteMany({ where: { reviewId: id } }),
            prisma_1.prisma.reviewReply.deleteMany({ where: { reviewId: id } }),
        ]);
        await prisma_1.prisma.review.delete({ where: { id } });
        res.json({ message: 'Review deleted successfully' });
    }
    catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/reviews/:id/vote - Vote on a review (helpful/not helpful)
 */
router.post('/:id/vote', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { isHelpful } = req.body;
        if (typeof isHelpful !== 'boolean') {
            res.status(400).json({ message: 'isHelpful must be boolean' });
            return;
        }
        const review = await prisma_1.prisma.review.findUnique({ where: { id } });
        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }
        // Check if user already voted
        const existingVote = await prisma_1.prisma.reviewVote.findUnique({
            where: {
                userId_reviewId: { userId: req.user.userId, reviewId: id },
            },
        });
        if (existingVote) {
            res.status(409).json({ message: 'You have already voted on this review' });
            return;
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.reviewVote.create({
                data: {
                    userId: req.user.userId,
                    reviewId: id,
                    isHelpful,
                },
            });
            await tx.review.update({
                where: { id },
                data: isHelpful
                    ? { helpful: { increment: 1 } }
                    : { notHelpful: { increment: 1 } },
            });
        });
        res.json({ message: 'Vote recorded successfully' });
    }
    catch (error) {
        console.error('Vote on review error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
/**
 * POST /api/reviews/:id/reply - Add a reply to a review
 */
router.post('/:id/reply', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        if (!content) {
            res.status(400).json({ message: 'Missing content' });
            return;
        }
        const review = await prisma_1.prisma.review.findUnique({ where: { id } });
        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }
        const reply = await prisma_1.prisma.reviewReply.create({
            data: {
                userId: req.user.userId,
                reviewId: id,
                content,
            },
            include: {
                user: { select: { id: true, username: true, profileImage: true } },
            },
        });
        res.status(201).json(reply);
    }
    catch (error) {
        console.error('Create reply error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=reviews.js.map