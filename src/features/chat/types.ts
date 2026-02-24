export interface Conversation {
  id: string;
  eventId?: string;
  participants: Array<{
    userId: string;
    name: string;
    avatarUrl?: string;
    vipTier?: string;
  }>;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderVipTier?: string;
    createdAt: string;
  };
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  senderVipTier?: string;
  createdAt: string;
}
