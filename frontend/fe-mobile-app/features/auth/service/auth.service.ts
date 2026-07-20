import apiClient, { BackendResponse } from '@/utils/helpers/api_helper';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, GetMeResponse, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest } from '../type/auth.types';

export const authService = {
  login: async (data: LoginRequest): Promise<BackendResponse<LoginResponse>> => {
    const response = await apiClient.post<BackendResponse<LoginResponse>>('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterRequest): Promise<BackendResponse<RegisterResponse>> => {
    const response = await apiClient.post<BackendResponse<RegisterResponse>>('/user/register', data);
    return response.data;
  },
  getMe: async (): Promise<BackendResponse<GetMeResponse>> => {
    const response = await apiClient.get<BackendResponse<GetMeResponse>>('/auth/me');
    return response.data;
  },
  forgotPassword: async (data: ForgotPasswordRequest): Promise<BackendResponse<any>> => {
    const response = await apiClient.post<BackendResponse<any>>('/auth/forgot-password', data);
    return response.data;
  },
  resetPassword: async (data: ResetPasswordRequest): Promise<BackendResponse<any>> => {
    const response = await apiClient.post<BackendResponse<any>>('/auth/reset-password', data);
    return response.data;
  },
  changePassword: async (data: ChangePasswordRequest): Promise<BackendResponse<any>> => {
    const response = await apiClient.post<BackendResponse<any>>('/auth/change-password', data);
    return response.data;
  },
};
