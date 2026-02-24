import { create } from 'zustand';
import { chatApi } from '../../api/chatApi';
import type { Conversation, Message } from '../../features/chat/types';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  selectConversation: (conversation: Conversation | null) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

export type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await chatApi.getConversations();
      set({ conversations, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load conversations',
      });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const messages = await chatApi.getMessages(conversationId);
      set({ messages, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load messages',
      });
    }
  },

  selectConversation: (conversation: Conversation | null) => {
    set({ currentConversation: conversation, messages: [] });
    if (conversation) {
      get().fetchMessages(conversation.id);
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    try {
      const message = await chatApi.sendMessage({ conversationId, content });
      set((state) => ({
        messages: [...state.messages, message],
      }));
      // Update conversation's last message
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                lastMessage: {
                  id: message.id,
                  content: message.content,
                  senderId: message.senderId,
                  senderName: message.senderName,
                  createdAt: message.createdAt,
                },
                updatedAt: new Date().toISOString(),
              }
            : conv
        ),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to send message',
      });
      throw err;
    }
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));
