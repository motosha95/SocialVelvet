import { prisma } from '../db/client';
import type { Event, EventAttendee, EventCoHost } from '../types';
import { generateSeriesDates, type SeriesInterval } from '../utils/seriesUtils';
import { followsService } from './follows';
import { challengesService } from './challenges';
import { calculatePointsForAttendance, getEffectivePriceForPoints, applyVipPointsMultiplier } from '../constants/gamification';
import { stripeService } from './stripeService';

export const eventsService = {
  /**
   * Check if user can edit event
   */
  canUserEditEvent: async (eventId: string, userId: string): Promise<boolean> => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        coHosts: {
          where: { userId },
        },
      },
    });

    if (!event) {
      return false;
    }

    // Organizer can always edit
    if (event.organizerId === userId) {
      return true;
    }

    // Check if user is a co-host with edit permission
    const coHost = event.coHosts.find((ch) => ch.userId === userId);
    return coHost?.canEdit === true;
  },

  /**
   * Transform Prisma event to API Event format.
   * When vipTier is provided, applies discount to price/pricingTiers (10% vip, 20% vip_plus).
   */
  transformEvent: (prismaEvent: any, userId?: string, includeCoHosts: boolean = false, followedOrganizerIds?: Set<string>, vipTier?: string | null): Event => {
    const attendeeCount = prismaEvent.attendees?.length || 0;
    const isJoined = userId ? prismaEvent.attendees?.some((a: any) => a.userId === userId) || false : false;
    
    // Check if user can edit (organizer or co-host with permission)
    let canEdit = false;
    if (userId) {
      canEdit = prismaEvent.organizerId === userId;
      if (!canEdit && prismaEvent.coHosts) {
        const coHost = prismaEvent.coHosts.find((ch: any) => ch.userId === userId);
        canEdit = coHost?.canEdit === true;
      }
    }

    let price: number | undefined = prismaEvent.price != null ? Number(prismaEvent.price) : undefined;
    let pricingTiers: { name: string; price: number }[] | undefined = Array.isArray(prismaEvent.pricingTiers)
      ? (prismaEvent.pricingTiers as Array<{ name: string; price: number }>).map((t: any) => ({
          name: String(t.name),
          price: Number(t.price),
        }))
      : undefined;

    let vipDiscountPercent: number | undefined;
    if (vipTier === 'vip' || vipTier === 'vip_plus') {
      const discount = vipTier === 'vip_plus' ? 0.2 : 0.1;
      vipDiscountPercent = vipTier === 'vip_plus' ? 20 : 10;
      if (price != null && price > 0) {
        price = Math.round(price * (1 - discount) * 100) / 100;
      }
      if (pricingTiers && pricingTiers.length > 0) {
        pricingTiers = pricingTiers.map((t) => ({
          name: t.name,
          price: Math.round(t.price * (1 - discount) * 100) / 100,
        }));
      }
    }

    const result: Event = {
      id: prismaEvent.id,
      title: prismaEvent.title,
      description: prismaEvent.description,
      location: prismaEvent.location,
      date: prismaEvent.date.toISOString(),
      imageUrl: prismaEvent.imageUrl || undefined,
      organizerId: prismaEvent.organizerId,
      organizerName: prismaEvent.organizer.name,
      organizerVipTier: prismaEvent.organizer?.vipTier ?? undefined,
      attendeeCount,
      maxAttendees: prismaEvent.maxAttendees || undefined,
      isJoined,
      isTicketed: prismaEvent.isTicketed || undefined,
      isPaid: prismaEvent.isPaid || undefined,
      price,
      pricingTiers,
      currency: prismaEvent.currency || undefined,
      topics: prismaEvent.topics?.length ? [...prismaEvent.topics] : undefined,
      canEdit: userId ? canEdit : undefined,
      seriesId: prismaEvent.seriesId || undefined,
      seriesInterval: (prismaEvent.seriesInterval as SeriesInterval) || undefined,
      seriesIndex: prismaEvent.seriesIndex !== null ? prismaEvent.seriesIndex : undefined,
      isCancelled: prismaEvent.isCancelled === true,
      isFromFollowedHost: userId && followedOrganizerIds ? followedOrganizerIds.has(prismaEvent.organizerId) : undefined,
      vipOnly: prismaEvent.vipOnly === true,
      isCuratedPick: prismaEvent.isCuratedPick === true,
      vipDiscountPercent,
      createdAt: prismaEvent.createdAt.toISOString(),
      updatedAt: prismaEvent.updatedAt.toISOString(),
    };

    // Include co-hosts if requested (only for organizers)
    if (includeCoHosts && prismaEvent.coHosts && userId === prismaEvent.organizerId) {
      result.coHosts = prismaEvent.coHosts.map((ch: any) => ({
        userId: ch.userId,
        userName: ch.user.name,
        userAvatarUrl: ch.user.avatarUrl || undefined,
        userVipTier: ch.user?.vipTier ?? undefined,
        canEdit: ch.canEdit,
        createdAt: ch.createdAt.toISOString(),
      }));
    }

    return result;
  },

  /**
   * Get all events. When prioritizeFollowed is true and userId is set, events from followed hosts come first.
   * VIP/VIP Plus: curated (staff pick) events are sorted to the top. VIP Plus also sees vipOnly events. Discounts applied when user has tier.
   * Pagination: limit (default 10, max 50) and offset (default 0) control the returned slice.
   */
  listEvents: async (
    userId?: string,
    prioritizeFollowed: boolean = false,
    limit: number = 10,
    offset: number = 0
  ): Promise<Event[]> => {
    let followedIds = new Set<string>();
    let vipTier: string | null = null;
    if (userId) {
      if (prioritizeFollowed) {
        const ids = await followsService.getFollowingIds(userId);
        followedIds = new Set(ids);
      }
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { vipTier: true },
      });
      vipTier = user?.vipTier ?? null;
    }

    const events = await prisma.event.findMany({
      where: { isCancelled: false },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            vipTier: true,
          },
        },
        attendees: {
          select: { userId: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    const filtered = events.filter((event: any) => {
      if (event.vipOnly === true && vipTier !== 'vip_plus') return false;
      return true;
    });

    let result = filtered.map((event: any) => eventsService.transformEvent(event, userId, false, followedIds, vipTier));

    // Sort: for VIPs put curated (staff pick) events first; then by followed (if requested); then by date
    result = [...result].sort((a, b) => {
      if (userId && prioritizeFollowed && followedIds.size > 0) {
        const aFollowed = a.isFromFollowedHost ? 1 : 0;
        const bFollowed = b.isFromFollowedHost ? 1 : 0;
        if (bFollowed !== aFollowed) return bFollowed - aFollowed;
      }
      if (vipTier === 'vip' || vipTier === 'vip_plus') {
        const aCurated = a.isCuratedPick ? 1 : 0;
        const bCurated = b.isCuratedPick ? 1 : 0;
        if (bCurated !== aCurated) return bCurated - aCurated;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return result.slice(offset, offset + limit);
  },

  /**
   * Get event by ID. Returns null if event is vipOnly and user is not VIP Plus.
   */
  getEventById: async (id: string, userId?: string, includeCoHosts: boolean = false): Promise<Event | null> => {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            vipTier: true,
          },
        },
        attendees: {
          select: { userId: true },
        },
        coHosts: includeCoHosts && userId
          ? {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    vipTier: true,
                  },
                },
              },
            }
          : false,
      },
    });

    if (!event) {
      return null;
    }

    let vipTier: string | null = null;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { vipTier: true },
      });
      vipTier = user?.vipTier ?? null;
    }

    if ((event as any).vipOnly === true && vipTier !== 'vip_plus') {
      return null;
    }

    return eventsService.transformEvent(event, userId, includeCoHosts, undefined, vipTier);
  },

  /**
   * Create event (and series if specified)
   */
  createEvent: async (data: {
    title: string;
    description: string;
    location: string;
    date: Date;
    maxAttendees?: number;
    imageUrl?: string;
    isTicketed?: boolean;
    isPaid?: boolean;
    price?: number;
    pricingTiers?: Array<{ name: string; price: number }>;
    currency?: string;
    topics?: string[];
    organizerId: string;
    seriesInterval?: SeriesInterval;
    seriesCount?: number;
  }): Promise<Event> => {
    // If series is specified, create multiple events
    if (data.seriesInterval && data.seriesCount) {
      const seriesDates = generateSeriesDates(data.date, data.seriesInterval, data.seriesCount);
      
      // Create all events in a transaction
      const events = await prisma.$transaction(
        seriesDates.map((eventDate, index) => {
          const eventData: {
            title: string;
            description: string;
            location: string;
            date: Date;
            organizerId: string;
            seriesInterval: string;
            seriesIndex: number;
            maxAttendees?: number;
            imageUrl?: string | null;
            isTicketed?: boolean;
            isPaid?: boolean;
            price?: number;
            pricingTiers?: unknown;
            currency?: string;
            topics?: string[];
          } = {
            title: data.title,
            description: data.description,
            location: data.location,
            date: eventDate,
            organizerId: data.organizerId,
            seriesInterval: data.seriesInterval,
            seriesIndex: index,
          };

          if (data.maxAttendees !== undefined) {
            eventData.maxAttendees = data.maxAttendees;
          }

          if (data.imageUrl !== undefined) {
            eventData.imageUrl = data.imageUrl || null;
          }

          if (data.isTicketed !== undefined) {
            eventData.isTicketed = data.isTicketed;
          }

          if (data.isPaid !== undefined) {
            eventData.isPaid = data.isPaid;
          }

          if (data.price !== undefined) {
            eventData.price = data.price;
          }

          if (data.currency !== undefined) {
            eventData.currency = data.currency;
          }

          if (data.pricingTiers !== undefined && data.pricingTiers.length > 0) {
            eventData.pricingTiers = data.pricingTiers as unknown;
          }

          if (data.topics !== undefined && data.topics.length > 0) {
            eventData.topics = data.topics;
          }

          return prisma.event.create({
            data: eventData,
            include: {
              organizer: {
                select: {
                  id: true,
                  name: true,
                  vipTier: true,
                },
              },
              attendees: {
                where: {
                  userId: data.organizerId,
                },
                select: {
                  userId: true,
                },
              },
            },
          });
        })
      );

      // Update all events to use the first event's ID as seriesId
      const firstEventId = events[0].id;
      await prisma.event.updateMany({
        where: {
          id: {
            in: events.map((e) => e.id),
          },
        },
        data: {
          seriesId: firstEventId,
        },
      });

      // Refresh events to get updated seriesId
      const updatedEvents = await prisma.event.findMany({
        where: {
          id: {
            in: events.map((e) => e.id),
          },
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              vipTier: true,
            },
          },
          attendees: {
            where: {
              userId: data.organizerId,
            },
            select: {
              userId: true,
            },
          },
        },
      });

      // Auto-join organizer to all events in the series
      await prisma.eventAttendee.createMany({
        data: updatedEvents.map((event) => ({
          userId: data.organizerId,
          eventId: event.id,
        })),
        skipDuplicates: true,
      });

      // Return the first event
      return eventsService.transformEvent(updatedEvents[0], data.organizerId);
    }

    // Single event creation (no series)
    const eventData: {
      title: string;
      description: string;
      location: string;
      date: Date;
      organizerId: string;
      maxAttendees?: number;
      imageUrl?: string | null;
      isTicketed?: boolean;
      isPaid?: boolean;
      price?: number;
      pricingTiers?: unknown;
      currency?: string;
      topics?: string[];
    } = {
      title: data.title,
      description: data.description,
      location: data.location,
      date: data.date,
      organizerId: data.organizerId,
    };

    if (data.maxAttendees !== undefined) {
      eventData.maxAttendees = data.maxAttendees;
    }

    if (data.imageUrl !== undefined) {
      eventData.imageUrl = data.imageUrl || null;
    }

    if (data.isTicketed !== undefined) {
      eventData.isTicketed = data.isTicketed;
    }

    if (data.isPaid !== undefined) {
      eventData.isPaid = data.isPaid;
    }

    if (data.price !== undefined) {
      eventData.price = data.price;
    }

    if (data.currency !== undefined) {
      eventData.currency = data.currency;
    }

    if (data.pricingTiers !== undefined && data.pricingTiers.length > 0) {
      eventData.pricingTiers = data.pricingTiers as unknown;
    }

    if (data.topics !== undefined && data.topics.length > 0) {
      eventData.topics = data.topics;
    }

    const event = await prisma.event.create({
      data: eventData,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
        attendees: {
          where: {
            userId: data.organizerId,
          },
          select: {
            userId: true,
          },
        },
      },
    });

    // Auto-join organizer to their event
    await prisma.eventAttendee.create({
      data: {
        userId: data.organizerId,
        eventId: event.id,
      },
    });

    return eventsService.transformEvent(event, data.organizerId);
  },

  /**
   * Create a Stripe Payment Intent for joining a paid event. Returns clientSecret for the client to confirm payment.
   */
  createPaymentIntentForEvent: async (
    eventId: string,
    userId: string,
    pointsAmount?: number
  ): Promise<{ clientSecret: string; paymentIntentId: string } | null> => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { attendees: true },
    });
    if (!event) throw new Error('Event not found');
    if (!event.isPaid) throw new Error('Event is not a paid event');
    const basePrice = event.pricingTiers && Array.isArray(event.pricingTiers) && (event.pricingTiers as Array<{ name: string; price: number }>).length > 0
      ? (event.pricingTiers as Array<{ name: string; price: number }>)[0].price
      : (event.price != null ? Number(event.price) : 0);
    if (basePrice <= 0) throw new Error('Invalid event price');
    const currency = (event.currency || 'AED').toUpperCase();
    return stripeService.createEventPaymentIntent({
      eventId,
      userId,
      amountMajor: basePrice,
      currency,
      pointsAmount: pointsAmount ?? 0,
    });
  },

  /**
   * Join event with payment method support
   */
  joinEvent: async (
    eventId: string,
    userId: string,
    paymentMethod?: 'points' | 'cash' | 'credit_card',
    pointsAmount?: number,
    paymentIntentId?: string
  ): Promise<void> => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendees: true,
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if ((event as any).vipOnly === true) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { vipTier: true },
      });
      if (user?.vipTier !== 'vip_plus') {
        throw new Error('This event is for VIP Plus members only');
      }
    }

    // Check if already joined
    const isAlreadyJoined = event.attendees.some((a) => a.userId === userId);
    if (isAlreadyJoined) {
      return;
    }

    // Check max attendees
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      throw new Error('Event is full');
    }

    // Payment processing for paid events
    let paymentData: {
      paymentMethod?: string;
      pointsUsed?: number;
      cashPrice?: number;
      creditCardPrice?: number;
    } = {};

    if (event.isPaid) {
      // Get event price (handle pricing tiers - use first tier for now)
      const basePrice = event.pricingTiers && Array.isArray(event.pricingTiers) && (event.pricingTiers as Array<{ name: string; price: number }>).length > 0
        ? (event.pricingTiers as Array<{ name: string; price: number }>)[0].price
        : (event.price != null ? Number(event.price) : 0);

      if (basePrice <= 0) {
        throw new Error('Invalid event price');
      }

      // Get user's current points balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });

      const userPoints = user?.points || 0;

      // Determine payment method (default to credit_card if not specified)
      const method = paymentMethod || 'credit_card';

      if (method === 'points') {
        // Points payment
        const pointsToUse = pointsAmount || basePrice;
        
        if (pointsToUse > userPoints) {
          throw new Error(`Insufficient points. You have ${userPoints} points but need ${pointsToUse}.`);
        }

        if (pointsToUse > basePrice) {
          throw new Error(`Cannot use more points than the event price (${basePrice}).`);
        }

        // Deduct points
        await prisma.user.update({
          where: { id: userId },
          data: { points: { decrement: pointsToUse } },
        });

        paymentData.paymentMethod = 'points';
        paymentData.pointsUsed = pointsToUse;

        // If partial payment, remaining is charged to credit card
        const remaining = basePrice - pointsToUse;
        if (remaining > 0) {
          paymentData.creditCardPrice = remaining;
          // In a real app, you would integrate with a payment gateway here
          // For now, we just record the amount
        }
      } else if (method === 'cash') {
        // Cash payment: 10-15% markup (using 12.5%), rounded up to nearest multiple of 5
        const withMarkup = basePrice * 1.125;
        const cashPrice = withMarkup <= 0 ? 0 : Math.ceil(withMarkup / 5) * 5;
        paymentData.paymentMethod = 'cash';
        paymentData.cashPrice = cashPrice;
      } else {
        // Credit card: require successful Stripe Payment Intent
        if (!paymentIntentId) {
          throw new Error('Card payment requires completing payment first. Please try again.');
        }
        const verified = await stripeService.verifyEventPaymentIntent(paymentIntentId, eventId, userId);
        if (!verified) {
          throw new Error('Stripe payment verification failed. Please complete payment and try again.');
        }
        paymentData.paymentMethod = 'credit_card';
        paymentData.creditCardPrice = verified.amountPaidMajor;
        if (pointsAmount != null && pointsAmount > 0) {
          if (pointsAmount > userPoints) {
            throw new Error(`Insufficient points. You have ${userPoints} points.`);
          }
          await prisma.user.update({
            where: { id: userId },
            data: { points: { decrement: pointsAmount } },
          });
          paymentData.pointsUsed = pointsAmount;
        }
      }
    }

    // Create attendee record with payment data
    await prisma.eventAttendee.create({
      data: {
        userId,
        eventId,
        paymentMethod: paymentData.paymentMethod,
        pointsUsed: paymentData.pointsUsed,
        cashPrice: paymentData.cashPrice,
        creditCardPrice: paymentData.creditCardPrice,
      },
    });
  },

  /**
   * Leave event: refund user as points (points used + any card/cash amount converted to points at 1:1)
   */
  leaveEvent: async (eventId: string, userId: string): Promise<void> => {
    const attendee = await prisma.eventAttendee.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    // Refund as points: points they used + card/cash amounts (1 AED = 1 point for refund)
    if (attendee) {
      const pointsRefund =
        (attendee.pointsUsed ?? 0) +
        Math.floor(attendee.creditCardPrice ?? 0) +
        Math.floor(attendee.cashPrice ?? 0);
      if (pointsRefund > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { points: { increment: pointsRefund } },
        });
      }
    }

    await prisma.eventAttendee.deleteMany({
      where: {
        eventId,
        userId,
      },
    });
  },

  /**
   * Get event attendees
   */
  getEventAttendees: async (eventId: string): Promise<EventAttendee[]> => {
    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            vipTier: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return attendees.map((attendee) => ({
      userId: attendee.userId,
      name: attendee.user.name,
      avatarUrl: attendee.user.avatarUrl || undefined,
      vipTier: attendee.user.vipTier ?? undefined,
      joinedAt: attendee.joinedAt.toISOString(),
      admittedAt: attendee.admittedAt?.toISOString(),
    }));
  },

  /**
   * Update event (requires permission)
   * If updateAllFutureEvents is true and event is part of a series, updates all future events in the series
   */
  updateEvent: async (
    eventId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      location?: string;
      date?: Date;
      maxAttendees?: number;
      imageUrl?: string;
      isPaid?: boolean;
      price?: number | null;
      pricingTiers?: Array<{ name: string; price: number }> | null;
      currency?: string;
      topics?: string[];
      vipOnly?: boolean;
      isCuratedPick?: boolean;
    },
    updateAllFutureEvents: boolean = false
  ): Promise<Event> => {
    // Check permission
    const canEdit = await eventsService.canUserEditEvent(eventId, userId);
    if (!canEdit) {
      throw new Error('You do not have permission to edit this event');
    }

    // Get the current event to check if it's part of a series
    const currentEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!currentEvent) {
      throw new Error('Event not found');
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.date !== undefined) {
      // Validate date is in future
      if (data.date < new Date()) {
        throw new Error('Event date must be in the future');
      }
      updateData.date = data.date;
    }
    if (data.maxAttendees !== undefined) updateData.maxAttendees = data.maxAttendees;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
    if (data.isPaid !== undefined) {
      updateData.isPaid = data.isPaid;
      if (!data.isPaid) {
        updateData.price = null;
        updateData.pricingTiers = null;
      }
    }
    if (data.price !== undefined) updateData.price = data.price;
    if (data.pricingTiers !== undefined) updateData.pricingTiers = data.pricingTiers as unknown;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.topics !== undefined) updateData.topics = data.topics;
    if (data.vipOnly !== undefined) updateData.vipOnly = data.vipOnly;
    if (data.isCuratedPick !== undefined) updateData.isCuratedPick = data.isCuratedPick;

    // If updateAllFutureEvents is true and event is part of a series, update all future events
    if (updateAllFutureEvents && currentEvent.seriesId && currentEvent.seriesIndex !== null) {
      // Find all events in the series with index greater than current event
      const futureEvents = await prisma.event.findMany({
        where: {
          seriesId: currentEvent.seriesId,
          seriesIndex: {
            gt: currentEvent.seriesIndex,
          },
        },
      });

      // Update all future events in the series (but not the date, as each event has its own scheduled date)
      if (futureEvents.length > 0) {
        const futureUpdateData = { ...updateData };
        // Remove date from future updates - each event keeps its own scheduled date
        delete futureUpdateData.date;

        await prisma.event.updateMany({
          where: {
            id: {
              in: futureEvents.map((e) => e.id),
            },
          },
          data: futureUpdateData,
        });
      }
    }

    // Update the current event
    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            vipTier: true,
          },
        },
        attendees: {
          where: {
            userId,
          },
          select: {
            userId: true,
          },
        },
      },
    });

    return eventsService.transformEvent(event, userId);
  },

  /**
   * Add co-host to event (only organizer can do this)
   */
  addCoHost: async (eventId: string, organizerId: string, userId: string, canEdit: boolean = true): Promise<void> => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Only the organizer can add co-hosts');
    }

    if (event.organizerId === userId) {
      throw new Error('Organizer cannot be added as a co-host');
    }

    // Check if user is already a co-host
    const existing = await prisma.eventCoHost.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existing) {
      throw new Error('User is already a co-host');
    }

    await prisma.eventCoHost.create({
      data: {
        eventId,
        userId,
        canEdit,
      },
    });
  },

  /**
   * Cancel event or series. Only organizer/co-hosts with edit permission can cancel.
   */
  cancelEvent: async (eventId: string, userId: string, cancelSeries: boolean = false): Promise<void> => {
    const canEdit = await eventsService.canUserEditEvent(eventId, userId);
    if (!canEdit) {
      throw new Error('You do not have permission to cancel this event');
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.isCancelled) {
      throw new Error('Event is already cancelled');
    }

    if (cancelSeries && event.seriesId) {
      await prisma.event.updateMany({
        where: { seriesId: event.seriesId },
        data: { isCancelled: true },
      });
    } else {
      await prisma.event.update({
        where: { id: eventId },
        data: { isCancelled: true },
      });
    }
  },

  /**
   * Remove co-host from event (only organizer can do this)
   */
  removeCoHost: async (eventId: string, organizerId: string, userId: string): Promise<void> => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Only the organizer can remove co-hosts');
    }

    await prisma.eventCoHost.deleteMany({
      where: {
        eventId,
        userId,
      },
    });
  },

  /**
   * Update co-host permissions (only organizer can do this)
   */
  updateCoHostPermission: async (
    eventId: string,
    organizerId: string,
    userId: string,
    canEdit: boolean
  ): Promise<void> => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Only the organizer can update co-host permissions');
    }

    await prisma.eventCoHost.updateMany({
      where: {
        eventId,
        userId,
      },
      data: {
        canEdit,
      },
    });
  },

  /**
   * Get co-hosts for an event (only organizer can see this)
   */
  getCoHosts: async (eventId: string, organizerId?: string): Promise<EventCoHost[]> => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Allow anyone to view co-hosts (public information)
    // Management operations still require organizer permissions

    const coHosts = await prisma.eventCoHost.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            vipTier: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return coHosts.map((ch) => ({
      userId: ch.userId,
      userName: ch.user.name,
      userAvatarUrl: ch.user.avatarUrl || undefined,
      userVipTier: ch.user.vipTier ?? undefined,
      canEdit: ch.canEdit,
      createdAt: ch.createdAt.toISOString(),
    }));
  },

  /**
   * Verify ticket and mark attendee as admitted
   * Only organizer or co-host with permission can verify tickets
   */
  verifyTicket: async (
    eventId: string,
    ticketNumber: string,
    userId: string | undefined,
    scannerUserId: string
  ): Promise<{ admitted: boolean; message?: string; pointsAwarded?: number }> => {
    // Check if scanner has permission (organizer or co-host with edit permission)
    const canEdit = await eventsService.canUserEditEvent(eventId, scannerUserId);
    if (!canEdit) {
      throw new Error('Only the organizer or co-host can verify tickets');
    }

    // Get event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.isTicketed) {
      throw new Error('This event is not a ticketed event');
    }

    // If userId is provided, verify ticket belongs to that user
    if (userId) {
      // Check if user is an attendee
      const attendee = await prisma.eventAttendee.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });

      if (!attendee) {
        return {
          admitted: false,
          message: 'This ticket belongs to a user who is not an attendee of this event.',
        };
      }

      // Check if already admitted
      if (attendee.admittedAt) {
        return {
          admitted: false,
          message: 'This ticket has already been scanned and admitted.',
        };
      }

      // Verify ticket number format matches expected pattern
      // Ticket number format: EVENTID-USERID (first 8 chars of each)
      const expectedPrefix = eventId.slice(0, 8).toUpperCase();
      if (!ticketNumber.startsWith(expectedPrefix)) {
        return {
          admitted: false,
          message: 'This ticket does not belong to this event.',
        };
      }

      // Mark attendee as admitted
      await prisma.eventAttendee.update({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
        data: {
          admittedAt: new Date(),
        },
      });

      const effectivePrice = getEffectivePriceForPoints(
        event.price != null ? Number(event.price) : null,
        Array.isArray(event.pricingTiers) ? (event.pricingTiers as Array<{ name: string; price: number }>) : null
      );
      const basePoints = calculatePointsForAttendance(effectivePrice);
      const attendeeUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { vipTier: true },
      });
      const pointsToAward = applyVipPointsMultiplier(basePoints, attendeeUser?.vipTier as 'vip' | 'vip_plus' | null);

      // Award points for attending (non-blocking - ticket scan succeeds even if points fail)
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { points: { increment: pointsToAward } },
        });
      } catch (pointsErr) {
        console.warn('Failed to award points (migration may not be run):', pointsErr);
      }

      try {
        await challengesService.recordEventAttendance(userId);
      } catch (chErr) {
        console.warn('Failed to update challenge progress:', chErr);
      }

      // Create or update ticket record
      await prisma.ticket.upsert({
        where: {
          ticketNumber,
        },
        create: {
          ticketNumber,
          eventId,
          userId,
          scannedAt: new Date(),
          scannedBy: scannerUserId,
        },
        update: {
          scannedAt: new Date(),
          scannedBy: scannerUserId,
        },
      });

      return {
        admitted: true,
        message: 'Ticket verified successfully. Attendee has been admitted.',
        pointsAwarded: pointsToAward,
      };
    }

    // If no userId provided, try to find ticket by ticket number
    const ticket = await prisma.ticket.findUnique({
      where: {
        ticketNumber,
      },
      include: {
        event: true,
      },
    });

    if (!ticket) {
      return {
        admitted: false,
        message: 'Ticket not found.',
      };
    }

    // Verify ticket belongs to this event
    if (ticket.eventId !== eventId) {
      return {
        admitted: false,
        message: 'This ticket does not belong to this event.',
      };
    }

    // Check if already scanned
    if (ticket.scannedAt) {
      return {
        admitted: false,
        message: 'This ticket has already been scanned.',
      };
    }

    // Check if user is an attendee
    const attendee = await prisma.eventAttendee.findUnique({
      where: {
        userId_eventId: {
          userId: ticket.userId,
          eventId,
        },
      },
    });

    if (!attendee) {
      return {
        admitted: false,
        message: 'This ticket belongs to a user who is not an attendee of this event.',
      };
    }

    // Mark attendee as admitted
    await prisma.eventAttendee.update({
      where: {
        userId_eventId: {
          userId: ticket.userId,
          eventId,
        },
      },
      data: {
        admittedAt: new Date(),
      },
    });

    const effectivePrice = getEffectivePriceForPoints(
      event.price != null ? Number(event.price) : null,
      Array.isArray(event.pricingTiers) ? (event.pricingTiers as Array<{ name: string; price: number }>) : null
    );
    const basePoints = calculatePointsForAttendance(effectivePrice);
    const attendeeUser = await prisma.user.findUnique({
      where: { id: ticket.userId },
      select: { vipTier: true },
    });
    const pointsToAward = applyVipPointsMultiplier(basePoints, attendeeUser?.vipTier as 'vip' | 'vip_plus' | null);

    // Award points for attending (non-blocking - ticket scan succeeds even if points fail)
    try {
      await prisma.user.update({
        where: { id: ticket.userId },
        data: { points: { increment: pointsToAward } },
      });
    } catch (pointsErr) {
      console.warn('Failed to award points (migration may not be run):', pointsErr);
    }

    try {
      await challengesService.recordEventAttendance(ticket.userId);
    } catch (chErr) {
      console.warn('Failed to update challenge progress:', chErr);
    }

    // Update ticket as scanned
    await prisma.ticket.update({
      where: {
        ticketNumber,
      },
      data: {
        scannedAt: new Date(),
        scannedBy: scannerUserId,
      },
    });

    return {
      admitted: true,
      message: 'Ticket verified successfully. Attendee has been admitted.',
      pointsAwarded: pointsToAward,
    };
  },
};
