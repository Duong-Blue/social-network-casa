import { createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../service/notification.service';

export const getNotificationsThunk = createAsyncThunk(
  'notification/getAll',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await notificationService.getAll(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch notifications');
    }
  }
);

export const markAsReadThunk = createAsyncThunk(
  'notification/markAsRead',
  async ({ id, userId }: { id: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await notificationService.markAsRead(id, userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to mark as read');
    }
  }
);

export const markAllAsReadThunk = createAsyncThunk(
  'notification/markAllAsRead',
  async (userId: string, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead(userId);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to mark all as read');
    }
  }
);
