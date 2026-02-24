import express from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { chatService } from '../services/chat';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

export const chatRouter = express.Router();

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

const createConversationSchema = z.object({
  eventId: z.string().uuid().optional(),
  participantIds: z.array(z.string().uuid()).min(1),
});

// Get user's conversations
chatRouter.get('/conversations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }
    const conversations = await chatService.getUserConversations(req.userId);
    res.json(conversations);
  } catch (err) {
    next(err);
  }
});

// Get conversation messages
chatRouter.get('/conversations/:id/messages', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }
    const messages = await chatService.getConversationMessages(req.params.id, req.userId);
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// Create conversation
chatRouter.post('/conversations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }
    const body = createConversationSchema.parse(req.body);
    const conversation = await chatService.createConversation({
      ...body,
      creatorId: req.userId,
    });
    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
});

// Send message
chatRouter.post('/messages', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }
    const body = sendMessageSchema.parse(req.body);
    const message = await chatService.sendMessage({
      ...body,
      senderId: req.userId,
    });
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});
