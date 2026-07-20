export interface ChatMessage {
  _id: string;
  conversationId?: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  files?: Array<{
    url: string;
    filename: string;
    mimetype: string;
    size?: number;
    originalName?: string;
  }>;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  readAt?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  isOptimistic?: boolean; // Tin nhắn tạm (chưa xác nhận từ server)
  reactions?: { [emoji: string]: string[] };
}

export interface Conversation {
  _id: string;
  participants: string[]; // Danh sách userId
  isGroup: boolean;
  name?: string;
  avatar?: string; // Avatar của người nhận (hoặc group avatar)
  lastMessage?: ChatMessage;
  unreadCount?: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ChatState {
  conversations: Conversation[];
  messagesList: ChatMessage[];
  currentConversationId: string | null;
  isLoading: boolean;
  isSendingMessage: boolean;
  error: string | null;
  onlineUsers: string[]; // Danh sách userId đang online
  typingUsers: Record<string, boolean>; // { userId: isTyping }
}
