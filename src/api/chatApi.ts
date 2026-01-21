import { apiClient } from './client';
import { useAuthStore } from '../store/auth/authStore';
import type { Conversation, Message } from '../features/chat/types';

const getAuthToken = (): string | undefined => {
  const session = useAuthStore.getState().session;
  return session?.accessToken;
};

export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    return await apiClient.get<Conversation[]>('/chat/conversations', token);
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    return await apiClient.get<Message[]>(`/chat/conversations/${conversationId}/messages`, token);
  },

  createConversation: async (data: {
    eventId?: string;
    participantIds: string[];
  }): Promise<Conversation> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    return await apiClient.post<Conversation>('/chat/conversations', data, token);
  },

  sendMessage: async (data: {
    conversationId: string;
    content: string;
  }): Promise<Message> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    return await apiClient.post<Message>('/chat/messages', data, token);
  },
};
