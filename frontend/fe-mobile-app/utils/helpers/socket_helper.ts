import { io, Socket } from 'socket.io-client';
import { addMessage, setOnlineUsers, updateMessageStatus, receiveMessageUpdate } from '@/features/chat/slice/chat.slice';
import { addNotification } from '@/features/notification/slice/notification.slice';

// Nginx sẽ route /socket.io/* → communication-service.
// Namespace "/chat" được socket.io-client gắn vào URL khi connect.
const SOCKET_GATEWAY = process.env.EXPO_PUBLIC_NODE_SOCKET_URL;
const SOCKET_NAMESPACE = '/chat'; // Namespace NestJS Gateway đang lắng nghe

class SocketService {
  private socket: Socket | null = null;
  private dispatch: any = null;
  private currentUserId: string | null = null;
  private reconnectTimer: any = null;

  initialize(dispatch: any) {
    this.dispatch = dispatch;
  }

  connect(userId: string, token: string) {
    // ── Nếu đã connect với cùng userId, không kết nối lại ──
    if (this.socket?.connected && this.currentUserId === userId) return;

    // ── Ngắt kết nối cũ nếu có ──
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentUserId = userId;

    // Kết nối qua Nginx Gateway → communication-service namespace /chat
    this.socket = io(`${SOCKET_GATEWAY}${SOCKET_NAMESPACE}`, {
      query: { userId },
      auth: { token },
      // polling trước để Nginx handshake, sau đó upgrade lên websocket
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      path: '/socket.io',  // Nginx route /socket.io/ → communication-service
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.socket?.emit('join', userId);
      // Xóa reconnect timer nếu có
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    // ── Nhận tin nhắn mới (dedup được xử lý trong slice) ──
    this.socket.on('receiveMessage', (message) => {
      if (this.dispatch) {
        this.dispatch(addMessage(message));
      }
    });

    // ── Xác nhận tin nhắn đã gửi (server echo) ──
    this.socket.on('messageSent', (message) => {
      // Nếu cần xác nhận thêm (replace optimistic), thêm action ở đây
      console.log('✅ Message confirmed:', message._id);
    });

    // ── Cập nhật trạng thái tin nhắn (delivered/read) ──
    this.socket.on('messageStatusUpdate', (data: { messageId: string; status: string; deliveredAt?: string; readAt?: string }) => {
      if (this.dispatch) {
        this.dispatch(updateMessageStatus(data));
      }
    });

    // ── Cập nhật tin nhắn (edit/delete) ──
    this.socket.on('messageUpdated', (message) => {
      if (this.dispatch) {
        this.dispatch(receiveMessageUpdate(message));
      }
    });

    // ── Danh sách người dùng online (dispatch vào Redux) ──
    this.socket.on('onlineUsers', (userIds: string[]) => {
      if (this.dispatch) {
        this.dispatch(setOnlineUsers(userIds));
      }
    });

    // ── Thông báo ──
    this.socket.on('receiveNotification', (notification) => {
      if (this.dispatch) {
        this.dispatch(addNotification(notification));
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('⚠️ Socket connect error:', error.message);
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUserId = null;
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }

  // ── Gửi tin nhắn qua socket ──
  sendMessage(messageData: {
    senderId: string;
    receiverId?: string;
    groupId?: string;
    conversationId?: string;
    content: string;
    files?: any[];
    messageType?: string;
  }) {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected, cannot send message');
      return false;
    }
    if (messageData.groupId) {
      this.socket.emit('sendGroupMessage', messageData);
    } else {
      this.socket.emit('sendMessage', messageData);
    }
    return true;
  }

  // ── Typing indicator ──
  sendTyping(data: { senderId: string; receiverId?: string; groupId?: string }) {
    if (data.groupId) {
      this.socket?.emit('groupTyping', { senderId: data.senderId, groupId: data.groupId });
    } else {
      this.socket?.emit('typing', { senderId: data.senderId, receiverId: data.receiverId });
    }
  }

  stopTyping(data: { senderId: string; receiverId?: string; groupId?: string }) {
    if (data.groupId) {
      this.socket?.emit('groupStopTyping', { senderId: data.senderId, groupId: data.groupId });
    } else {
      this.socket?.emit('stopTyping', { senderId: data.senderId, receiverId: data.receiverId });
    }
  }

  // ── Mark conversation as read ──
  markConversationAsRead(data: { senderId: string; receiverId: string; readerId: string }) {
    this.socket?.emit('markConversationAsRead', data);
  }

  // ── Lắng nghe typing ──
  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on('userTyping', callback);
    return () => this.socket?.off('userTyping', callback);
  }

  // ── Lắng nghe tin nhắn mới (để dùng ngoài context) ──
  onReceiveMessage(callback: (message: any) => void) {
    this.socket?.on('receiveMessage', callback);
    return () => this.socket?.off('receiveMessage', callback);
  }
}

export const socketService = new SocketService();
export default socketService;
