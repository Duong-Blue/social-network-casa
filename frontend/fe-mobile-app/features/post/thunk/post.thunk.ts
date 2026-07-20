import { createAsyncThunks } from '@/utils/redux';
import { postService } from '../service/post.service';
import { PostRequest, PostResponse, UpdatePostRequest, ReportPostRequest } from '../type/post.types';
import { BackendResponse } from '@/utils/helpers/api_helper';

export const {
  thunk: createPostThunk,
  pending: createPostPending,
  fulfilled: createPostFulfilled,
  rejected: createPostRejected,
} = createAsyncThunks<BackendResponse<PostResponse>, FormData>(
  'post/createPost',
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await postService.createPost(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: getAllPostsThunk,
  pending: getAllPostsPending,
  fulfilled: getAllPostsFulfilled,
  rejected: getAllPostsRejected,
} = createAsyncThunks<BackendResponse<any>, { page?: number; size?: number }>(
  'post/getAllPosts',
  async ({ page, size }, { rejectWithValue }) => {
    try {
      const response = await postService.getAllPosts(page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: getAllPostsByUserIdThunk,
  pending: getAllPostsByUserIdPending,
  fulfilled: getAllPostsByUserIdFulfilled,
  rejected: getAllPostsByUserIdRejected,
} = createAsyncThunks<BackendResponse<any>, { userId: string; page?: number; size?: number }>(
  'post/getAllPostsByUserId',
  async ({ userId, page, size }, { rejectWithValue }) => {
    try {
      const response = await postService.getAllPostsByUserId(userId, page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: getPostByIdThunk,
  pending: getPostByIdPending,
  fulfilled: getPostByIdFulfilled,
  rejected: getPostByIdRejected,
} = createAsyncThunks<BackendResponse<PostResponse>, string>(
  'post/getPostById',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await postService.getPostById(postId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: deletePostThunk,
  pending: deletePostPending,
  fulfilled: deletePostFulfilled,
  rejected: deletePostRejected,
} = createAsyncThunks<BackendResponse<boolean>, string>(
  'post/deletePost',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await postService.deletePost(postId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
export const {
  thunk: updatePostThunk,
  pending: updatePostPending,
  fulfilled: updatePostFulfilled,
  rejected: updatePostRejected,
} = createAsyncThunks<BackendResponse<PostResponse>, { postId: string; data: FormData }>(
  'post/updatePost',
  async ({ postId, data }, { rejectWithValue }) => {
    try {
      const response = await postService.updatePostWithFiles(postId, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: toggleSavePostThunk,
  pending: toggleSavePostPending,
  fulfilled: toggleSavePostFulfilled,
  rejected: toggleSavePostRejected,
} = createAsyncThunks<BackendResponse<boolean>, string>(
  'post/toggleSavePost',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await postService.toggleSavePost(postId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: getSavedPostsThunk,
  pending: getSavedPostsPending,
  fulfilled: getSavedPostsFulfilled,
  rejected: getSavedPostsRejected,
} = createAsyncThunks<BackendResponse<any>, { page?: number; size?: number }>(
  'post/getSavedPosts',
  async ({ page, size }, { rejectWithValue }) => {
    try {
      const response = await postService.getSavedPosts(page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: getSharedPostsThunk,
  pending: getSharedPostsPending,
  fulfilled: getSharedPostsFulfilled,
  rejected: getSharedPostsRejected,
} = createAsyncThunks<BackendResponse<any>, { userId: string; page?: number; size?: number }>(
  'post/getSharedPosts',
  async ({ userId, page, size }, { rejectWithValue }) => {
    try {
      const response = await postService.getSharedPosts(userId, page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: sharePostThunk,
  pending: sharePostPending,
  fulfilled: sharePostFulfilled,
  rejected: sharePostRejected,
} = createAsyncThunks<BackendResponse<any>, { postId: string; userId: string }>(
  'post/sharePost',
  async ({ postId, userId }, { rejectWithValue }) => {
    try {
      const response = await postService.sharePost(postId, userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const {
  thunk: deleteShareThunk,
  pending: deleteSharePending,
  fulfilled: deleteShareFulfilled,
  rejected: deleteShareRejected,
} = createAsyncThunks<BackendResponse<boolean>, string>(
  'post/deleteShare',
  async (shareId: string, { rejectWithValue }) => {
    try {
      const response = await postService.deleteShare(shareId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

