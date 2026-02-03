import { prisma } from '../db/client';
import type { Event, EventAttendee, EventCoHost } from '../types';
import { generateSeriesDates, type SeriesInterval } from '../utils/seriesUtils';
import { followsService } from './follows';
import { POINTS_PER_ATTENDANCE } from '../constants/gamification';

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
   * Transform Prisma event to API Event format
   */
  transformEvent: (prismaEvent: any, userId?: string, includeCoHosts: boolean = false, followedOrganizerIds?: Set<string>): Event => {
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

    const result: Event = {
      id: prismaEvent.id,
      title: prismaEvent.title,
      description: prismaEvent.description,
      location: prismaEvent.location,
      date: prismaEvent.date.toISOString(),
      imageUrl: prismaEvent.imageUrl || undefined,
      organizerId: prismaEvent.organizerId,
      organizerName: prismaEvent.organizer.name,
      attendeeCount,
      maxAttendees: prismaEvent.maxAttendees || undefined,
      isJoined,
      isTicketed: prismaEvent.isTicketed || undefined,
      topics: prismaEvent.topics?.length ? [...prismaEvent.topics] : undefined,
      canEdit: userId ? canEdit : undefined,
      seriesId: prismaEvent.seriesId || undefined,
      seriesInterval: (prismaEvent.seriesInterval as SeriesInterval) || undefined,
      seriesIndex: prismaEvent.seriesIndex !== null ? prismaEvent.seriesIndex : undefined,
      isFromFollowedHost: userId && followedOrganizerIds ? followedOrganizerIds.has(prismaEvent.organizerId) : undefined,
      createdAt: prismaEvent.createdAt.toISOString(),
      updatedAt: prismaEvent.updatedAt.toISOString(),
    };

    // Include co-hosts if requested (only for organizers)
    if (includeCoHosts && prismaEvent.coHosts && userId === prismaEvent.organizerId) {
      result.coHosts = prismaEvent.coHosts.map((ch: any) => ({
        userId: ch.userId,
        userName: ch.user.name,
        userAvatarUrl: ch.user.avatarUrl || undefined,
        canEdit: ch.canEdit,
        createdAt: ch.createdAt.toISOString(),
      }));
    }

    return result;
  },

  /**
   * Get all events. When prioritizeFollowed is true and userId is set, events from followed hosts come first.
   */
  listEvents: async (userId?: string, prioritizeFollowed: boolean = false): Promise<Event[]> => {
    let followedIds = new Set<string>();
    if (userId && prioritizeFollowed) {
      const ids = await followsService.getFollowingIds(userId);
      followedIds = new Set(ids);
    }

    const events = await prisma.event.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
        // Always fetch all attendees to get correct count, then check if user is joined
        attendees: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    let result = events.map((event) => eventsService.transformEvent(event, userId, false, followedIds));

    if (userId && prioritizeFollowed && followedIds.size > 0) {
      result = [...result].sort((a, b) => {
        const aFollowed = a.isFromFollowedHost ? 1 : 0;
        const bFollowed = b.isFromFollowedHost ? 1 : 0;
        if (bFollowed !== aFollowed) return bFollowed - aFollowed;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    }

    return result;
  },

  /**
   * Get event by ID
   */
  getEventById: async (id: string, userId?: string, includeCoHosts: boolean = false): Promise<Event | null> => {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
        // Always fetch all attendees to get correct count, then check if user is joined
        attendees: {
          select: {
            userId: true,
          },
        },
        coHosts: includeCoHosts && userId
          ? {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
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

    return eventsService.transformEvent(event, userId, includeCoHosts);
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
   * Join event
   */
  joinEvent: async (eventId: string, userId: string): Promise<void> => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendees: true,
      },
    });

    if (!event) {
      throw new Error('Event not found');
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

    await prisma.eventAttendee.create({
      data: {
        userId,
        eventId,
      },
    });
  },

  /**
   * Leave event
   */
  leaveEvent: async (eventId: string, userId: string): Promise<void> => {
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
      topics?: string[];
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
    if (data.topics !== undefined) updateData.topics = data.topics;

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
  ): Promise<{ admitted: boolean; message?: string }> => {
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

      // Award points for attending (non-blocking - ticket scan succeeds even if points fail)
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { points: { increment: POINTS_PER_ATTENDANCE } },
        });
      } catch (pointsErr) {
        console.warn('Failed to award points (migration may not be run):', pointsErr);
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
        pointsAwarded: POINTS_PER_ATTENDANCE,
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

    // Award points for attending (non-blocking - ticket scan succeeds even if points fail)
    try {
      await prisma.user.update({
        where: { id: ticket.userId },
        data: { points: { increment: POINTS_PER_ATTENDANCE } },
      });
    } catch (pointsErr) {
      console.warn('Failed to award points (migration may not be run):', pointsErr);
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
      pointsAwarded: POINTS_PER_ATTENDANCE,
    };
  },
};
