export interface LikePostRequest {
  postId: string;
  userId: string;
}

export interface LikeCommentRequest {
  commentId: string;
  userId: string;
}

export interface UserFollowResponse {
  userId: string;
  username: string;
  profilePicture: string | null;
  isFollowed?: boolean;
}

export interface InteractionState {
  following: UserFollowResponse[];
  followers: UserFollowResponse[];
  isLoading: boolean;
  isFollowLoading: boolean; // Riêng cho follow action
  error: string | null;
}
