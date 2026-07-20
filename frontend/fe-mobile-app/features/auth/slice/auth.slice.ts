import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loginThunk, loginPending, loginFulfilled, loginRejected, registerThunk, registerPending, registerFulfilled, registerRejected, getMeThunk, getMePending, getMeFulfilled, getMeRejected, logoutFulfilled } from '../thunk/auth.thunk';
import { LoginResponse, User } from '../type/auth.types';
import { BackendResponse } from '@/utils/helpers/api_helper';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginFulfilled, (state, action: PayloadAction<BackendResponse<LoginResponse>>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.data.accessToken;
        state.error = null;
      })
      .addCase(loginRejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = (action.payload as any)?.message || 'Login failed';
      })
      // Register
      .addCase(registerPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerFulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerRejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Registration failed';
      })
      // Get Me
      .addCase(getMePending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMeFulfilled, (state, action: PayloadAction<BackendResponse<User>>) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getMeRejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to fetch user data';
      })
      // Logout
      .addCase(logoutFulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });
  },
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
