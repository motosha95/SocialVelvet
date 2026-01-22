import express from 'express';
import { z } from 'zod';
import { authenticate, optionalAuthenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { eventsService } from '../services/events';

export const eventsRouter = express.Router();

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  date: z.string().datetime(),
  maxAttendees: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  date: z.string().datetime().optional(),
  maxAttendees: z.number().positive().optional(),
  imageUrl: z.string().url().optional().nullable(),
});

const addCoHostSchema = z.object({
  userId: z.string().uuid(),
  canEdit: z.boolean().optional().default(true),
});

const updateCoHostSchema = z.object({
  canEdit: z.boolean(),
});

// Get all events (public, but includes isJoined if authenticated)
eventsRouter.get('/', optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const events = await eventsService.listEvents(userId);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// Get event by ID (public, but includes isJoined if authenticated)
eventsRouter.get('/:id', optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const includeCoHosts = req.query.includeCoHosts === 'true';
    const event = await eventsService.getEventById(req.params.id, userId, includeCoHosts);

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    res.json(event);
  } catch (err) {
    next(err);
  }
});

// Create event (requires auth)
eventsRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    const body = createEventSchema.parse(req.body);
    const date = new Date(body.date);

    // Validate date is in future
    if (date < new Date()) {
      throw new AppError(400, 'Event date must be in the future');
    }

    const event = await eventsService.createEvent({
      title: body.title,
      description: body.description,
      location: body.location,
      date,
      maxAttendees: body.maxAttendees,
      imageUrl: body.imageUrl,
      organizerId: req.userId,
    });

    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
});

// Join event (requires auth)
eventsRouter.post('/:id/join', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    await eventsService.joinEvent(req.params.id, req.userId);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error && err.message === 'Event not found') {
      next(new AppError(404, err.message));
      return;
    }
    if (err instanceof Error && err.message === 'Event is full') {
      next(new AppError(400, err.message));
      return;
    }
    next(err);
  }
});

// Leave event (requires auth)
eventsRouter.post('/:id/leave', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    await eventsService.leaveEvent(req.params.id, req.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Get event attendees (public)
eventsRouter.get('/:id/attendees', async (req, res, next) => {
  try {
    const attendees = await eventsService.getEventAttendees(req.params.id);
    res.json(attendees);
  } catch (err) {
    next(err);
  }
});

// Update event (requires auth and permission)
eventsRouter.patch('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    const body = updateEventSchema.parse(req.body);
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.maxAttendees !== undefined) updateData.maxAttendees = body.maxAttendees;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;

    const event = await eventsService.updateEvent(req.params.id, req.userId, updateData);
    res.json({ event });
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) {
      next(new AppError(403, err.message));
      return;
    }
    if (err instanceof Error && err.message.includes('future')) {
      next(new AppError(400, err.message));
      return;
    }
    next(err);
  }
});

// Get co-hosts (requires auth, only organizer)
eventsRouter.get('/:id/co-hosts', optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    // Allow anyone to view co-hosts (public information)
    // Only organizers can manage them, but everyone can see them
    const coHosts = await eventsService.getCoHosts(req.params.id, req.userId);
    res.json(coHosts);
  } catch (err) {
    if (err instanceof Error && err.message.includes('organizer')) {
      next(new AppError(403, err.message));
      return;
    }
    next(err);
  }
});

// Add co-host (requires auth, only organizer)
eventsRouter.post('/:id/co-hosts', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    const body = addCoHostSchema.parse(req.body);
    await eventsService.addCoHost(req.params.id, req.userId, body.userId, body.canEdit);
    res.status(201).json({ message: 'Co-host added successfully' });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('organizer') || err.message.includes('already'))) {
      next(new AppError(400, err.message));
      return;
    }
    next(err);
  }
});

// Remove co-host (requires auth, only organizer)
eventsRouter.delete('/:id/co-hosts/:userId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    await eventsService.removeCoHost(req.params.id, req.userId, req.params.userId);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error && err.message.includes('organizer')) {
      next(new AppError(403, err.message));
      return;
    }
    next(err);
  }
});

// Update co-host permissions (requires auth, only organizer)
eventsRouter.patch('/:id/co-hosts/:userId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    const body = updateCoHostSchema.parse(req.body);
    await eventsService.updateCoHostPermission(req.params.id, req.userId, req.params.userId, body.canEdit);
    res.json({ message: 'Co-host permissions updated successfully' });
  } catch (err) {
    if (err instanceof Error && err.message.includes('organizer')) {
      next(new AppError(403, err.message));
      return;
    }
    next(err);
  }
});
