import { RootState } from '@/store';

export const selectMyProfile = (state: RootState) => state.account.myProfile;
export const selectViewedProfile = (state: RootState) => state.account.viewedProfile;
export const selectIsProfileLoading = (state: RootState) => state.account.isLoading;
export const selectProfileError = (state: RootState) => state.account.error;
