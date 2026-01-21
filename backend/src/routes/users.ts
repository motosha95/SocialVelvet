import express from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { prisma } from '../db/client';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

export const usersRouter = express.Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

// Get current user profile
usersRouter.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
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
        createdAt: true,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
});
