import apiClient, { BackendResponse } from '@/utils/helpers/api_helper';
import { PostRequest, PostResponse, UpdatePostRequest, ReportPostRequest } from '../type/post.types';
import { Page } from '@/utils/types/common.types';

interface ShareResponse {
  shareId: string;
  post: PostResponse;
}

export const postService = {
  createPost: async (data: FormData): Promise<BackendResponse<PostResponse>> => {
    const response = await apiClient.post<BackendResponse<PostResponse>>('/post/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // Tăng timeout cho upload file
    });
    return response.data;
  },

  getAllPosts: async (page: number = 1, size: number = 10): Promise<BackendResponse<Page<PostResponse>>> => {
    const params: any = { page, size };
    const response = await apiClient.get<BackendResponse<Page<PostResponse>>>('/post/all', { params });
    return response.data;
  },

  getAllPostsByUserId: async (userId: string, page: number = 1, size: number = 10): Promise<BackendResponse<Page<PostResponse>>> => {
    const params: any = { page, size };
    const response = await apiClient.get<BackendResponse<Page<PostResponse>>>(`/post/user/${userId}`, { params });
    return response.data;
  },

  getPostById: async (postId: string): Promise<BackendResponse<PostResponse>> => {
    const response = await apiClient.get<BackendResponse<PostResponse>>(`/post/item/${postId}`);
    return response.data;
  },

  updatePost: async (postId: string, data: UpdatePostRequest): Promise<BackendResponse<boolean>> => {
    const response = await apiClient.put<BackendResponse<boolean>>(`/post/update/${postId}`, data);
    return response.data;
  },

  updatePostWithFiles: async (postId: string, data: FormData): Promise<BackendResponse<PostResponse>> => {
    const response = await apiClient.put<BackendResponse<PostResponse>>(`/post/update/${postId}/with-files`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // Tăng timeout cho upload file
    });
    return response.data;
  },

  deletePost: async (postId: string): Promise<BackendResponse<boolean>> => {
    const response = await apiClient.delete<BackendResponse<boolean>>(`/post/${postId}`);
    return response.data;
  },

  setPublic: async (postId: string): Promise<BackendResponse<boolean>> => {
    const response = await apiClient.put<BackendResponse<boolean>>(`/post/set-public/${postId}`);
    return response.data;
  },

  setPrivate: async (postId: string): Promise<BackendResponse<boolean>> => {
    const response = await apiClient.put<BackendResponse<boolean>>(`/post/set-private/${postId}`);
    return response.data;
  },

  reportPost: async (postId: string, data: ReportPostRequest): Promise<BackendResponse<any>> => {
    const response = await apiClient.post<BackendResponse<any>>(`/post/${postId}/report`, data);
    return response.data;
  },

  toggleSavePost: async (postId: string): Promise<BackendResponse<boolean>> => {
    const response = await apiClient.post<BackendResponse<boolean>>(`/post/${postId}/save`);
    return response.data;
  },

  getSavedPosts: async (page: number = 1, size: number = 10): Promise<BackendResponse<Page<PostResponse>>> => {
    const params: any = { page, size };
    const response = await apiClient.get<BackendResponse<Page<PostResponse>>>('/post/saved', { params });
    return response.data;
  },

  getSharedPosts: async (userId: string, page: number = 1, size: number = 10): Promise<BackendResponse<Page<PostResponse>>> => {
    const params: any = { page, size };
    const response = await apiClient.get<BackendResponse<Page<ShareResponse>>>(`/share/user/${userId}`, { params });
    
    // Map ShareResponse to PostResponse with shareId
    const mappedData = {
      ...response.data,
      content: response.data.content.map(item => ({
        ...item.post,
        shareId: item.shareId
      }))
    };
    
    return {
      ...response,
      data: mappedData
    };
  },

deleteShare: async (shareId: string): Promise<BackendResponse<boolean>> => {
  const response = await apiClient.delete<BackendResponse<boolean>>(`/share/delete/${shareId}`);
  return response.data;
},

  sharePost: async (postId: string, userId: string): Promise<BackendResponse<any>> => {
    const response = await apiClient.post<BackendResponse<any>>('/share/create', { postId, userId });
    return response.data;
  },
};
