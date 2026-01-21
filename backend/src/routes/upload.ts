import express from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { upload, getImageUrl } from '../services/upload';
import { AppError } from '../middleware/errorHandler';

export const uploadRouter = express.Router();

// Upload single image
uploadRouter.post('/image', authenticate, upload.single('image'), (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No image file provided');
    }

    // Construct full URL
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const imageUrl = getImageUrl(req.file.filename, baseUrl);
    
    res.json({
      imageUrl,
      filename: req.file.filename,
    });
  } catch (err) {
    next(err);
  }
});
