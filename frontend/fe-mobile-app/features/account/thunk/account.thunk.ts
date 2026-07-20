import { createAsyncThunk } from '@reduxjs/toolkit';
import { accountService } from '../service/account.service';
import { ProfileUserResponse } from '../type/account.types';

export const getProfileThunk = createAsyncThunk(
  'account/getProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await accountService.getProfile(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch profile');
    }
  }
);

export const getMyProfileThunk = createAsyncThunk(
  'account/getMyProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await accountService.getProfile(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch my profile');
    }
  }
);

export const updateProfileThunk = createAsyncThunk(
  'account/updateProfile',
  async ({ userId, data }: { userId: string; data: FormData }, { rejectWithValue }) => {
    try {
      const response = await accountService.updateProfile(userId, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to update profile');
    }
  }
);

export const getSuggestedUsersThunk = createAsyncThunk(
  'account/getSuggestedUsers',
  async ({ page, size }: { page: number; size: number }, { rejectWithValue }) => {
    try {
      const response = await accountService.getAllUsers(page, size);
      return response.data; // Response từ backend là Page<UserFriend>
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch suggested users');
    }
  }
);
