import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getCommentsByPostThunk, getCommentsByPostPending, getCommentsByPostFulfilled, getCommentsByPostRejected, createCommentPending, createCommentFulfilled, createCommentRejected, getCommentRepliesFulfilled } from '../thunk/comment.thunk';
import { likeCommentFulfilled } from '../../interaction/thunk/interaction.thunk';
import { CommentItemResponse, CommentState } from '../type/comment.types';
import { BackendResponse } from '@/utils/helpers/api_helper';
import { Page } from '@/utils/types/common.types';

const initialState: CommentState = {
  commentsByPost: {},
  isLoading: false,
  isSubmitting: false,
  error: null,
};

export const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    clearCommentError: (state) => {
      state.error = null;
    },
    resetCommentState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCommentsByPostPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCommentsByPostFulfilled, (state, action) => {
        state.isLoading = false;
        const postId = String(action.meta.arg.postId);
        const { page } = action.meta.arg;
        if (postId) {
          const newComments = action.payload.data.content;
          if (!page || page <= 1) {
            state.commentsByPost[postId] = newComments;
          } else {
            const existingIds = new Set(state.commentsByPost[postId]?.map(c => c.commentId) || []);
            const deduped = newComments.filter((c: any) => !existingIds.has(c.commentId));
            state.commentsByPost[postId] = [...(state.commentsByPost[postId] || []), ...deduped];
          }
        }
      })
      .addCase(getCommentsByPostRejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to fetch comments';
      })
      .addCase(createCommentPending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createCommentFulfilled, (state, action) => {
        state.isSubmitting = false;
        state.error = null;
        // Quay lại dùng postId từ tham số gửi đi để đảm bảo đồng bộ với UI
        const postId = String(action.meta.arg.postId);
        if (postId) {
          if (!state.commentsByPost[postId]) {
            state.commentsByPost[postId] = [];
          }
          // Tạo mảng mới để trigger re-render
          state.commentsByPost[postId] = [action.payload.data, ...state.commentsByPost[postId]];
        }
      })
      .addCase(createCommentRejected, (state, action) => {
        state.isSubmitting = false;
        state.error = (action.payload as any)?.message || 'Failed to post comment';
      })
      .addCase(getCommentRepliesFulfilled, (state, action) => {
        const { postId } = action.meta.arg;
        if (postId) {
          if (!state.commentsByPost[postId]) {
            state.commentsByPost[postId] = [];
          }
          const existingIds = new Set(state.commentsByPost[postId].map(c => c.commentId));
          const newReplies = action.payload.data.content.filter((c: any) => !existingIds.has(c.commentId));
          state.commentsByPost[postId] = [...state.commentsByPost[postId], ...newReplies];
        }
      })
      .addCase(likeCommentFulfilled, (state, action) => {
        const { commentId } = action.meta.arg;
        // Tìm comment trong tất cả các bài post (vì comment được lưu theo postId)
        Object.values(state.commentsByPost).forEach(postComments => {
          const comment = postComments.find(c => c.commentId === commentId);
          if (comment) {
            comment.isLiked = !comment.isLiked;
            comment.numberLikeComment = comment.isLiked ? comment.numberLikeComment + 1 : comment.numberLikeComment - 1;
          }
        });
      });
  },
});

export const { clearCommentError, resetCommentState } = commentSlice.actions;
export default commentSlice.reducer;
