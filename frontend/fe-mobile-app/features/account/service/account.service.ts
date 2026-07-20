import apiClient, { BackendResponse } from '@/utils/helpers/api_helper';
import { ProfileUserResponse } from '../type/account.types';

export const accountService = {
  getProfile: async (userId: string): Promise<BackendResponse<ProfileUserResponse>> => {
    const response = await apiClient.get<BackendResponse<ProfileUserResponse>>(`/user/${userId}/profile`);
    return response.data;
  },
  updateProfile: async (userId: string, data: FormData): Promise<BackendResponse<ProfileUserResponse>> => {
    const response = await apiClient.put<BackendResponse<ProfileUserResponse>>(`/user/update/profile/${userId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getAllUsers: async (page: number = 1, size: number = 10): Promise<BackendResponse<any>> => {
    const response = await apiClient.get<BackendResponse<any>>(`/user/all`, {
      params: { page, size }
    });
    return response.data;
  }
};
