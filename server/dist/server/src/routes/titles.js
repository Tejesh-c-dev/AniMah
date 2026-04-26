"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const prisma_1 = require("../utils/prisma");
const types_1 = require("../../../src/types");
const router = (0, express_1.Router)();
const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024;
const titleTypeValues = Object.values(types_1.TitleType);
const normalizeTitleName = (name) => name.trim().toLowerCase();
const isTitleType = (value) => typeof value === 'string' && titleTypeValues.includes(value);
const sendHttpError = (next, status, message, details) => {
    next({ status, message, details });
};
const validateCoverImage = (coverImage, next) => {
    if (coverImage === undefined) {
        return true;
    }
    if (typeof coverImage !== 'string') {
        sendHttpError(next, 400, 'Cover image must be a valid string URL or data URL');
        return false;
    }
    if (coverImage.startsWith('data:image/')) {
        const commaIndex = coverImage.indexOf(',');
        if (commaIndex === -1) {
            sendHttpError(next, 400, 'Invalid cover image data URL format');
            return false;
        }
        const base64Payload = coverImage.slice(commaIndex + 1);
        const estimatedBytes = Math.ceil((base64Payload.length * 3) / 4);
        if (estimatedBytes > MAX_COVER_IMAGE_BYTES) {
            sendHttpError(next, 413, 'Cover image must be 5MB or smaller');
            return false;
        }
    }
    return true;
};
/**
 * GET /api/titles - Get all titles with filtering and pagination
 */
router.get('/', async (req, res, next) => {
    try {
        const { type, search, page = 1, limit = 12 } = req.query;
        const pageNumber = Number(page) > 0 ? Number(page) : 1;
        const take = Math.min(Math.max(Number(limit) || 12, 1), 50);
        const where = {};
        if (typeof type === 'string' && type !== 'ALL') {
            if (!isTitleType(type)) {
                sendHttpError(next, 400, 'Invalid title type');
                return;
            }
            where.type = type;
        }
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { description: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const skip = (pageNumber - 1) * take;
        const [titles, total] = await Promise.all([
            prisma_1.prisma.title.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    releaseYear: true,
                    type: true,
                    coverImage: true,
                    genres: true,
                    createdAt: true,
                },
            }),
            prisma_1.prisma.title.count({ where }),
        ]);
        // Public listing is read-heavy and safe to cache at the edge.
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        res.json({
            data: titles,
            pagination: {
                page: pageNumber,
                limit: take,
                total,
                pages: Math.ceil(total / take),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/titles/check-duplicate - Check if a title already exists
 */
router.get('/check-duplicate', async (req, res, next) => {
    try {
        const name = String(req.query.name || '').trim();
        const typeQuery = req.query.type;
        if (!name || typeof typeQuery !== 'string') {
            sendHttpError(next, 400, 'name and type query params are required');
            return;
        }
        if (!isTitleType(typeQuery)) {
            sendHttpError(next, 400, 'Invalid title type');
            return;
        }
        const type = typeQuery;
        const normalizedName = normalizeTitleName(name);
        const existing = await prisma_1.prisma.title.findFirst({
            where: { normalizedName, type },
            select: { id: true, name: true, type: true },
        });
        res.json({
            exists: !!existing,
            title: existing || null,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/titles/:id - Get a specific title with reviews and stats
 */
router.get('/:id', middleware_1.optionalAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const title = await prisma_1.prisma.title.findUnique({
            where: { id },
            include: {
                reviews: {
                    select: {
                        id: true,
                        rating: true,
                        content: true,
                        helpful: true,
                        notHelpful: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profileImage: true,
                            },
                        },
                        replies: {
                            select: {
                                id: true,
                                content: true,
                                createdAt: true,
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        profileImage: true,
                                    },
                                },
                            },
                            orderBy: { createdAt: 'asc' },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!title) {
            sendHttpError(next, 404, 'Title not found');
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
                prisma_1.prisma.favorite.findUnique({
                    where: {
                        userId_titleId: { userId: req.user.userId, titleId: id },
                    },
                }),
                prisma_1.prisma.watchlist.findUnique({
                    where: {
                        userId_titleId: { userId: req.user.userId, titleId: id },
                    },
                }),
            ]);
            isFavorited = !!favorite;
            watchlistStatus = watchlist?.status || null;
        }
        if (!req.user) {
            // Anonymous detail requests can be cached briefly.
            res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
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
        next(error);
    }
});
/**
 * POST /api/titles - Create a new title (authenticated)
 */
router.post('/', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res, next) => {
    try {
        const body = req.body;
        const { name, description, releaseYear, type, coverImage } = body;
        const normalizedGenres = Array.isArray(body.genres)
            ? body.genres
            : typeof body.genre === 'string'
                ? body.genre
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean)
                : [];
        const missingFields = [];
        if (!name)
            missingFields.push('name');
        if (!description)
            missingFields.push('description');
        if (!releaseYear)
            missingFields.push('releaseYear');
        if (!type)
            missingFields.push('type');
        if (missingFields.length > 0) {
            sendHttpError(next, 400, `Missing required field(s): ${missingFields.join(', ')}`);
            return;
        }
        // Validate type
        if (!Object.values(types_1.TitleType).includes(type)) {
            sendHttpError(next, 400, 'Invalid title type');
            return;
        }
        if (!validateCoverImage(coverImage, next)) {
            return;
        }
        const normalizedName = normalizeTitleName(name);
        const duplicate = await prisma_1.prisma.title.findFirst({
            where: { normalizedName, type },
            select: { id: true },
        });
        if (duplicate) {
            sendHttpError(next, 409, 'A title with this name and type already exists', {
                existingTitleId: duplicate.id,
            });
            return;
        }
        const title = await prisma_1.prisma.title.create({
            data: {
                name,
                normalizedName,
                description,
                releaseYear,
                type,
                genres: normalizedGenres,
                coverImage,
                creatorId: req.user.userId,
            },
        });
        res.status(201).json(title);
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/titles/:id - Update an existing title (owner or admin)
 */
router.put('/:id', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res, next) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const { name, description, releaseYear, type, coverImage } = body;
        const normalizedGenres = Array.isArray(body.genres)
            ? body.genres
            : typeof body.genre === 'string'
                ? body.genre
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean)
                : undefined;
        const title = await prisma_1.prisma.title.findUnique({ where: { id } });
        if (!title) {
            sendHttpError(next, 404, 'Title not found');
            return;
        }
        const missingFields = [];
        if (!name)
            missingFields.push('name');
        if (!description)
            missingFields.push('description');
        if (!releaseYear)
            missingFields.push('releaseYear');
        if (!type)
            missingFields.push('type');
        if (missingFields.length > 0) {
            sendHttpError(next, 400, `Missing required field(s): ${missingFields.join(', ')}`);
            return;
        }
        if (!isTitleType(type)) {
            sendHttpError(next, 400, 'Invalid title type');
            return;
        }
        if (typeof name !== 'string') {
            sendHttpError(next, 400, 'Invalid title name');
            return;
        }
        const isAdmin = req.user.role === types_1.Role.ADMIN;
        const isOwner = title.creatorId === req.user.userId;
        if (!isAdmin && !isOwner) {
            sendHttpError(next, 403, 'You are not authorized to edit this title');
            return;
        }
        const nextType = type;
        const nextName = name.trim();
        const normalizedName = normalizeTitleName(nextName);
        const duplicate = await prisma_1.prisma.title.findFirst({
            where: {
                normalizedName,
                type: nextType,
                id: { not: id },
            },
            select: { id: true },
        });
        if (duplicate) {
            sendHttpError(next, 409, 'A title with this name and type already exists', {
                existingTitleId: duplicate.id,
            });
            return;
        }
        if (!validateCoverImage(coverImage, next)) {
            return;
        }
        const updated = await prisma_1.prisma.title.update({
            where: { id },
            data: {
                name: nextName,
                normalizedName,
                description: description ?? title.description,
                releaseYear: releaseYear ?? title.releaseYear,
                type: nextType,
                genres: normalizedGenres ?? title.genres,
                coverImage: coverImage === undefined ? title.coverImage : coverImage,
            },
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/titles/:id - Delete a title (owner or admin)
 */
router.delete('/:id', (0, middleware_1.authorize)(types_1.Role.USER, types_1.Role.ADMIN), async (req, res, next) => {
    try {
        const { id } = req.params;
        const title = await prisma_1.prisma.title.findUnique({ where: { id } });
        if (!title) {
            sendHttpError(next, 404, 'Title not found');
            return;
        }
        const isAdmin = req.user.role === types_1.Role.ADMIN;
        const isOwner = title.creatorId === req.user.userId;
        if (!isAdmin && !isOwner) {
            sendHttpError(next, 403, 'You are not authorized to delete this title');
            return;
        }
        // Delete related data first
        await Promise.all([
            prisma_1.prisma.favorite.deleteMany({ where: { titleId: id } }),
            prisma_1.prisma.watchlist.deleteMany({ where: { titleId: id } }),
            prisma_1.prisma.review.deleteMany({ where: { titleId: id } }),
        ]);
        await prisma_1.prisma.title.delete({ where: { id } });
        res.json({ message: 'Title deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=titles.js.map