import apiClient, { BackendResponse } from '@/utils/helpers/api_helper';
import { LikePostRequest, LikeCommentRequest, UserFollowResponse } from '../type/interaction.types';

export const interactionService = {
  // Like actions
  likePost: async (data: LikePostRequest): Promise<BackendResponse<boolean>> => {
    const response = await apiClient.post<BackendResponse<boolean>>('/like/post', data);
    return response.data;
  },

  likeComment: async (data: LikeCommentRequest): Promise<BackendResponse<boolean>> => {
    const response = await apiClient.post<BackendResponse<boolean>>('/like/comment', data);
    return response.data;
  },

  // Follow actions
  followUser: async (followerId: string, followingId: string): Promise<BackendResponse<boolean>> => {
    const response = await apiClient.post<BackendResponse<boolean>>(`/follows/${followerId}/follow/${followingId}`);
    return response.data;
  },

  unfollowUser: async (followerId: string, followingId: string): Promise<BackendResponse<boolean>> => {
    const response = await apiClient.delete<BackendResponse<boolean>>(`/follows/${followerId}/unfollow/${followingId}`);
    return response.data;
  },

  checkFollowStatus: async (followerId: string, followingId: string): Promise<BackendResponse<boolean>> => {
    const response = await apiClient.get<BackendResponse<boolean>>(`/follows/check`, {
      params: { followerId, followingId }
    });
    return response.data;
  },

  getFollowers: async (userId: string): Promise<BackendResponse<UserFollowResponse[]>> => {
    const response = await apiClient.get<BackendResponse<UserFollowResponse[]>>(`/follows/${userId}/followers`);
    return response.data;
  },

  getFollowing: async (userId: string): Promise<BackendResponse<UserFollowResponse[]>> => {
    const response = await apiClient.get<BackendResponse<UserFollowResponse[]>>(`/follows/${userId}/following`);
    return response.data;
  },
};

