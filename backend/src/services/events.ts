import { prisma } from '../db/client';
import type { Event, EventAttendee, EventCoHost } from '../types';
import { generateSeriesDates, type SeriesInterval } from '../utils/seriesUtils';

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
  transformEvent: (prismaEvent: any, userId?: string, includeCoHosts: boolean = false): Event => {
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
      canEdit: userId ? canEdit : undefined,
      seriesId: prismaEvent.seriesId || undefined,
      seriesInterval: (prismaEvent.seriesInterval as SeriesInterval) || undefined,
      seriesIndex: prismaEvent.seriesIndex !== null ? prismaEvent.seriesIndex : undefined,
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
   * Get all events
   */
  listEvents: async (userId?: string): Promise<Event[]> => {
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

    return events.map((event) => eventsService.transformEvent(event, userId));
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
};
