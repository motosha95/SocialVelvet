import express from 'express';
import { z } from 'zod';
import { authenticate, optionalAuthenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { validateTopics } from '../constants/topics';
import { eventsService } from '../services/events';

export const eventsRouter = express.Router();

const seriesIntervalSchema = z.enum(['1week', '2weeks', '3weeks', '1month']);

const pricingTierSchema = z.object({
  name: z.string().min(1).max(50),
  price: z.number().positive(),
});

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  date: z.string().datetime(),
  maxAttendees: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  isTicketed: z.boolean().optional(),
  isPaid: z.boolean().optional(),
  price: z.number().positive().optional(),
  pricingTiers: z.array(pricingTierSchema).min(1).max(4).optional(),
  currency: z.string().min(1).max(10).optional(),
  topics: z
    .array(z.string())
    .max(3)
    .optional()
    .transform((arr) => (arr ? validateTopics(arr) : undefined)),
  seriesInterval: seriesIntervalSchema.optional(),
  seriesCount: z.number().int().min(1).max(12).optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  date: z.string().datetime().optional(),
  maxAttendees: z.number().positive().optional(),
  imageUrl: z.string().url().optional().nullable(),
  isPaid: z.boolean().optional(),
  price: z.number().positive().optional().nullable(),
  pricingTiers: z.array(pricingTierSchema).min(1).max(4).optional().nullable(),
  currency: z.string().min(1).max(10).optional(),
  topics: z
    .array(z.string())
    .max(3)
    .optional()
    .transform((arr) => (arr ? validateTopics(arr) : undefined)),
  listFrom: z.string().datetime().optional().nullable(),
  vipOnly: z.boolean().optional(),
  isCuratedPick: z.boolean().optional(),
  updateAllFutureEvents: z.boolean().optional(),
});

const addCoHostSchema = z.object({
  userId: z.string().uuid(),
  canEdit: z.boolean().optional().default(true),
});

const updateCoHostSchema = z.object({
  canEdit: z.boolean(),
});

const verifyTicketSchema = z.object({
  ticketNumber: z.string().min(1),
  userId: z.string().uuid().optional(),
});

const cancelEventSchema = z.object({
  cancelSeries: z.boolean().optional().default(false),
});

// Get all events (public, but includes isJoined if authenticated). ?prioritizeFollowed=true puts events from followed hosts first.
eventsRouter.get('/', optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;
    const prioritizeFollowed = req.query.prioritizeFollowed === 'true';
    const events = await eventsService.listEvents(userId, prioritizeFollowed);
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

    // For paid events: require either single price or 1–4 pricing tiers
    if (body.isPaid) {
      const hasPrice = body.price != null && body.price > 0;
      const hasTiers = body.pricingTiers && body.pricingTiers.length > 0;
      if (!hasPrice && !hasTiers) {
        throw new AppError(400, 'Paid events require either a price or at least one pricing tier');
      }
      if (hasTiers && body.pricingTiers!.length > 4) {
        throw new AppError(400, 'Maximum 4 pricing tiers allowed');
      }
    }

    // If seriesInterval is provided, seriesCount defaults to 12
    const seriesCount = body.seriesInterval ? (body.seriesCount || 12) : undefined;

    const event = await eventsService.createEvent({
      title: body.title,
      description: body.description,
      location: body.location,
      date,
      maxAttendees: body.maxAttendees,
      imageUrl: body.imageUrl,
      isTicketed: body.isTicketed,
      isPaid: body.isPaid,
      price: body.price,
      pricingTiers: body.pricingTiers,
      currency: body.currency,
      topics: body.topics,
      organizerId: req.userId,
      seriesInterval: body.seriesInterval,
      seriesCount,
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

    // When setting event as paid on update: require price or tiers
    if (body.isPaid === true) {
      const hasPrice = body.price != null && body.price > 0;
      const hasTiers = body.pricingTiers && body.pricingTiers.length > 0;
      if (!hasPrice && !hasTiers) {
        throw new AppError(400, 'Paid events require either a price or at least one pricing tier');
      }
    }

    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.maxAttendees !== undefined) updateData.maxAttendees = body.maxAttendees;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.isPaid !== undefined) updateData.isPaid = body.isPaid;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.pricingTiers !== undefined) updateData.pricingTiers = body.pricingTiers;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.topics !== undefined) updateData.topics = body.topics;
    if (body.listFrom !== undefined) updateData.listFrom = body.listFrom ? new Date(body.listFrom) : null;
    if (body.vipOnly !== undefined) updateData.vipOnly = body.vipOnly;
    if (body.isCuratedPick !== undefined) updateData.isCuratedPick = body.isCuratedPick;

    const updateAllFutureEvents = body.updateAllFutureEvents === true;

    const event = await eventsService.updateEvent(req.params.id, req.userId, updateData, updateAllFutureEvents);
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

// Cancel event or series (requires auth and edit permission)
eventsRouter.post('/:id/cancel', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    const body = cancelEventSchema.parse(req.body);
    await eventsService.cancelEvent(req.params.id, req.userId, body.cancelSeries);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('permission')) {
        next(new AppError(403, err.message));
        return;
      }
      if (err.message.includes('not found') || err.message.includes('already cancelled')) {
        next(new AppError(400, err.message));
        return;
      }
    }
    next(err);
  }
});

// Verify ticket (requires auth, only organizer or co-host)
eventsRouter.post('/:id/tickets/verify', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Authentication required');
    }

    const body = verifyTicketSchema.parse(req.body);
    const result = await eventsService.verifyTicket(
      req.params.id,
      body.ticketNumber,
      body.userId,
      req.userId
    );

    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('permission') || err.message.includes('organizer') || err.message.includes('co-host')) {
        next(new AppError(403, err.message));
        return;
      }
      if (err.message.includes('not found') || err.message.includes('not a ticketed')) {
        next(new AppError(400, err.message));
        return;
      }
    }
    next(err);
  }
});
