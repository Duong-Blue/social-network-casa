import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessageService } from '../messages/message.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GroupService } from '../groups/group.service';

@WebSocketGateway(3001, {
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private userSockets: Map<string, string> = new Map(); // socketId -> userId

  constructor(
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly groupService: GroupService,
  ) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    message: { senderId: string; receiverId: string; content: string; conversationId?: string; files?: any[] },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      // Save message to database (conversationId được lưu để query về sau)
      const savedMessage = await this.messageService.createMessage(
        message.senderId,
        message.receiverId,
        message.content,
        undefined, // groupId
        message.files || [], // ── Nhận files ở đây ──
        undefined, // replyTo
        undefined, // mentions
        message.conversationId, // ── Quan trọng: lưu conversationId ──
      );

      // Get receiver's socket ID
      const receiverSocketId = this.connectedUsers.get(message.receiverId);
      
      if (receiverSocketId) {
        // Emit to specific user's room
        this.server.to(receiverSocketId).emit('receiveMessage', savedMessage);
        
        // Tự động đánh dấu delivered khi người nhận online
        try {
          const deliveredMessage = await this.messageService.markAsDelivered(
            savedMessage._id.toString(),
            message.receiverId,
          );
          // Emit status update về sender
          const senderSocketId = this.connectedUsers.get(message.senderId);
          if (senderSocketId && deliveredMessage) {
            this.server.to(senderSocketId).emit('messageStatusUpdate', {
              messageId: savedMessage._id.toString(),
              status: 'delivered',
              deliveredAt: deliveredMessage.deliveredAt,
            });
          }
        } catch (error) {
          console.error('Error marking message as delivered:', error);
        }
      }

      // Emit back to sender for confirmation
      client.emit('messageSent', savedMessage);
    } catch (error) {
      console.error('Error handling message:', error);
      client.emit('messageError', { error: 'Failed to send message' });
    }
  }

  @SubscribeMessage('sendGroupMessage')
  async handleGroupMessage(
    @MessageBody()
    message: { senderId: string; groupId: string; content: string; files?: any[] },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      // Kiểm tra thành viên trước khi gửi tin nhắn
      await this.messageService.verifyGroupMember(message.groupId, message.senderId);

      // Save group message to database (files đã được upload qua API trước đó)
      const savedMessage = await this.messageService.createMessage(
        message.senderId,
        null, // no receiverId for group messages
        message.content || '',
        message.groupId,
        message.files || [],
      );

      // Get group members from service
      const groupMembers = savedMessage.groupId ? await this.getGroupMembers(message.groupId) : [];
      
      // Emit to all group members who are online
      groupMembers.forEach((memberId: string) => {
        const memberSocketId = this.connectedUsers.get(memberId);
        if (memberSocketId && memberId !== message.senderId) {
          this.server.to(memberSocketId).emit('receiveMessage', savedMessage);
          
          // Tự động đánh dấu delivered cho các thành viên online
          try {
            this.messageService.markAsDelivered(
              savedMessage._id.toString(),
              memberId,
            ).then((deliveredMessage) => {
              // Emit status update về sender (nếu cần)
              const senderSocketId = this.connectedUsers.get(message.senderId);
              if (senderSocketId && deliveredMessage) {
                this.server.to(senderSocketId).emit('messageStatusUpdate', {
                  messageId: savedMessage._id.toString(),
                  status: 'delivered',
                  deliveredAt: deliveredMessage.deliveredAt,
                  receiverId: memberId,
                });
              }
            }).catch((error) => {
              console.error('Error marking group message as delivered:', error);
            });
          } catch (error) {
            console.error('Error marking group message as delivered:', error);
          }
        }
      });

      // Emit back to sender for confirmation
      client.emit('messageSent', savedMessage);
    } catch (error: any) {
      console.error('Error handling group message:', error);
      const errorMessage = error.message || 'Failed to send group message';
      client.emit('messageError', { error: errorMessage });
    }
  }

  private async getGroupMembers(groupId: string): Promise<string[]> {
    try {
      const group = await this.groupService.getGroupById(groupId);
      return group ? group.members.map((m: any) => m.toString()) : [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  }

  /**
   * Emit group message to all members (called from MessageController after API save)
   */
  async emitGroupMessage(savedMessage: any): Promise<void> {
    try {
      if (!savedMessage || !savedMessage.groupId) {
        return;
      }

      // Convert message to plain object if it's a Mongoose document
      const messageObj = savedMessage.toObject ? savedMessage.toObject() : savedMessage;
      const groupId = messageObj.groupId?.toString() || messageObj.groupId;
      const senderId = messageObj.senderId?.toString() || messageObj.senderId;
      const messageId = messageObj._id?.toString() || messageObj._id;
      
      // Get group members
      const groupMembers = await this.getGroupMembers(groupId);
      
      // Emit to all group members who are online
      let emittedCount = 0;
      groupMembers.forEach((memberId: string) => {
        const memberSocketId = this.connectedUsers.get(memberId);
        if (memberSocketId) {
          const messageData = {
            ...messageObj,
            _id: messageId,
            groupId: groupId,
            senderId: senderId,
          };
          
          // Emit to all members including sender (for real-time update)
          this.server.to(memberSocketId).emit('receiveMessage', messageData);
          emittedCount++;
          
          // Auto mark as delivered for online members (except sender)
          if (memberId !== senderId) {
            this.messageService.markAsDelivered(messageId, memberId)
              .then((deliveredMessage) => {
                // Emit status update to sender
                const senderSocketId = this.connectedUsers.get(senderId);
                if (senderSocketId && deliveredMessage) {
                  this.server.to(senderSocketId).emit('messageStatusUpdate', {
                    messageId: messageId,
                    status: 'delivered',
                    deliveredAt: deliveredMessage.deliveredAt,
                    receiverId: memberId,
                  });
                }
              })
              .catch((error) => {
                console.error('Error marking group message as delivered:', error);
              });
          }
        }
      });
    } catch (error) {
      console.error('Error emitting group message:', error);
    }
  }

  /**
   * Emit direct (1-1) message to sender and receiver (called from MessageController)
   */
  async emitDirectMessage(savedMessage: any): Promise<void> {
    try {
      if (!savedMessage) {
        return;
      }

      const messageObj = savedMessage?.toObject
        ? savedMessage.toObject()
        : savedMessage;

      const messageId = messageObj._id?.toString() || messageObj._id;
      const senderId = messageObj.senderId?.toString() || messageObj.senderId;
      const receiverId =
        messageObj.receiverId?.toString() || messageObj.receiverId;

      const normalizedFiles = Array.isArray(messageObj.files)
        ? messageObj.files.map((file: any) => ({
            url: file.url,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            originalName: file.originalName,
          }))
        : [];

      const normalizedMessage = {
        ...messageObj,
        _id: messageId,
        senderId,
        receiverId,
        files: normalizedFiles,
      };

      if (senderId) {
        const senderSocketId = this.connectedUsers.get(senderId);
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('receiveMessage', normalizedMessage);
        }
      }

      if (receiverId) {
        const receiverSocketId = this.connectedUsers.get(receiverId);
        if (receiverSocketId) {
          this.server
            .to(receiverSocketId)
            .emit('receiveMessage', normalizedMessage);

          if (messageId) {
            try {
              const deliveredMessage = await this.messageService.markAsDelivered(
                messageId,
                receiverId,
              );

              if (deliveredMessage && senderId) {
                const senderSocketId = this.connectedUsers.get(senderId);
                if (senderSocketId) {
                  this.server.to(senderSocketId).emit('messageStatusUpdate', {
                    messageId,
                    status: 'delivered',
                    deliveredAt: deliveredMessage.deliveredAt,
                  });
                }
              }
            } catch (error) {
              console.error('Error marking direct message as delivered:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error emitting direct message:', error);
    }
  }

  /**
   * Emit message update (for edit, delete, etc.)
   */
  async emitMessageUpdate(updatedMessage: any): Promise<void> {
    try {
      if (!updatedMessage) return;

      const messageObj = updatedMessage.toObject ? updatedMessage.toObject() : updatedMessage;
      const receiverId = messageObj.receiverId?.toString();
      const senderId = messageObj.senderId?.toString();

      // Emit to sender and receiver
      if (senderId) {
        const senderSocketId = this.connectedUsers.get(senderId);
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('messageUpdated', messageObj);
        }
      }

      if (receiverId) {
        const receiverSocketId = this.connectedUsers.get(receiverId);
        if (receiverSocketId) {
          this.server.to(receiverSocketId).emit('messageUpdated', messageObj);
        }
      }
    } catch (error) {
      console.error('Error emitting message update:', error);
    }
  }

  /**
   * Emit group message update (for edit, delete, etc.)
   */
  async emitGroupMessageUpdate(updatedMessage: any): Promise<void> {
    try {
      if (!updatedMessage || !updatedMessage.groupId) return;

      const messageObj = updatedMessage.toObject ? updatedMessage.toObject() : updatedMessage;
      const groupId = messageObj.groupId?.toString();
      const groupMembers = await this.getGroupMembers(groupId);

      // Emit to all group members
      groupMembers.forEach((memberId: string) => {
        const memberSocketId = this.connectedUsers.get(memberId);
        if (memberSocketId) {
          this.server.to(memberSocketId).emit('messageUpdated', messageObj);
        }
      });
    } catch (error) {
      console.error('Error emitting group message update:', error);
    }
  }

  @SubscribeMessage('sendNotification')
  async handleNotification(
    @MessageBody()
    notificationData: {
      actor: string;
      userId: string;
      title: string;
      content: string;
      data: any;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      // Save notification to database
      const savedNotification = await this.notificationsService.create({
        actor: notificationData.actor,
        userId: notificationData.userId,
        title: notificationData.title,
        content: notificationData.content,
        data: notificationData.data,
      });

      // Get receiver's socket ID
      const receiverSocketId = this.connectedUsers.get(notificationData.userId);

      if (receiverSocketId) {
        // Emit to specific user's room
        this.server.to(receiverSocketId).emit('receiveNotification', savedNotification);
      }

      // Emit back to sender for confirmation
      client.emit('notificationSent', { success: true });
    } catch (error) {
      console.error('Error handling notification:', error);
      client.emit('notificationError', { error: 'Failed to send notification' });
    }
  }

  /**
   * Send notification (public method để các service khác có thể gọi)
   */
  async sendNotification(notificationData: {
    actor: string;
    userId: string;
    title: string;
    content: string;
    data: any;
  }): Promise<void> {
    try {
      // Save notification to database
      const savedNotification = await this.notificationsService.create({
        actor: notificationData.actor,
        userId: notificationData.userId,
        title: notificationData.title,
        content: notificationData.content,
        data: notificationData.data,
      });

      // Get receiver's socket ID
      const receiverSocketId = this.connectedUsers.get(notificationData.userId);

      if (receiverSocketId) {
        // Emit to specific user's room
        this.server.to(receiverSocketId).emit('receiveNotification', savedNotification);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Emit notification (không save, chỉ emit - gọi khi notification đã được save từ controller)
   */
  async emitNotification(savedNotification: any): Promise<void> {
    try {
      if (!savedNotification) return;

      const notificationObj = savedNotification.toObject ? savedNotification.toObject() : savedNotification;
      const userId = notificationObj.userId?.toString() || notificationObj.userId;

      const receiverSocketId = this.connectedUsers.get(userId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('receiveNotification', notificationObj);
      }
    } catch (error) {
      console.error('Error emitting notification:', error);
    }
  }

  @SubscribeMessage('markMessageAsRead')
  async handleMarkMessageAsRead(
    @MessageBody() data: { messageId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const updatedMessage = await this.messageService.markAsRead(
        data.messageId,
        data.userId,
      );

      if (updatedMessage) {
        // Emit status update về sender
        const senderSocketId = this.connectedUsers.get(
          updatedMessage.senderId.toString(),
        );
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('messageStatusUpdate', {
            messageId: data.messageId,
            status: 'read',
            readAt: updatedMessage.readAt,
          });
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      client.emit('messageError', { error: 'Failed to mark message as read' });
    }
  }

  @SubscribeMessage('markConversationAsRead')
  async handleMarkConversationAsRead(
    @MessageBody() data: {
      senderId: string;
      receiverId: string;
      readerId: string;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const count = await this.messageService.markConversationAsRead(
        data.senderId,
        data.receiverId,
        data.readerId,
      );

      if (count > 0) {
        // Emit status update về sender
        const senderSocketId = this.connectedUsers.get(data.senderId);
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('conversationRead', {
            receiverId: data.receiverId,
            count,
          });
        }
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      client.emit('messageError', {
        error: 'Failed to mark conversation as read',
      });
    }
  }

  @SubscribeMessage('markGroupMessagesAsRead')
  async handleMarkGroupMessagesAsRead(
    @MessageBody() data: { groupId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const count = await this.messageService.markGroupMessagesAsRead(
        data.groupId,
        data.userId,
      );

      if (count > 0) {
        // Emit event để các thành viên khác biết
        const groupMembers = await this.getGroupMembers(data.groupId);
        groupMembers.forEach((memberId: string) => {
          const memberSocketId = this.connectedUsers.get(memberId);
          if (memberSocketId) {
            this.server.to(memberSocketId).emit('groupMessagesRead', {
              groupId: data.groupId,
              readerId: data.userId,
              count,
            });
          }
        });
      }
    } catch (error) {
      console.error('Error marking group messages as read:', error);
      client.emit('messageError', {
        error: 'Failed to mark group messages as read',
      });
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    // Ensure userId is string
    const userIdStr = userId.toString();
    
    // Check if user is already connected with different socket
    const existingSocketId = this.connectedUsers.get(userIdStr);
    if (existingSocketId && existingSocketId !== client.id) {
      // Remove old socket
      this.userSockets.delete(existingSocketId);
    }
    
    // Store user's socket ID
    this.connectedUsers.set(userIdStr, client.id);
    this.userSockets.set(client.id, userIdStr);

    // Join user's personal room
    client.join(userIdStr);

    // Broadcast online status to all connected clients
    this.broadcastOnlineUsers();
  }

  handleConnection(client: Socket) {
    // Get userId from query string if available
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const userIdStr = userId.toString().trim();
      
      // Check if user already connected with different socket
      const existingSocketId = this.connectedUsers.get(userIdStr);
      if (existingSocketId && existingSocketId !== client.id) {
        // Remove old socket mapping
        this.userSockets.delete(existingSocketId);
      }
      
      // Store user's socket ID immediately
      this.connectedUsers.set(userIdStr, client.id);
      this.userSockets.set(client.id, userIdStr);
      
      // Join user's personal room
      client.join(userIdStr);
      
      // Broadcast online status
      this.broadcastOnlineUsers();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove user from connected users
    const userId = this.userSockets.get(client.id);
    if (userId) {
      this.connectedUsers.delete(userId);
      this.userSockets.delete(client.id);
      this.broadcastOnlineUsers();
    }
  }

  private broadcastOnlineUsers(): void {
    const onlineUserIds = Array.from(this.connectedUsers.keys());
    this.server.emit('onlineUsers', onlineUserIds);
  }

  /**
   * Typing indicator - Chat cá nhân
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { senderId: string; receiverId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('userTyping', {
        userId: data.senderId,
        isTyping: true,
      });
    }
  }

  /**
   * Stop typing indicator - Chat cá nhân
   */
  @SubscribeMessage('stopTyping')
  async handleStopTyping(
    @MessageBody() data: { senderId: string; receiverId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('userTyping', {
        userId: data.senderId,
        isTyping: false,
      });
    }
  }

  /**
   * Typing indicator - Group chat
   */
  @SubscribeMessage('groupTyping')
  async handleGroupTyping(
    @MessageBody() data: { senderId: string; groupId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      // Lấy danh sách thành viên nhóm
      const groupMembers = await this.getGroupMembers(data.groupId);
      
      // Emit đến tất cả thành viên trong nhóm (trừ người đang gõ)
      groupMembers.forEach((memberId: string) => {
        if (memberId.toString() !== data.senderId) {
          const memberSocketId = this.connectedUsers.get(memberId.toString());
          if (memberSocketId) {
            this.server.to(memberSocketId).emit('groupTyping', {
              groupId: data.groupId,
              userId: data.senderId,
              isTyping: true,
            });
          }
        }
      });
    } catch (error) {
      console.error('Error handling group typing:', error);
    }
  }

  /**
   * Stop typing indicator - Group chat
   */
  @SubscribeMessage('groupStopTyping')
  async handleGroupStopTyping(
    @MessageBody() data: { senderId: string; groupId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      // Lấy danh sách thành viên nhóm
      const groupMembers = await this.getGroupMembers(data.groupId);
      
      // Emit đến tất cả thành viên trong nhóm (trừ người đang gõ)
      groupMembers.forEach((memberId: string) => {
        if (memberId.toString() !== data.senderId) {
          const memberSocketId = this.connectedUsers.get(memberId.toString());
          if (memberSocketId) {
            this.server.to(memberSocketId).emit('groupTyping', {
              groupId: data.groupId,
              userId: data.senderId,
              isTyping: false,
            });
          }
        }
      });
    } catch (error) {
      console.error('Error handling group stop typing:', error);
    }
  }

  @SubscribeMessage('call:offer')
  handleCallOffer(
    @MessageBody() data: { targetUserId: string; offer: any; caller: any; callType?: 'video' | 'voice' },
    @ConnectedSocket() client: Socket,
  ): void {
    const { targetUserId, offer, caller, callType = 'video' } = data;
    
    // Normalize targetUserId to string for comparison
    const targetUserIdStr = targetUserId.toString();
    
    // Try to find receiver - check exact match first
    let receiverSocketId = this.connectedUsers.get(targetUserIdStr);
    
    // If not found, try all variations (case-insensitive, etc)
    if (!receiverSocketId) {
      for (const [userId, socketId] of this.connectedUsers.entries()) {
        const userIdStr = userId.toString();
        if (userIdStr === targetUserIdStr || 
            userIdStr.toLowerCase() === targetUserIdStr.toLowerCase() ||
            userId === targetUserId) {
          receiverSocketId = socketId;
          break;
        }
      }
    }
    
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('call:offer', { offer, caller, callType });
    } else {
      client.emit('call:error', { message: `User ${targetUserId} not online` });
    }
  }

  @SubscribeMessage('call:answer')
  handleCallAnswer(
    @MessageBody() data: { targetUserId: string; answer: any },
    @ConnectedSocket() client: Socket,
  ): void {
    const { targetUserId, answer } = data;
    const receiverSocketId = this.connectedUsers.get(targetUserId);
    
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('call:answer', { answer });
    }
  }

  @SubscribeMessage('call:ice-candidate')
  handleIceCandidate(
    @MessageBody() data: { targetUserId: string; candidate: any },
    @ConnectedSocket() client: Socket,
  ): void {
    const { targetUserId, candidate } = data;
    const receiverSocketId = this.connectedUsers.get(targetUserId);
    
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('call:ice-candidate', { candidate });
    }
  }

  @SubscribeMessage('call:end')
  handleCallEnd(
    @MessageBody() data: { targetUserId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { targetUserId } = data;
    const receiverSocketId = this.connectedUsers.get(targetUserId);
    
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('call:end');
    }
  }
}
