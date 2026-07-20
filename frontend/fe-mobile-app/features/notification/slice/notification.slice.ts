import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationState, AppNotification } from '../type/notification.types';
import { getNotificationsThunk, markAsReadThunk, markAllAsReadThunk } from '../thunk/notification.thunk';

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      // Đảm bảo không bị trùng lặp khi nhận qua Socket
      const exists = state.notifications.some(n => n._id === action.payload._id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Get All
    builder
      .addCase(getNotificationsThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getNotificationsThunk.fulfilled, (state, action: PayloadAction<AppNotification[]>) => {
        state.isLoading = false;
        state.notifications = action.payload || [];
        state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      })
      .addCase(getNotificationsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Mark as Read
      .addCase(markAsReadThunk.fulfilled, (state, action: PayloadAction<AppNotification>) => {
        const index = state.notifications.findIndex(n => n._id === action.payload._id);
        if (index !== -1 && !state.notifications[index].isRead) {
          state.notifications[index].isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark All as Read
      .addCase(markAllAsReadThunk.fulfilled, (state) => {
        state.notifications.forEach(n => { n.isRead = true; });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
