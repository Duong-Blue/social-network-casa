import { nodeClient, BackendResponse } from '@/utils/helpers/api_helper';
import { Conversation, ChatMessage } from '../type/chat.types';

export const chatService = {
  getConversations: async (userId: string): Promise<Conversation[]> => {
    const response = await nodeClient.get(`/conversations/user/${userId}`);
    // Backend trả về mảng, đảm bảo luôn là array
    return Array.isArray(response.data) ? response.data : [];
  },

  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const response = await nodeClient.get(`/messages/conversation/${conversationId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  createConversation: async (user1Id: string, user2Id: string): Promise<Conversation> => {
    const response = await nodeClient.post('/conversations/create', { user1Id, user2Id });
    return response.data;
  },

  getConversationById: async (conversationId: string): Promise<Conversation | null> => {
    const response = await nodeClient.get(`/conversations/${conversationId}`);
    return response.data;
  },

  markAsRead: async (messageId: string, userId: string): Promise<any> => {
    const response = await nodeClient.put(`/messages/${messageId}/read`, { userId });
    return response.data;
  },

  uploadFile: async (formData: FormData): Promise<BackendResponse<any>> => {
    const response = await nodeClient.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteConversation: async (conversationId: string): Promise<any> => {
    const response = await nodeClient.post(`/conversations/${conversationId}/delete`);
    return response.data;
  },

  deleteMessage: async (messageId: string, userId: string, deleteType: 'deleteForMe' | 'deleteForEveryone'): Promise<any> => {
    const response = await nodeClient.post(`/messages/${messageId}/delete`, { userId, deleteType });
    return response.data;
  },

  toggleReaction: async (messageId: string, userId: string, emoji: string): Promise<any> => {
    const response = await nodeClient.post(`/messages/${messageId}/reaction`, { userId, emoji });
    return response.data;
  },
};

