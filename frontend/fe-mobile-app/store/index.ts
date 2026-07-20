import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { registerLogoutHandler } from '@/utils/helpers/api_helper';
import { logout } from '@/features/auth/slice/auth.slice';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import authReducer from '@/features/auth/slice/auth.slice';
import interactionReducer from '@/features/interaction/slice/interaction.slice';
import accountReducer from '@/features/account/slice/account.slice';
import postReducer from '@/features/post/slice/post.slice';
import commentReducer from '@/features/comment/slice/comment.slice';
import chatReducer from '@/features/chat/slice/chat.slice';
import storyReducer from '@/features/story/slice/story.slice';
import notificationReducer from '@/features/notification/slice/notification.slice';
import searchReducer from '@/features/search/slice/search.slice';

// Web (localStorage) wrapper cho redux-persist
const webStorage = {
  getItem: (key: string) => {
    return Promise.resolve(typeof window !== 'undefined' ? window.localStorage.getItem(key) : null);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
};

const persistStorage = Platform.OS === 'web' ? webStorage : AsyncStorage;

// App core reducers
const rootReducer = combineReducers({
  auth: authReducer,
  interaction: interactionReducer,
  account: accountReducer,
  post: postReducer,
  comment: commentReducer,
  chat: chatReducer,
  story: storyReducer,
  notification: notificationReducer,
  search: searchReducer,
});

const persistConfig = {
  key: 'root',
  storage: persistStorage,
  whitelist: ['auth', 'account'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

registerLogoutHandler(() => {
  store.dispatch(logout());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;