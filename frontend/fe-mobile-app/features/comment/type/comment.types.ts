import { User } from "../../auth/type/auth.types";

export interface CommentItemResponse {
  commentId: string;
  content: string;
  user: User;
  postId?: string;
  parentCommentId?: string | null;
  createdAt: string;
  updatedAt: string;
  numberLikeComment: number;
  numberReplyComment: number;
  isLiked?: boolean;
}

export interface CommentRequest {
  content: string;
  userId: string;
  postId: string;
  parentCommentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentState {
  commentsByPost: Record<string, CommentItemResponse[]>;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}
