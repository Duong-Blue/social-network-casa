import { createAsyncThunk } from '@reduxjs/toolkit';
import { chatService } from '../service/chat.service';
import { Conversation, ChatMessage } from '../type/chat.types';

export const getConversationsThunk = createAsyncThunk(
  'chat/getConversations',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await chatService.getConversations(userId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch conversations');
    }
  }
);

export const getMessagesThunk = createAsyncThunk(
  'chat/getMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      return await chatService.getMessages(conversationId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch messages');
    }
  }
);

export const createConversationThunk = createAsyncThunk(
  'chat/createConversation',
  async ({ user1Id, user2Id }: { user1Id: string; user2Id: string }, { rejectWithValue }) => {
    try {
      return await chatService.createConversation(user1Id, user2Id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to create conversation');
    }
  }
);

// Actions mẫu cho pending/fulfilled/rejected nếu cần dùng matchers
export const getConversationsPending = getConversationsThunk.pending;
export const getConversationsFulfilled = getConversationsThunk.fulfilled;
export const getConversationsRejected = getConversationsThunk.rejected;

export const getMessagesPending = getMessagesThunk.pending;
export const getMessagesFulfilled = getMessagesThunk.fulfilled;
export const getMessagesRejected = getMessagesThunk.rejected;

export const createConversationFulfilled = createConversationThunk.fulfilled;
