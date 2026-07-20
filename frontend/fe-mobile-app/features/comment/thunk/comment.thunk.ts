import { createAsyncThunks } from '@/utils/redux';
import { commentService } from '../service/comment.service';
import { CommentRequest, CommentItemResponse, UpdateCommentRequest } from '../type/comment.types';
import { BackendResponse } from '@/utils/helpers/api_helper';

export const {
  thunk: createCommentThunk,
  pending: createCommentPending,
  fulfilled: createCommentFulfilled,
  rejected: createCommentRejected,
} = createAsyncThunks<BackendResponse<CommentItemResponse>, CommentRequest>(
  'comment/createComment',
  async (data: CommentRequest, { rejectWithValue }) => {
    try {
      const response = await commentService.createComment(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: getCommentsByPostThunk,
  pending: getCommentsByPostPending,
  fulfilled: getCommentsByPostFulfilled,
  rejected: getCommentsByPostRejected,
} = createAsyncThunks<BackendResponse<any>, { postId: string; page?: number; size?: number }>(
  'comment/getCommentsByPost',
  async ({ postId, page, size }, { rejectWithValue }) => {
    try {
      const response = await commentService.getCommentsByPost(postId, page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: deleteCommentThunk,
  pending: deleteCommentPending,
  fulfilled: deleteCommentFulfilled,
  rejected: deleteCommentRejected,
} = createAsyncThunks<BackendResponse<boolean>, { commentId: string; requesterId: string }>(
  'comment/deleteComment',
  async ({ commentId, requesterId }, { rejectWithValue }) => {
    try {
      const response = await commentService.deleteComment(commentId, requesterId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
export const {
  thunk: getCommentRepliesThunk,
  pending: getCommentRepliesPending,
  fulfilled: getCommentRepliesFulfilled,
  rejected: getCommentRepliesRejected,
} = createAsyncThunks<BackendResponse<any>, { commentId: string; postId: string; page?: number; size?: number }>(
  'comment/getCommentReplies',
  async ({ commentId, page, size }, { rejectWithValue }) => {
    try {
      const response = await commentService.getCommentReplies(commentId, page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
