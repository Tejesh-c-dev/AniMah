import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authorize } from '../middleware';
import { Role } from '../../../src/types';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/users - List all users
 */
router.get('/users', authorize(Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where }),
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
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/users/:id - Delete a user
 */
router.delete('/users/:id', authorize(Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user!.userId) {
      res.status(400).json({ message: 'Cannot delete yourself' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Prevent deleting other admins
    if (user.role === Role.ADMIN) {
      res.status(403).json({ message: 'Cannot delete admin users' });
      return;
    }

    // Delete user and related data
    await Promise.all([
      prisma.favorite.deleteMany({ where: { userId: id } }),
      prisma.watchlist.deleteMany({ where: { userId: id } }),
      prisma.reviewVote.deleteMany({ where: { userId: id } }),
      prisma.reviewReply.deleteMany({ where: { userId: id } }),
      prisma.review.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/role - Change user role
 */
router.patch(
  '/users/:id/role',
  authorize(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !Object.values(Role).includes(role)) {
        res.status(400).json({ message: 'Invalid role' });
        return;
      }

      // Prevent changing your own role
      if (id === req.user!.userId) {
        res.status(400).json({ message: 'Cannot change your own role' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const updated = await prisma.user.update({
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
    } catch (error) {
      console.error('Change user role error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * GET /api/admin/titles - List all titles (admin view)
 */
router.get('/titles', authorize(Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { search, type, page = 1, limit = 20 } = req.query;

    const where: any = {};

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
      prisma.title.findMany({
        where,
        include: {
          _count: { select: { reviews: true, favorites: true, watchlist: true } },
        },
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
    console.error('Get titles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/stats - Get admin dashboard statistics
 */
router.get('/stats', authorize(Role.ADMIN), async (_req: Request, res: Response) => {
  try {
    const [userCount, titleCount, reviewCount, watchlistCount, favoriteCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.title.count(),
        prisma.review.count(),
        prisma.watchlist.count(),
        prisma.favorite.count(),
      ]);

    // Get trending titles
    const trendingTitles = await prisma.title.findMany({
      include: {
        _count: { select: { reviews: true, favorites: true } },
      },
      orderBy: { reviews: { _count: 'desc' } },
      take: 5,
    });

    // Get recent users
    const recentUsers = await prisma.user.findMany({
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
      trendingTitles,
      recentUsers,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
