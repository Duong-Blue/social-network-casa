export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
}

export interface User {
  userId: string;
  username: string;
  roles: string[];
  profilePicture?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password?: string;
}

export type GetMeResponse = User;
export type RegisterResponse = string;

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
