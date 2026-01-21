import { prisma } from '../db/client';
import type { Conversation, Message } from '../types';

export const chatService = {
  async getUserConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      eventId: conv.eventId,
      participants: conv.participants.map((p) => ({
        userId: p.user.id,
        name: p.user.name,
        avatarUrl: p.user.avatarUrl,
      })),
      lastMessage: conv.messages[0]
        ? {
            id: conv.messages[0].id,
            content: conv.messages[0].content,
            senderId: conv.messages[0].senderId,
            senderName: conv.messages[0].sender.name,
            createdAt: conv.messages[0].createdAt.toISOString(),
          }
        : null,
      updatedAt: conv.updatedAt.toISOString(),
    }));
  },

  async getConversationMessages(conversationId: string, userId: string) {
    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    });

    if (!participant) {
      throw new Error('Not a participant in this conversation');
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
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

    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.sender.name,
      senderAvatarUrl: msg.sender.avatarUrl,
      createdAt: msg.createdAt.toISOString(),
    }));
  },

  async createConversation(data: {
    creatorId: string;
    eventId?: string;
    participantIds: string[];
  }) {
    // Ensure creator is included
    const allParticipantIds = [...new Set([data.creatorId, ...data.participantIds])];

    const conversation = await prisma.conversation.create({
      data: {
        eventId: data.eventId,
        participants: {
          create: allParticipantIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      id: conversation.id,
      eventId: conversation.eventId,
      participants: conversation.participants.map((p) => ({
        userId: p.user.id,
        name: p.user.name,
        avatarUrl: p.user.avatarUrl,
      })),
    };
  },

  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
  }) {
    // Verify sender is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId: data.senderId,
          conversationId: data.conversationId,
        },
      },
    });

    if (!participant) {
      throw new Error('Not a participant in this conversation');
    }

    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderAvatarUrl: message.sender.avatarUrl,
      createdAt: message.createdAt.toISOString(),
    };
  },
};
