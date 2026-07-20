import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getProfileThunk, getMyProfileThunk, updateProfileThunk, getSuggestedUsersThunk } from '../thunk/account.thunk';
import { AccountState, ProfileUserResponse } from '../type/account.types';
import { BackendResponse } from '@/utils/helpers/api_helper';

const initialState: AccountState = {
  myProfile: null,
  viewedProfile: null,
  suggestedUsers: [],
  isLoading: false,
  error: null,
};

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    clearViewedProfile: (state) => {
      state.viewedProfile = null;
      state.error = null;
    },
    clearMyProfile: (state) => {
      state.myProfile = null;
      state.error = null;
    },
    // ── Cập nhật số follower/following sau follow/unfollow (optimistic) ──
    adjustFollowerCount: (state, action: PayloadAction<{ delta: number }>) => {
      if (state.viewedProfile) {
        state.viewedProfile.numberFollower = Math.max(0, (state.viewedProfile.numberFollower || 0) + action.payload.delta);
      }
      if (state.myProfile) {
        state.myProfile.numberFollower = Math.max(0, (state.myProfile.numberFollower || 0) + action.payload.delta);
      }
    },
    adjustFollowingCount: (state, action: PayloadAction<{ delta: number }>) => {
      if (state.viewedProfile) {
        state.viewedProfile.numberFollowing = Math.max(0, (state.viewedProfile.numberFollowing || 0) + action.payload.delta);
      }
      if (state.myProfile) {
        state.myProfile.numberFollowing = Math.max(0, (state.myProfile.numberFollowing || 0) + action.payload.delta);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // getProfileThunk (Viewed Profile)
      .addCase(getProfileThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfileThunk.fulfilled, (state, action: PayloadAction<BackendResponse<ProfileUserResponse>>) => {
        state.isLoading = false;
        state.viewedProfile = action.payload.data;
        state.error = null;
      })
      .addCase(getProfileThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to fetch profile';
      })
      // getMyProfileThunk (My Profile)
      .addCase(getMyProfileThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyProfileThunk.fulfilled, (state, action: PayloadAction<BackendResponse<ProfileUserResponse>>) => {
        state.isLoading = false;
        state.myProfile = action.payload.data;
        state.error = null;
      })
      .addCase(getMyProfileThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to fetch my profile';
      })
      // updateProfileThunk (Update My Profile)
      .addCase(updateProfileThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action: PayloadAction<BackendResponse<ProfileUserResponse>>) => {
        state.isLoading = false;
        state.myProfile = action.payload.data;
        state.error = null;
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to update profile';
      })
      // getSuggestedUsersThunk
      .addCase(getSuggestedUsersThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSuggestedUsersThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.suggestedUsers = action.payload.data?.content || [];
      })
      .addCase(getSuggestedUsersThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearViewedProfile, clearMyProfile, adjustFollowerCount, adjustFollowingCount } = accountSlice.actions;
export default accountSlice.reducer;
