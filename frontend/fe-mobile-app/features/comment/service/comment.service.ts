import apiClient, { BackendResponse } from '@/utils/helpers/api_helper';
import { CommentRequest, CommentItemResponse, UpdateCommentRequest } from '../type/comment.types';
import { Page } from '@/utils/types/common.types';

export const commentService = {
  createComment: async (data: CommentRequest): Promise<BackendResponse<CommentItemResponse>> => {
    const response = await apiClient.post<BackendResponse<CommentItemResponse>>('/comment/create', data);
    return response.data;
  },

  getCommentsByPost: async (postId: string, page: number = 1, size: number = 10): Promise<BackendResponse<Page<CommentItemResponse>>> => {
    const response = await apiClient.get<BackendResponse<Page<CommentItemResponse>>>(`/comment/${postId}/all`, {
      params: { page, size },
    });
    return response.data;
  },

  updateComment: async (commentId: string, data: UpdateCommentRequest): Promise<BackendResponse<CommentItemResponse>> => {
    const response = await apiClient.put<BackendResponse<CommentItemResponse>>(`/comment/${commentId}`, data);
    return response.data;
  },

  deleteComment: async (commentId: string, requesterId: string): Promise<BackendResponse<boolean>> => {
    const response = await apiClient.delete<BackendResponse<boolean>>(`/comment/${commentId}`, {
      params: { requesterId },
    });
    return response.data;
  },

  getCommentReplies: async (commentId: string, page: number = 1, size: number = 10): Promise<BackendResponse<Page<CommentItemResponse>>> => {
    const response = await apiClient.get<BackendResponse<Page<CommentItemResponse>>>(`/comment/${commentId}/getAllCommentReply`, {
      params: { page, size },
    });
    return response.data;
  },
};
