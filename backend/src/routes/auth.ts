import express from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export const authRouter = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Register
authRouter.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new AppError(400, 'Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(body.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: hashedPassword,
      },
    });

    // Generate token
    const accessToken = generateToken(user.id);

    res.status(201).json({
      accessToken,
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
});

// Login
authRouter.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Verify password
    const isValid = await comparePassword(body.password, user.password);

    if (!isValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Generate token
    const accessToken = generateToken(user.id);

    res.json({
      accessToken,
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
});
