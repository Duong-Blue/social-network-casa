import { nodeClient, BackendResponse } from '@/utils/helpers/api_helper';
import { StoryResponse, UserStoryGroup, CreateStoryRequest } from '../type/story.types';

export const storyService = {
  getFeedStories: async (friendIds: string[]): Promise<BackendResponse<UserStoryGroup[]>> => {
    const response = await nodeClient.post<BackendResponse<UserStoryGroup[]>>('/stories/feed', { friendIds });
    return response.data;
  },

  getAllStories: async (): Promise<BackendResponse<UserStoryGroup[]>> => {
    const response = await nodeClient.get<BackendResponse<UserStoryGroup[]>>('/stories/all');
    return response.data;
  },

  createStory: async (data: FormData): Promise<BackendResponse<StoryResponse>> => {
    const response = await nodeClient.post<BackendResponse<StoryResponse>>('/stories', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  markAsViewed: async (storyId: string, userId: string): Promise<BackendResponse<StoryResponse>> => {
    const response = await nodeClient.post<BackendResponse<StoryResponse>>(`/stories/${storyId}/view`, { userId });
    return response.data;
  },

  reactStory: async (storyId: string, userId: string, emoji: string): Promise<BackendResponse<StoryResponse>> => {
    const response = await nodeClient.post<BackendResponse<StoryResponse>>(`/stories/${storyId}/react`, { userId, emoji });
    return response.data;
  },

  deleteStory: async (storyId: string, userId: string): Promise<BackendResponse<boolean>> => {
    const response = await nodeClient.delete<BackendResponse<boolean>>(`/stories/${storyId}`, {
      params: { userId },
    });
    return response.data;
  },
};
