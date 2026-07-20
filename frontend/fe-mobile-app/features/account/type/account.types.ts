export interface ProfileUserResponse {
  userId: string;
  username: string;
  profilePicture: string | null;
  bio: string | null;
  numberPost: number;
  numberFollower: number;
  numberFollowing: number;
  createdAt: string;
  isLocked: boolean;
}

export interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  profilePicture?: File | null;
}

export interface AccountState {
  myProfile: ProfileUserResponse | null;
  viewedProfile: ProfileUserResponse | null;
  suggestedUsers: any[];
  isLoading: boolean;
  error: string | null;
}
