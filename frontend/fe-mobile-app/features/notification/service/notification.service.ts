import { nodeClient } from '@/utils/helpers/api_helper';
import { AppNotification } from '../type/notification.types';

export const notificationService = {
  getAll: async (userId: string): Promise<AppNotification[]> => {
    const response = await nodeClient.post('/notifications/get-all', { userId });
    return response.data;
  },

  getUnread: async (userId: string): Promise<AppNotification[]> => {
    const response = await nodeClient.post('/notifications/unread', { userId });
    return response.data;
  },

  markAsRead: async (id: string, userId: string): Promise<AppNotification> => {
    const response = await nodeClient.post(`/notifications/${id}/read`, { userId });
    return response.data;
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await nodeClient.post('/notifications/read-all', { userId });
  },

  delete: async (id: string, userId: string): Promise<void> => {
    await nodeClient.delete(`/notifications/${id}`, { data: { userId } });
  }
};
