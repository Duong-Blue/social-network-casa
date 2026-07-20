import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MessageService } from './message.service';
import { MinioService } from '../storage/minio.service';
import { SocketGateway } from '../socket/socket.gateway';

@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly minioService: MinioService,
    @Inject(forwardRef(() => SocketGateway))
    private readonly socketGateway: SocketGateway,
  ) {}

  /**
   * Gửi tin nhắn cá nhân 1-1
   */
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10))
  async createMessage(
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const parseBody = (rawBody: any) => {
      if (!rawBody) {
        return {};
      }
      if (typeof rawBody === 'string') {
        try {
          return JSON.parse(rawBody);
        } catch (error) {
          return {};
        }
      }
      return rawBody;
    };

    const normalizedBody = parseBody(body);

    const getFieldValue = (source: any, key: string): string | undefined => {
      const value = source?.[key];
      if (Array.isArray(value)) {
        return value[0];
      }
      return value;
    };

    const senderId = getFieldValue(normalizedBody, 'senderId');
    const receiverId = getFieldValue(normalizedBody, 'receiverId');
    const content = getFieldValue(normalizedBody, 'content') || '';

    if (!senderId || !receiverId) {
      throw new BadRequestException('senderId và receiverId là bắt buộc');
    }

    let messageFiles = [];
    if (files && files.length > 0) {
      const expirySeconds = parseInt(process.env.TIME_EXPIRE || '86400');
      messageFiles = await Promise.all(
        files.map(async (file) => {
          const uploaded = await this.minioService.uploadFile(
            file,
            'direct-messages',
          );
          const fileUrl = await this.minioService.getPresignedUrl(
            uploaded.filename,
            expirySeconds,
          );

          return {
            url: fileUrl,
            filename: uploaded.filename,
            mimetype: file.mimetype,
            size: file.size,
            originalName: file.originalname,
          };
        }),
      );
    }

    const savedMessage = await this.messageService.createMessage(
      senderId,
      receiverId,
      content,
      undefined,
      messageFiles,
    );

    if (this.socketGateway) {
      await this.socketGateway.emitDirectMessage(savedMessage);
    }

    return savedMessage;
  }

  /**
   * Upload file phục vụ cho tin nhắn (ảnh, video, tài liệu...)
   * POST /messages/upload
   */
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(@UploadedFiles() files?: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file nào được tải lên');
    }

    const expirySeconds = parseInt(process.env.TIME_EXPIRE || '86400');
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const uploaded = await this.minioService.uploadFile(
          file,
          'direct-messages',
        );
        const fileUrl = await this.minioService.getPresignedUrl(
          uploaded.filename,
          expirySeconds,
        );

        return {
          url: fileUrl,
          filename: uploaded.filename,
          mimetype: file.mimetype,
          size: file.size,
          originalName: file.originalname,
        };
      }),
    );

    return {
      success: true,
      data: uploadedFiles,
    };
  }

  /**
   * ── Lấy tin nhắn theo conversationId (route FE đang gọi) ──
   * GET /messages/conversation/:conversationId
   */
  @Get('conversation/:conversationId')
  async getMessagesByConversationId(
    @Param('conversationId') conversationId: string,
  ) {
    return this.messageService.getMessagesByConversationId(conversationId);
  }

  /**
   * Lấy toàn bộ tin nhắn giữa hai người (legacy route)
   * GET /messages/between/:senderId/:receiverId
   */
  @Get('between/:senderId/:receiverId')
  async getConversation(
    @Param('senderId') senderId: string,
    @Param('receiverId') receiverId: string,
  ) {
    return this.messageService.getConversation(senderId, receiverId);
  }

  /**
   * Lấy danh sách các cuộc hội thoại (chỉ áp dụng cho chat cá nhân)
   */
  @Get('conversations/:userId')
  async getConversations(@Param('userId') userId: string) {
    const conversations = await this.messageService.getConversations(userId);

    return conversations.map((conv) => ({
      userId: conv.userId,
      lastMessage: {
        content: conv.lastMessage.content,
        createdAt: conv.lastMessage.createdAt,
        senderId: conv.lastMessage.senderId,
        receiverId: conv.lastMessage.receiverId,
      },
    }));
  }


  // ======================================================
  // 🚀 NHỮNG PHẦN DƯỚI LÀ MỚI — HỖ TRỢ NHẮN TIN NHÓM
  // ======================================================

  /**
   * Test endpoint để kiểm tra route có hoạt động không
   */
  @Get('group/test')
  testGroupEndpoint() {
    return { message: 'Group endpoint is working', timestamp: new Date() };
  }

  /**
   * Gửi tin nhắn trong nhóm (có thể kèm file)
   * Kiểm tra senderId có phải thành viên không
   */
  @Post('group')
  @UseInterceptors(FilesInterceptor('files', 10)) // Cho phép tối đa 10 files
  async createGroupMessage(
    @Body() body: any, // any để xử lý multipart/form-data
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Kiểm tra replyTo nếu có
    let replyTo: string | undefined;
    let mentions: string[] | undefined;
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        replyTo = parsed.replyTo;
        mentions = parsed.mentions ? (Array.isArray(parsed.mentions) ? parsed.mentions : [parsed.mentions]) : undefined;
      } catch (e) {
        replyTo = (body as any).replyTo;
        mentions = (body as any).mentions;
      }
    } else {
      replyTo = body?.replyTo || body?.replyTo?.[0];
      if (body?.mentions) {
        mentions = Array.isArray(body.mentions) ? body.mentions : (body.mentions?.[0] ? [body.mentions[0]] : []);
      }
    }
    
    // Với multipart/form-data, body có thể là object hoặc string
    let senderId: string;
    let groupId: string;
    let content: string;
    
    if (typeof body === 'string') {
      // Nếu body là string, parse nó (có thể xảy ra với một số config)
      try {
        const parsed = JSON.parse(body);
        senderId = parsed.senderId;
        groupId = parsed.groupId;
        content = parsed.content || '';
      } catch (e) {
        // Nếu không parse được, thử lấy từ body trực tiếp
        senderId = (body as any).senderId;
        groupId = (body as any).groupId;
        content = (body as any).content || '';
      }
    } else {
      senderId = body?.senderId || body?.senderId?.[0];
      groupId = body?.groupId || body?.groupId?.[0];
      content = body?.content || body?.content?.[0] || '';
    }
    
    
    if (!senderId || !groupId) {
      console.error('Missing required fields:', { senderId, groupId, body });
      throw new BadRequestException('senderId và groupId là bắt buộc');
    }

    // Kiểm tra thành viên trước khi gửi
    await this.messageService.verifyGroupMember(groupId, senderId);

    // Upload files nếu có
    let messageFiles = [];
    if (files && files.length > 0) {
      const expirySeconds = parseInt(
        process.env.TIME_EXPIRE || '86400'
      );
      
      messageFiles = await Promise.all(
        files.map(async (file) => {
          const uploaded = await this.minioService.uploadFile(file, 'group-messages');
          // Get presigned URL for file access
          const fileUrl = await this.minioService.getPresignedUrl(
            uploaded.filename,
            expirySeconds
          );
          
          return {
            url: fileUrl,
            filename: uploaded.filename,
            mimetype: file.mimetype,
            size: file.size,
            originalName: file.originalname,
          };
        }),
      );
    }

    const savedMessage = await this.messageService.createMessage(
      senderId,
      null, // không có receiverId vì đây là tin nhắn nhóm
      content,
      groupId,
      messageFiles,
      replyTo,
      mentions,
    );

    // Emit message qua socket để real-time
    if (this.socketGateway) {
      this.socketGateway.emitGroupMessage(savedMessage);
      
      // Emit notification cho các user được mention
      if (mentions && mentions.length > 0) {
        mentions.forEach((mentionedUserId: string) => {
          if (mentionedUserId !== senderId) {
            this.socketGateway.sendNotification({
              actor: senderId,
              userId: mentionedUserId,
              title: 'Bạn được mention trong nhóm',
              content: `${content.substring(0, 50)}...`,
              data: { groupId, messageId: savedMessage._id.toString() },
            });
          }
        });
      }
    }

    return savedMessage;
  }

  /**
   * Lấy danh sách tin nhắn trong một nhóm
   * Kiểm tra userId có phải thành viên không
   */
  @Get('group/:groupId/:userId')
  async getGroupMessages(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.messageService.getGroupMessages(groupId, userId);
  }

  // ======================================================
  // 📍 TRẠNG THÁI TIN NHẮN (SENT, DELIVERED, READ)
  // ======================================================

  /**
   * Đánh dấu tin nhắn đã được nhận (delivered)
   * POST /messages/:messageId/delivered
   * Body: { receiverId: string }
   */
  @Post(':messageId/delivered')
  async markAsDelivered(
    @Param('messageId') messageId: string,
    @Body() body: { receiverId: string },
  ) {
    return this.messageService.markAsDelivered(messageId, body.receiverId);
  }

  /**
   * Đánh dấu tin nhắn đã được xem (read)
   * POST /messages/:messageId/read
   * Body: { userId: string }
   */
  @Post(':messageId/read')
  async markAsRead(
    @Param('messageId') messageId: string,
    @Body() body: { userId: string },
  ) {
    return this.messageService.markAsRead(messageId, body.userId);
  }

  /**
   * Đánh dấu tất cả tin nhắn trong cuộc trò chuyện đã được xem
   * POST /messages/conversation/read
   * Body: { senderId: string; receiverId: string; readerId: string }
   */
  @Post('conversation/read')
  async markConversationAsRead(
    @Body() body: { senderId: string; receiverId: string; readerId: string },
  ) {
    const count = await this.messageService.markConversationAsRead(
      body.senderId,
      body.receiverId,
      body.readerId,
    );
    return { count, message: `Đã đánh dấu ${count} tin nhắn là đã đọc` };
  }

  /**
   * Đánh dấu tất cả tin nhắn trong nhóm đã được xem
   * POST /messages/group/:groupId/read
   * Body: { userId: string }
   */
  @Post('group/:groupId/read')
  async markGroupMessagesAsRead(
    @Param('groupId') groupId: string,
    @Body() body: { userId: string },
  ) {
    const count = await this.messageService.markGroupMessagesAsRead(
      groupId,
      body.userId,
    );
    return { count, message: `Đã đánh dấu ${count} tin nhắn là đã đọc` };
  }

  // ======================================================
  // 😀 REACTIONS, EDIT, DELETE MESSAGES
  // ======================================================

  /**
   * Thêm hoặc xóa reaction cho tin nhắn
   * POST /messages/:messageId/reaction
   * Body: { userId: string; emoji: string }
   */
  @Post(':messageId/reaction')
  async toggleReaction(
    @Param('messageId') messageId: string,
    @Body() body: { userId: string; emoji: string },
  ) {
    const updatedMessage = await this.messageService.toggleReaction(
      messageId,
      body.userId,
      body.emoji,
    );

    // Emit event qua socket để cập nhật reaction real-time cho các client khác
    if (this.socketGateway) {
      if (updatedMessage.groupId) {
        this.socketGateway.emitGroupMessageUpdate(updatedMessage);
      } else {
        this.socketGateway.emitMessageUpdate(updatedMessage);
      }
    }

    return updatedMessage;
  }

  /**
   * Chỉnh sửa tin nhắn
   * PUT /messages/:messageId
   * Body: { userId: string; newContent: string }
   */
  @Post(':messageId/edit')
  async editMessage(
    @Param('messageId') messageId: string,
    @Body() body: { userId: string; newContent: string },
  ) {
    return this.messageService.editMessage(messageId, body.userId, body.newContent);
  }

  /**
   * Xóa tin nhắn
   * POST /messages/:messageId/delete
   * Body: { userId: string, deleteType?: 'deleteForMe' | 'deleteForEveryone' }
   */
  @Post(':messageId/delete')
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Body() body: { userId: string; deleteType?: 'deleteForMe' | 'deleteForEveryone' },
  ) {
    const deleteType = body.deleteType || 'deleteForMe';
    const deletedMessage = await this.messageService.deleteMessage(
      messageId,
      body.userId,
      deleteType,
    );

    // Emit event để các client khác cập nhật nếu là deleteForEveryone
    if (deleteType === 'deleteForEveryone' && this.socketGateway) {
      if (deletedMessage.groupId) {
        this.socketGateway.emitGroupMessageUpdate(deletedMessage);
      } else {
        this.socketGateway.emitMessageUpdate(deletedMessage);
      }
    }

    return deletedMessage;
  }

  /**
   * Lấy tin nhắn theo ID
   * GET /messages/:messageId
   */
  @Get(':messageId')
  async getMessageById(@Param('messageId') messageId: string) {
    return this.messageService.getMessageById(messageId);
  }

  // ======================================================
  // 🔍 SEARCH, PIN, FORWARD, READ RECEIPTS
  // ======================================================

  /**
   * Tìm kiếm tin nhắn
   * GET /messages/search?query=...&groupId=... hoặc &userId=...&otherUserId=...
   */
  @Get('search')
  async searchMessages(
    @Query('query') query: string,
    @Query('groupId') groupId?: string,
    @Query('userId') userId?: string,
    @Query('otherUserId') otherUserId?: string,
  ) {
    return this.messageService.searchMessages(query, groupId, userId, otherUserId);
  }

  /**
   * Ghim tin nhắn trong nhóm
   * POST /messages/:messageId/pin
   * Body: { groupId: string; userId: string }
   */
  @Post(':messageId/pin')
  async pinMessage(
    @Param('messageId') messageId: string,
    @Body() body: { groupId: string; userId: string },
  ) {
    return this.messageService.pinMessage(messageId, body.groupId, body.userId);
  }

  /**
   * Bỏ ghim tin nhắn
   * POST /messages/:messageId/unpin
   * Body: { groupId: string; userId: string }
   */
  @Post(':messageId/unpin')
  async unpinMessage(
    @Param('messageId') messageId: string,
    @Body() body: { groupId: string; userId: string },
  ) {
    return this.messageService.unpinMessage(messageId, body.groupId, body.userId);
  }

  /**
   * Chuyển tiếp tin nhắn
   * POST /messages/:messageId/forward
   * Body: { senderId: string; targetGroupId?: string; targetUserId?: string }
   */
  @Post(':messageId/forward')
  async forwardMessage(
    @Param('messageId') messageId: string,
    @Body() body: { senderId: string; targetGroupId?: string; targetUserId?: string },
  ) {
    return this.messageService.forwardMessage(
      messageId,
      body.senderId,
      body.targetGroupId,
      body.targetUserId,
    );
  }

  /**
   * Đánh dấu tin nhắn đã đọc (read receipt chi tiết)
   * POST /messages/:messageId/mark-read
   * Body: { userId: string }
   */
  @Post(':messageId/mark-read')
  async markMessageAsReadBy(
    @Param('messageId') messageId: string,
    @Body() body: { userId: string },
  ) {
    return this.messageService.markMessageAsReadBy(messageId, body.userId);
  }

  /**
   * Lấy read receipts của một tin nhắn
   * GET /messages/:messageId/read-receipts
   */
  @Get(':messageId/read-receipts')
  async getReadReceipts(@Param('messageId') messageId: string) {
    return this.messageService.getReadReceipts(messageId);
  }
}
