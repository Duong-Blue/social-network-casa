import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserFollowResponse, InteractionState } from '../type/interaction.types';
import {
  getFollowingFulfilled,
  getFollowersFulfilled,
  followUserFulfilled,
  followUserPending,
  followUserRejected,
  unfollowUserFulfilled,
  unfollowUserPending,
  unfollowUserRejected,
} from '../thunk/interaction.thunk';

const initialState: InteractionState = {
  following: [],
  followers: [],
  isLoading: false,
  isFollowLoading: false,
  error: null,
};

export const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    setFollowing: (state, action: PayloadAction<UserFollowResponse[]>) => {
      state.following = action.payload;
    },
    resetInteractionState: () => initialState,
    // ── Optimistic: thêm vào following trước khi API response ──
    optimisticFollow: (state, action: PayloadAction<string>) => {
      const followingId = action.payload;
      if (!state.following.some(f => f.userId === followingId)) {
        state.following.push({ userId: followingId, username: '', profilePicture: null });
      }
    },
    // ── Optimistic: xóa khỏi following trước khi API response ──
    optimisticUnfollow: (state, action: PayloadAction<string>) => {
      state.following = state.following.filter(f => f.userId !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Get Following ──
      .addCase(getFollowingFulfilled, (state, action) => {
        state.following = action.payload.data ?? [];
        state.isLoading = false;
      })
      // ── Get Followers ──
      .addCase(getFollowersFulfilled, (state, action) => {
        state.followers = action.payload.data ?? [];
        state.isLoading = false;
      })

      // ── Follow ──
      .addCase(followUserPending, (state) => {
        state.isFollowLoading = true;
      })
      .addCase(followUserFulfilled, (state, action) => {
        state.isFollowLoading = false;
        const { followingId } = action.meta.arg;
        // Đảm bảo có trong list (confirm optimistic update)
        if (!state.following.some(f => f.userId === followingId)) {
          state.following.push({ userId: followingId, username: '', profilePicture: null });
        }
      })
      .addCase(followUserRejected, (state, action) => {
        state.isFollowLoading = false;
        // Backend bây giờ trả 200 cho mọi trường hợp (idempotent)
        // Nếu vẫn bị rejected do lỗi network, rollback optimistic update
        const { followingId } = action.meta.arg;
        state.following = state.following.filter(f => f.userId !== followingId);
        state.error = 'Không thể theo dõi. Vui lòng thử lại.';
      })

      // ── Unfollow ──
      .addCase(unfollowUserPending, (state) => {
        state.isFollowLoading = true;
      })
      .addCase(unfollowUserFulfilled, (state, action) => {
        state.isFollowLoading = false;
        const { followingId } = action.meta.arg;
        state.following = state.following.filter(f => f.userId !== followingId);
      })
      .addCase(unfollowUserRejected, (state, action) => {
        state.isFollowLoading = false;
        // Rollback: thêm lại vào following nếu unfollow thất bại
        const { followingId } = action.meta.arg;
        if (!state.following.some(f => f.userId === followingId)) {
          state.following.push({ userId: followingId, username: '', profilePicture: null });
        }
        state.error = 'Không thể bỏ theo dõi. Vui lòng thử lại.';
      });
  },
});

export const { setFollowing, resetInteractionState, optimisticFollow, optimisticUnfollow } = interactionSlice.actions;
export default interactionSlice.reducer;
