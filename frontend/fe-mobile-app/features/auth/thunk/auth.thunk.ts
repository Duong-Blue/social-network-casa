import { createAsyncThunks } from '@/utils/redux';
import { authService } from '../service/auth.service';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, GetMeResponse, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest } from '../type/auth.types';
import { BackendResponse } from '@/utils/helpers/api_helper';
import { saveToken, removeToken } from '@/utils/token';
import { resetPostState as resetPostStateAction } from '@/features/post/slice/post.slice';
import { clearProfile } from '@/features/account/slice/account.slice';
import { resetCommentState } from '@/features/comment/slice/comment.slice';
import { resetInteractionState } from '@/features/interaction/slice/interaction.slice';

export const {
  thunk: logoutThunk,
  pending: logoutPending,
  fulfilled: logoutFulfilled,
  rejected: logoutRejected,
} = createAsyncThunks<void, void>(
  'auth/logout',
  async (_, { dispatch }) => {
    await removeToken();
    dispatch(resetPostStateAction());
    dispatch(clearProfile());
    dispatch(resetCommentState());
    dispatch(resetInteractionState());
  }
);

export const {
  thunk: loginThunk,
  pending: loginPending,
  fulfilled: loginFulfilled,
  rejected: loginRejected,
} = createAsyncThunks<BackendResponse<LoginResponse>, LoginRequest>(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(data);
      if (response.data && response.data.accessToken) {
        await saveToken(response.data.accessToken);
      }
      return response;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message);
    }
  }
);

export const {
  thunk: registerThunk,
  pending: registerPending,
  fulfilled: registerFulfilled,
  rejected: registerRejected,
} = createAsyncThunks<BackendResponse<RegisterResponse>, RegisterRequest>(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      return response;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message);
    }
  }
);

export const {
  thunk: getMeThunk,
  pending: getMePending,
  fulfilled: getMeFulfilled,
  rejected: getMeRejected,
} = createAsyncThunks<BackendResponse<GetMeResponse>, void>(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getMe();
      return response;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message);
    }
  }
);
export const {
  thunk: forgotPasswordThunk,
  pending: forgotPasswordPending,
  fulfilled: forgotPasswordFulfilled,
  rejected: forgotPasswordRejected,
} = createAsyncThunks<BackendResponse<any>, ForgotPasswordRequest>(
  'auth/forgotPassword',
  async (data: ForgotPasswordRequest, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(data);
      return response;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message);
    }
  }
);

export const {
  thunk: resetPasswordThunk,
  pending: resetPasswordPending,
  fulfilled: resetPasswordFulfilled,
  rejected: resetPasswordRejected,
} = createAsyncThunks<BackendResponse<any>, ResetPasswordRequest>(
  'auth/resetPassword',
  async (data: ResetPasswordRequest, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(data);
      return response;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message);
    }
  }
);

export const {
  thunk: changePasswordThunk,
  pending: changePasswordPending,
  fulfilled: changePasswordFulfilled,
  rejected: changePasswordRejected,
} = createAsyncThunks<BackendResponse<any>, ChangePasswordRequest>(
  'auth/changePassword',
  async (data: ChangePasswordRequest, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(data);
      return response;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message);
    }
  }
);
