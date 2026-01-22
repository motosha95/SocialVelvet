import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Required authentication middleware - returns 401 if no token
 */
export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured in environment variables');
      throw new AppError(500, 'Server configuration error');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        console.error('JWT verification failed:', jwtError.message);
        next(new AppError(401, 'Invalid token'));
        return;
      }
      if (jwtError instanceof jwt.TokenExpiredError) {
        console.error('JWT token expired');
        next(new AppError(401, 'Token expired'));
        return;
      }
      throw jwtError;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Optional authentication middleware - sets userId if token is valid, but doesn't require it
 */
export const optionalAuthenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    // If no auth header, continue without userId (public access)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.userId = undefined;
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured in environment variables');
      // Continue without userId if JWT_SECRET is missing
      req.userId = undefined;
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
      next();
    } catch (jwtError) {
      // If token is invalid, continue without userId (don't fail the request)
      // This allows public access while still using userId if token is valid
      req.userId = undefined;
      next();
    }
  } catch (err) {
    // On any error, continue without userId
    req.userId = undefined;
    next();
  }
};
