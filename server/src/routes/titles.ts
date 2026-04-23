import { Router, Request, Response, NextFunction } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { authorize, optionalAuth } from '../middleware';
import { CreateTitleRequest, Role, TitleType } from '../../../src/types';

const router = Router();
const prisma = new PrismaClient();
const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024;
const titleTypeValues = Object.values(TitleType) as TitleType[];

const normalizeTitleName = (name: string) => name.trim().toLowerCase();
const isTitleType = (value: unknown): value is TitleType =>
  typeof value === 'string' && titleTypeValues.includes(value as TitleType);

const sendHttpError = (
  next: NextFunction,
  status: number,
  message: string,
  details?: unknown
) => {
  next({ status, message, details });
};

const validateCoverImage = (coverImage: unknown, next: NextFunction): coverImage is string | undefined => {
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
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, search, page = 1, limit = 12 } = req.query;

    const where: Prisma.TitleWhereInput = {};

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
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/titles/check-duplicate - Check if a title already exists
 */
router.get('/check-duplicate', async (req: Request, res: Response, next: NextFunction) => {
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
    const existing = await prisma.title.findFirst({
      where: { normalizedName, type },
      select: { id: true, name: true, type: true },
    });

    res.json({
      exists: !!existing,
      title: existing || null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/titles/:id - Get a specific title with reviews and stats
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
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
      sendHttpError(next, 404, 'Title not found');
      return;
    }

    // Calculate stats
    const reviews = title.reviews;
    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

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
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/titles - Create a new title (authenticated)
 */
router.post('/', authorize(Role.USER, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreateTitleRequest & { genre?: string; genres?: string[] };
    const { name, description, releaseYear, type, coverImage } = body;
    const normalizedGenres =
      Array.isArray(body.genres)
        ? body.genres
        : typeof body.genre === 'string'
          ? body.genre
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          : [];

    const missingFields: string[] = [];
    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (!releaseYear) missingFields.push('releaseYear');
    if (!type) missingFields.push('type');

    if (missingFields.length > 0) {
      sendHttpError(next, 400, `Missing required field(s): ${missingFields.join(', ')}`);
      return;
    }

    // Validate type
    if (!Object.values(TitleType).includes(type)) {
      sendHttpError(next, 400, 'Invalid title type');
      return;
    }

    if (!validateCoverImage(coverImage, next)) {
      return;
    }

    const normalizedName = normalizeTitleName(name);

    const duplicate = await prisma.title.findFirst({
      where: { normalizedName, type },
      select: { id: true },
    });

    if (duplicate) {
      sendHttpError(next, 409, 'A title with this name and type already exists', {
        existingTitleId: duplicate.id,
      });
      return;
    }

    const title = await prisma.title.create({
      data: {
        name,
        normalizedName,
        description,
        releaseYear,
        type,
        genres: normalizedGenres,
        coverImage,
        creatorId: req.user!.userId,
      },
    });

    res.status(201).json(title);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/titles/:id - Update an existing title (owner or admin)
 */
router.put('/:id', authorize(Role.USER, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body as Partial<CreateTitleRequest> & { genre?: string; genres?: string[] };
    const { name, description, releaseYear, type, coverImage } = body;

    const normalizedGenres =
      Array.isArray(body.genres)
        ? body.genres
        : typeof body.genre === 'string'
          ? body.genre
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          : undefined;

    const title = await prisma.title.findUnique({ where: { id } });
    if (!title) {
      sendHttpError(next, 404, 'Title not found');
      return;
    }

    const missingFields: string[] = [];
    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (!releaseYear) missingFields.push('releaseYear');
    if (!type) missingFields.push('type');

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

    const isAdmin = req.user!.role === Role.ADMIN;
    const isOwner = title.creatorId === req.user!.userId;
    if (!isAdmin && !isOwner) {
      sendHttpError(next, 403, 'You are not authorized to edit this title');
      return;
    }

    const nextType = type;
    const nextName = name.trim();
    const normalizedName = normalizeTitleName(nextName);

    const duplicate = await prisma.title.findFirst({
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

    const updated = await prisma.title.update({
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
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/titles/:id - Delete a title (owner or admin)
 */
router.delete('/:id', authorize(Role.USER, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const title = await prisma.title.findUnique({ where: { id } });

    if (!title) {
      sendHttpError(next, 404, 'Title not found');
      return;
    }

    const isAdmin = req.user!.role === Role.ADMIN;
    const isOwner = title.creatorId === req.user!.userId;
    if (!isAdmin && !isOwner) {
      sendHttpError(next, 403, 'You are not authorized to delete this title');
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
  } catch (error) {
    next(error);
  }
});

export default router;
