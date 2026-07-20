import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, Conversation, ChatMessage } from '../type/chat.types';
import {
  getConversationsFulfilled,
  getMessagesFulfilled,
  getConversationsPending,
  getConversationsRejected,
  getMessagesPending,
  getMessagesRejected,
  createConversationFulfilled,
} from '../thunk/chat.thunk';

const initialState: ChatState = {
  conversations: [],
  messagesList: [],
  currentConversationId: null,
  isLoading: false,
  isSendingMessage: false,
  error: null,
  onlineUsers: [],
  typingUsers: {}, // { userId: boolean }
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // ── Nhận tin nhắn mới qua socket (có dedup) ──
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const newMsg = action.payload;

      // Dedup: không thêm nếu đã có _id này
      const alreadyExists = state.messagesList.some(m => m._id === newMsg._id);

      if (!alreadyExists &&
        (newMsg.conversationId === state.currentConversationId ||
          newMsg.groupId === state.currentConversationId ||
          (!newMsg.conversationId && !newMsg.groupId))) {
        state.messagesList = [...state.messagesList, newMsg];
      }

      // Cập nhật lastMessage trong conversation list (theo conversationId hoặc participants)
      const convIndex = state.conversations.findIndex(
        c => c._id === newMsg.conversationId || c._id === newMsg.groupId
      );
      if (convIndex !== -1) {
        state.conversations[convIndex].lastMessage = newMsg;
        state.conversations[convIndex].updatedAt = newMsg.createdAt;
        // Đẩy conversation lên đầu danh sách
        const [conv] = state.conversations.splice(convIndex, 1);
        state.conversations.unshift(conv);
      }
    },

    // ── Cập nhật trạng thái tin nhắn (delivered/read) ──
    updateMessageStatus: (state, action: PayloadAction<{
      messageId: string;
      status: string;
      deliveredAt?: string;
      readAt?: string;
    }>) => {
      const { messageId, status, deliveredAt, readAt } = action.payload;
      const msgIndex = state.messagesList.findIndex(m => m._id === messageId);
      if (msgIndex !== -1) {
        state.messagesList[msgIndex].status = status as any;
        if (deliveredAt) state.messagesList[msgIndex].deliveredAt = deliveredAt;
        if (readAt) state.messagesList[msgIndex].readAt = readAt;
      }
    },

    // ── Cập nhật tin nhắn đã chỉnh sửa/xóa từ socket ──
    receiveMessageUpdate: (state, action: PayloadAction<ChatMessage>) => {
      const updatedMsg = action.payload;
      const msgIndex = state.messagesList.findIndex(m => m._id === updatedMsg._id);
      if (msgIndex !== -1) {
        state.messagesList[msgIndex] = { ...state.messagesList[msgIndex], ...updatedMsg };
      }
    },

    // ── Thả/Hủy reaction cục bộ để phản hồi giao diện tức thời ──
    toggleReactionLocal: (state, action: PayloadAction<{ messageId: string; userId: string; emoji: string }>) => {
      const { messageId, userId, emoji } = action.payload;
      const msgIndex = state.messagesList.findIndex(m => m._id === messageId);
      if (msgIndex !== -1) {
        const message = state.messagesList[msgIndex];
        if (!message.reactions) {
          message.reactions = {};
        }
        if (!message.reactions[emoji]) {
          message.reactions[emoji] = [];
        }
        const userIndex = message.reactions[emoji].indexOf(userId);
        if (userIndex > -1) {
          message.reactions[emoji].splice(userIndex, 1);
          if (message.reactions[emoji].length === 0) {
            delete message.reactions[emoji];
          }
        } else {
          message.reactions[emoji].push(userId);
        }
      }
    },

    // ── Optimistic: thêm tin nhắn tạm trước khi server xác nhận ──
    addOptimisticMessage: (state, action: PayloadAction<ChatMessage>) => {
      const newMsg = action.payload;
      state.messagesList = [...state.messagesList, newMsg];
      state.isSendingMessage = true;

      // Cập nhật lastMessage ngay lập tức để danh sách chat bên ngoài hiển thị tin nhắn mới gửi
      const convIndex = state.conversations.findIndex(
        c => c._id === newMsg.conversationId || c._id === newMsg.groupId
      );
      if (convIndex !== -1) {
        state.conversations[convIndex].lastMessage = newMsg;
        state.conversations[convIndex].updatedAt = newMsg.createdAt;
        // Đẩy conversation lên đầu danh sách
        const [conv] = state.conversations.splice(convIndex, 1);
        state.conversations.unshift(conv);
      }
    },

    // ── Xóa tin nhắn optimistic nếu gửi thất bại ──
    removeOptimisticMessage: (state, action: PayloadAction<string>) => {
      state.messagesList = state.messagesList.filter(m => m._id !== action.payload);
      state.isSendingMessage = false;
    },

    setCurrentConversation: (state, action: PayloadAction<string | null>) => {
      state.currentConversationId = action.payload;
      if (action.payload === null) {
        state.messagesList = [];
      }
    },

    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },

    // ── Typing indicator ──
    setTypingUser: (state, action: PayloadAction<{ userId: string; isTyping: boolean }>) => {
      const { userId, isTyping } = action.payload;
      if (isTyping) {
        state.typingUsers[userId] = true;
      } else {
        delete state.typingUsers[userId];
      }
    },

    clearChatError: (state) => {
      state.error = null;
    },

    deleteMessageLocal: (state, action: PayloadAction<{ messageId: string; deleteType: 'deleteForMe' | 'deleteForEveryone'; userId: string }>) => {
      const { messageId, deleteType, userId } = action.payload;
      if (deleteType === 'deleteForMe') {
        state.messagesList = state.messagesList.filter(m => m._id !== messageId);
      } else {
        const msgIndex = state.messagesList.findIndex(m => m._id === messageId);
        if (msgIndex !== -1) {
          state.messagesList[msgIndex] = {
            ...state.messagesList[msgIndex],
            isDeleted: true,
            content: '[Tin nhắn đã bị xóa]',
            files: []
          };
        }
      }
    },

    deleteConversationLocal: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      state.conversations = state.conversations.filter(c => c._id !== conversationId);
    },
  },
  extraReducers: (builder) => {
    // Get Conversations
    builder
      .addCase(getConversationsPending, (state) => {
        state.isLoading = true;
      })
      .addCase(getConversationsFulfilled, (state, action: PayloadAction<Conversation[]>) => {
        state.isLoading = false;
        state.conversations = action.payload ?? [];
      })
      .addCase(getConversationsRejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Messages
      .addCase(getMessagesPending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMessagesFulfilled, (state, action: PayloadAction<ChatMessage[]>) => {
        state.isLoading = false;
        state.messagesList = action.payload ?? [];
      })
      .addCase(getMessagesRejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Conversation (idempotent)
      .addCase(createConversationFulfilled, (state, action: PayloadAction<Conversation>) => {
        const exists = state.conversations.some(c => c._id === action.payload._id);
        if (!exists) {
          state.conversations = [action.payload, ...state.conversations];
        }
      });
  },
});

export const {
  addMessage,
  updateMessageStatus,
  receiveMessageUpdate,
  addOptimisticMessage,
  removeOptimisticMessage,
  setCurrentConversation,
  setOnlineUsers,
  setTypingUser,
  clearChatError,
  deleteMessageLocal,
  deleteConversationLocal,
  toggleReactionLocal,
} = chatSlice.actions;
export default chatSlice.reducer;
