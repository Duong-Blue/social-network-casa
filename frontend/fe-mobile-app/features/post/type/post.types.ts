import { User } from "../../auth/type/auth.types";

export interface PostResponse {
  postId: string;
  content: string;
  user: User;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
  isPublicPost: boolean;
  isPublicComment: boolean;
  numberLike: number;
  numberComment: number;
  numberShare: number;
  liked: boolean;
  isFollowed: boolean;
  privacyLevel?: string;
  isSaved?: boolean;
  shareId?: string;
}

export interface PostRequest {
  content: string;
  userId: string;
  isPublicPost: boolean;
  isPublicComment: boolean;
  privacyLevel?: string;
}

export interface UpdatePostRequest {
  content?: string;
  isPublicPost?: boolean;
  isPublicComment?: boolean;
  privacyLevel?: string;
}

export interface ReportPostRequest {
  userId: string;
  reason: string;
  description: string;
}

export interface PostState {
  posts: PostResponse[];
  userPosts: PostResponse[];
  savedPosts: PostResponse[];
  sharedPosts: PostResponse[];
  currentPost: PostResponse | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}
