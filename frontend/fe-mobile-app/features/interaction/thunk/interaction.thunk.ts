import { createAsyncThunks } from '@/utils/redux';
import { interactionService } from '../service/interaction.service';
import { LikePostRequest, LikeCommentRequest, UserFollowResponse } from '../type/interaction.types';
import { BackendResponse } from '@/utils/helpers/api_helper';

export const {
  thunk: likePostThunk,
  pending: likePostPending,
  fulfilled: likePostFulfilled,
  rejected: likePostRejected,
} = createAsyncThunks<BackendResponse<boolean>, LikePostRequest>(
  'interaction/likePost',
  async (data: LikePostRequest, { rejectWithValue }) => {
    try {
      const response = await interactionService.likePost(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: likeCommentThunk,
  pending: likeCommentPending,
  fulfilled: likeCommentFulfilled,
  rejected: likeCommentRejected,
} = createAsyncThunks<BackendResponse<boolean>, LikeCommentRequest>(
  'interaction/likeComment',
  async (data: LikeCommentRequest, { rejectWithValue }) => {
    try {
      const response = await interactionService.likeComment(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: followUserThunk,
  pending: followUserPending,
  fulfilled: followUserFulfilled,
  rejected: followUserRejected,
} = createAsyncThunks<BackendResponse<boolean>, { followerId: string; followingId: string }>(
  'interaction/followUser',
  async ({ followerId, followingId }, { rejectWithValue }) => {
    try {
      const response = await interactionService.followUser(followerId, followingId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: unfollowUserThunk,
  pending: unfollowUserPending,
  fulfilled: unfollowUserFulfilled,
  rejected: unfollowUserRejected,
} = createAsyncThunks<BackendResponse<boolean>, { followerId: string; followingId: string }>(
  'interaction/unfollowUser',
  async ({ followerId, followingId }, { rejectWithValue }) => {
    try {
      const response = await interactionService.unfollowUser(followerId, followingId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: getFollowersThunk,
  pending: getFollowersPending,
  fulfilled: getFollowersFulfilled,
  rejected: getFollowersRejected,
} = createAsyncThunks<BackendResponse<UserFollowResponse[]>, string>(
  'interaction/getFollowers',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await interactionService.getFollowers(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: getFollowingThunk,
  pending: getFollowingPending,
  fulfilled: getFollowingFulfilled,
  rejected: getFollowingRejected,
} = createAsyncThunks<BackendResponse<UserFollowResponse[]>, string>(
  'interaction/getFollowing',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await interactionService.getFollowing(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
