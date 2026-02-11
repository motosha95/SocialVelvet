import express from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { prisma } from '../db/client';
import { AppError } from '../middleware/errorHandler';
import { followsService } from '../services/follows';
import { challengesService } from '../services/challenges';
import { calculatePointsForAttendance, getEffectivePriceForPoints } from '../constants/gamification';
import { z } from 'zod';

export const usersRouter = express.Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

// Get current user profile (syncs points from admitted events if out of date)
usersRouter.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    const baseSelect = {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    } as const;

    let user: { id: string; email: string; name: string; avatarUrl: string | null; bio: string | null; createdAt: Date; points?: number } | null;

    try {
      user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { ...baseSelect, points: true },
      });
    } catch (dbErr) {
      console.error('GET /users/me findUnique failed:', dbErr);
      // Fallback: fetch without points (in case points column is missing or Prisma client is stale)
      user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: baseSelect,
      });
      if (user) {
        (user as { points?: number }).points = 0;
      }
    }

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Sync points: if user has admitted events but points are lower than expected, recalculate
    try {
      const admittedAttendees = await prisma.eventAttendee.findMany({
        where: {
          userId: req.userId,
          admittedAt: { not: null },
        },
        include: {
          event: { select: { price: true, pricingTiers: true } },
        },
      });
      const expectedPoints = admittedAttendees.reduce((sum, a) => {
        const effectivePrice = getEffectivePriceForPoints(
          a.event.price != null ? Number(a.event.price) : null,
          Array.isArray(a.event.pricingTiers) ? (a.event.pricingTiers as Array<{ name: string; price: number }>) : null
        );
        return sum + calculatePointsForAttendance(effectivePrice);
      }, 0);
      const currentPoints = user.points ?? 0;
      if (expectedPoints > currentPoints) {
        await prisma.user.update({
          where: { id: req.userId },
          data: { points: expectedPoints },
        });
        user = { ...user, points: expectedPoints };
      }
    } catch (syncErr) {
      console.warn('Failed to sync points:', syncErr);
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Update profile
usersRouter.patch('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    const body = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: body,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        points: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Get current user's challenges with progress
usersRouter.get('/me/challenges', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }
    const result = await challengesService.getChallengesWithProgress(req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get list of user IDs the current user follows
usersRouter.get('/me/following', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }
    const followingIds = await followsService.getFollowingIds(req.userId);
    res.json({ followingIds });
  } catch (err) {
    next(err);
  }
});

// Check if current user follows a given user (param = user to check)
usersRouter.get('/:id/following/check', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }
    const targetId = req.params.id;
    const following = await followsService.isFollowing(req.userId, targetId);
    res.json({ following });
  } catch (err) {
    next(err);
  }
});

// Follow a user (param = user to follow)
usersRouter.post('/:id/follow', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }
    const targetId = req.params.id;
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      throw new AppError(404, 'User not found');
    }
    await followsService.follow(req.userId, targetId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Unfollow a user (param = user to unfollow)
usersRouter.delete('/:id/follow', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }
    const targetId = req.params.id;
    await followsService.unfollow(req.userId, targetId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
