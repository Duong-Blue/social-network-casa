export interface AppNotification {
  _id: string;
  userId: string;
  senderId?: string;
  type: string;
  content: string;
  isRead: boolean;
  referenceId?: string;
  createdAt: string;
}

export interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}
