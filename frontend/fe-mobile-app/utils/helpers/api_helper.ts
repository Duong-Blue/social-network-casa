import axios from 'axios';
import { getToken, removeToken } from '@/utils/token';

let logoutHandler: (() => void) | null = null;

export const registerLogoutHandler = (handler: () => void) => {
  logoutHandler = handler;
};

export interface BackendResponse<T> {
  status?: number;
  success?: boolean;
  message?: string;
  data: T;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;       // → Nginx /api/v1
const NODE_BASE_URL = process.env.EXPO_PUBLIC_NODE_API_URL; // → Nginx /chat


// Tạo axios instance
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: tự động thêm token vào headers
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      if (error.response) {
        console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response.status}:`, error.response.data);
      } else if (error.request) {
        console.error(`❌ Network error - ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.message);
      } else {
        console.error('❌ Error:', error.message);
      }
    }

    // Nếu lỗi 401 (Unauthorized), có thể xóa token và redirect về login
    if (error.response?.status === 401) {
      removeToken();
      if (logoutHandler) {
        logoutHandler();
      }
      console.error('Unauthorized - Token may be expired');
    }
    return Promise.reject(error);
  }
);

// Instance cho Backend Node.js (Chat/Socket)
export const nodeClient = axios.create({
  baseURL: NODE_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

nodeClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor cho nodeClient
nodeClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ [NODE] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      if (error.response) {
        console.error(`❌ [NODE] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response.status}:`, JSON.stringify(error.response.data));
      } else {
        console.error(`❌ [NODE] Network error:`, error.message);
      }
    }
    if (error.response?.status === 401) {
      removeToken();
      if (logoutHandler) {
        logoutHandler();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
