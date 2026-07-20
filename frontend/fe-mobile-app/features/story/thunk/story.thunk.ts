import { createAsyncThunk } from '@reduxjs/toolkit';
import { storyService } from '../service/story.service';
import { interactionService } from '@/features/interaction/service/interaction.service';
import { setFollowing } from '@/features/interaction/slice/interaction.slice';

export const getFriendStoriesThunk = createAsyncThunk(
  'story/getFriendStories',
  async (userId: string, thunkAPI) => {
    try {
      // 1. Lấy danh sách following
      const followingResponse = await interactionService.getFollowing(userId);
      if (!followingResponse.success) {
        return thunkAPI.rejectWithValue(followingResponse.message);
      }

      // Lưu vào store
      thunkAPI.dispatch(setFollowing(followingResponse.data));

      const friendIds = followingResponse.data.map(user => user.userId);
      
      // Thêm cả chính mình vào danh sách để thấy story của mình
      friendIds.push(userId);

      // 2. Lấy story từ danh sách IDs này
      const storyResponse = await storyService.getFeedStories(friendIds);
      if (!storyResponse.success) {
        return thunkAPI.rejectWithValue(storyResponse.message);
      }

      return storyResponse;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createStoryThunk = createAsyncThunk(
  'story/createStory',
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await storyService.createStory(data);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Export các action types để dùng trong slice
export const getFriendStoriesPending = getFriendStoriesThunk.pending;
export const getFriendStoriesFulfilled = getFriendStoriesThunk.fulfilled;
export const getFriendStoriesRejected = getFriendStoriesThunk.rejected;

export const createStoryFulfilled = createStoryThunk.fulfilled;

export const deleteStoryThunk = createAsyncThunk(
  'story/deleteStory',
  async ({ storyId, userId }: { storyId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await storyService.deleteStory(storyId, userId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return { storyId, userId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const reactStoryThunk = createAsyncThunk(
  'story/reactStory',
  async ({ storyId, userId, emoji }: { storyId: string; userId: string; emoji: string }, { rejectWithValue }) => {
    try {
      const response = await storyService.reactStory(storyId, userId, emoji);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteStoryFulfilled = deleteStoryThunk.fulfilled;
export const reactStoryFulfilled = reactStoryThunk.fulfilled;
