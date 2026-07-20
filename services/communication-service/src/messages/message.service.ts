import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageFile } from './message.entity';
import { ConversationService } from '../conversations/conversation.service';
import { GroupService } from '../groups/group.service';
import { MinioService } from '../storage/minio.service';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private conversationService: ConversationService,
    private groupService: GroupService,
    private minioService: MinioService,
  ) {}

  /**
   * Gửi tin nhắn — có thể là 1-1 hoặc nhóm
   */
  async createMessage(
    senderId: string,
    receiverId: string | null,
    content: string,
    groupId?: string,
    files?: MessageFile[],
    replyTo?: string,
    mentions?: string[],
    conversationId?: string,
  ): Promise<any> {
    // Kiểm tra đầu vào
    if (!receiverId && !groupId) {
      throw new Error('Phải có receiverId (chat cá nhân) hoặc groupId (chat nhóm)');
    }

    // Xác định loại tin nhắn
    let messageType = 'text';
    if (files && files.length > 0) {
      messageType = content.trim() ? 'mixed' : 'file';
    }

    // Extract mentions from content (format: @userId or @username)
    let extractedMentions: string[] = mentions || [];
    
    // Nếu không có mentions được truyền vào, tự động extract từ content
    if (!mentions && content) {
      // Pattern: @userId hoặc @username (chỉ trong group chat)
      const mentionRegex = /@(\w+)/g;
      const matches = content.match(mentionRegex);
      if (matches && groupId) {
        // Lấy user IDs từ usernames (cần query database)
        // Tạm thời dùng mentions được truyền vào từ frontend
        // Frontend đã extract và gửi lên, nên không cần extract lại ở đây
      }
    }

    // Tạo message
    const message = new this.messageModel({
      senderId,
      receiverId: receiverId || null,
      groupId: groupId || null,
      conversationId: conversationId || null,
      content: content || '',
      files: files || [],
      messageType,
      replyTo: replyTo || null,
      mentions: extractedMentions || [],
      readBy: {},
    });

    const savedMessage = await message.save();
    const formattedMessage = this.formatMessage(savedMessage);
    this.logger.log(
      `Message saved: from ${senderId} to ${receiverId || 'GROUP:' + groupId} - Type: ${messageType}`,
    );

    // Nếu là nhóm thì không cần tạo conversation
    if (groupId) {
      this.logger.log(`→ Tin nhắn nhóm: ${groupId}`);
      return formattedMessage;
    }

    // ── Tạo hoặc cập nhật conversation cho chat 1-1 ──
    const conversation = await this.conversationService.createOrGetConversation(senderId, receiverId!);
    await this.conversationService.updateLastMessage(
      conversation._id.toString(),
      {
        _id: savedMessage._id.toString(),
        content: savedMessage.content || '',
        senderId: senderId,
        createdAt: savedMessage.createdAt?.toISOString() || new Date().toISOString(),
        status: savedMessage.status || 'sent',
      }
    );

    return {
      ...formattedMessage,
      conversationId: conversationId || conversation._id.toString(),
    };
  }

  /**
   * ── Lấy tin nhắn theo conversationId (route mới FE đang gọi) ──
   * Fallback sang senderId+receiverId nếu message cũ chưa có conversationId
   */
  async getMessagesByConversationId(conversationId: string): Promise<any[]> {
    // Bước 1: Lấy conversation để biết participants
    const conversation = await this.conversationService.findById(conversationId);

    let messages: any[] = [];

    if (conversation) {
      const participants: string[] = (conversation.participants || []).map((p: any) => p?.toString());

      if (conversation.isGroup) {
        // Group chat: query theo groupId (nếu có)
        messages = await this.messageModel
          .find({ groupId: (conversation as any).groupId || conversationId })
          .sort({ createdAt: 1 })
          .exec();
      } else if (participants.length === 2) {
        const [user1, user2] = participants;
        // Query cả 2 kiểu: conversationId mới + senderId/receiverId cũ
        messages = await this.messageModel
          .find({
            $or: [
              { conversationId },
              { senderId: user1, receiverId: user2 },
              { senderId: user2, receiverId: user1 },
            ]
          })
          .sort({ createdAt: 1 })
          .exec();
      }
    } else {
      // Không tìm thấy conversation: chỉ query theo conversationId
      messages = await this.messageModel
        .find({ conversationId })
        .sort({ createdAt: 1 })
        .exec();
    }

    // Filter messages đã bị xóa
    return messages
      .filter((message) => {
        if (message.deleteType === 'deleteForEveryone') return true;
        if (message.deleteType === 'deleteForMe') return true; // FE tự filter
        return true;
      })
      .map((m) => this.formatMessage(m));
  }

  /**
   * Lấy tin nhắn giữa 2 người
   * Filter các tin nhắn đã bị xóa cho user hiện tại
   */
  async getConversation(userId: string, otherUserId: string): Promise<any[]> {
    const messages = await this.messageModel
      .find({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();

    // Filter messages đã bị xóa cho user hiện tại
    const filteredMessages = messages.filter((message) => {
      // Nếu là deleteForEveryone, hiển thị nhưng với nội dung "[Tin nhắn đã bị xóa]"
      if (message.deleteType === 'deleteForEveryone') {
        return true; // Vẫn hiển thị nhưng đã được đánh dấu isDeleted
      }

      // Nếu là deleteForMe, kiểm tra xem user hiện tại có trong deletedForUsers không
      if (message.deleteType === 'deleteForMe' && message.deletedForUsers) {
        return !message.deletedForUsers.includes(userId);
      }

      // Nếu không phải delete, hiển thị bình thường
      return true;
    });

    return filteredMessages.map((message) => this.formatMessage(message));
  }


  /**
   * Kiểm tra user có phải thành viên của nhóm không
   */
  async verifyGroupMember(groupId: string, userId: string): Promise<void> {
    const group = await this.groupService.getGroupById(groupId);
    if (!group) {
      throw new NotFoundException('Nhóm không tồn tại');
    }

    // Kiểm tra userId có trong danh sách thành viên không
    const isMember = group.members.some(
      (memberId: any) => memberId.toString() === userId.toString(),
    );

    if (!isMember) {
      throw new ForbiddenException('Bạn không phải thành viên của nhóm này');
    }
  }

  /**
   * Lấy tin nhắn của nhóm (chỉ thành viên mới được xem)
   */
  async getGroupMessages(groupId: string, userId: string): Promise<any[]> {
    // Kiểm tra thành viên trước khi lấy tin nhắn
    await this.verifyGroupMember(groupId, userId);
    
    const messages = await this.messageModel.find({ groupId }).sort({ createdAt: 1 }).exec();

    // Filter messages đã bị xóa cho user hiện tại
    const filteredMessages = messages.filter((message) => {
      // Nếu là deleteForEveryone, hiển thị nhưng với nội dung "[Tin nhắn đã bị xóa]"
      if (message.deleteType === 'deleteForEveryone') {
        return true; // Vẫn hiển thị nhưng đã được đánh dấu isDeleted
      }

      // Nếu là deleteForMe, kiểm tra xem user hiện tại có trong deletedForUsers không
      if (message.deleteType === 'deleteForMe' && message.deletedForUsers) {
        return !message.deletedForUsers.includes(userId);
      }

      // Nếu không phải delete, hiển thị bình thường
      return true;
    });

    return filteredMessages.map((message) => this.formatMessage(message));
  }

  private formatMessage(message: Message | any): any {
    if (!message) {
      return message;
    }

    const messageObj = message.toObject ? message.toObject() : message;

    const normalizeId = (value: any) =>
      value && typeof value === 'object' && value?.toString ? value.toString() : value;

    return {
      ...messageObj,
      _id: normalizeId(messageObj._id),
      senderId: normalizeId(messageObj.senderId),
      receiverId: normalizeId(messageObj.receiverId),
      groupId: normalizeId(messageObj.groupId),
      files: Array.isArray(messageObj.files)
        ? messageObj.files.map((file: any) => ({
            url: file.url,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            originalName: file.originalName,
          }))
        : [],
      mentions: Array.isArray(messageObj.mentions)
        ? messageObj.mentions.map((mention: any) => normalizeId(mention))
        : [],
    };
  }

  /**
   * Lấy danh sách các cuộc hội thoại (chỉ cho chat cá nhân)
   */
  async getConversations(userId: string): Promise<{ userId: string; lastMessage: Message }[]> {
    const messages = await this.messageModel
      .find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      })
      .sort({ createdAt: -1 })
      .exec();

    const conversationMap = new Map<string, Message>();

    messages.forEach((message) => {
      const otherUserId =
        message.senderId === userId ? message.receiverId : message.senderId;
      if (otherUserId && !conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, message);
      }
    });

    return Array.from(conversationMap.entries()).map(([userId, lastMessage]) => ({
      userId,
      lastMessage,
    }));
  }

  /**
   * Đánh dấu tin nhắn đã được nhận (delivered)
   */
  async markAsDelivered(messageId: string, receiverId: string): Promise<Message | null> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    // Chỉ cập nhật nếu receiverId đúng và chưa được delivered
    if (
      (message.receiverId && message.receiverId.toString() === receiverId) ||
      (message.groupId && message.senderId.toString() !== receiverId)
    ) {
      if (message.status !== 'delivered' && message.status !== 'read') {
        message.status = 'delivered';
        message.deliveredAt = new Date();
        await message.save();
        this.logger.log(`Message ${messageId} marked as delivered by ${receiverId}`);
      }
    }

    return message;
  }

  /**
   * Đánh dấu tin nhắn đã được xem (read)
   */
  async markAsRead(messageId: string, userId: string): Promise<Message | null> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    // Chỉ cập nhật nếu user là người nhận (không phải người gửi)
    const isReceiver = 
      (message.receiverId && message.receiverId.toString() === userId) ||
      (message.groupId && message.senderId.toString() !== userId);

    if (isReceiver && message.status !== 'read') {
      message.status = 'read';
      message.readAt = new Date();
      await message.save();
      this.logger.log(`Message ${messageId} marked as read by ${userId}`);
    }

    return message;
  }

  /**
   * Đánh dấu tất cả tin nhắn chưa đọc trong một cuộc trò chuyện là đã đọc
   */
  async markConversationAsRead(
    senderId: string,
    receiverId: string,
    readerId: string,
  ): Promise<number> {
    // Chỉ đánh dấu tin nhắn từ senderId đến receiverId (readerId phải là receiverId)
    if (readerId !== receiverId) {
      return 0;
    }

    const result = await this.messageModel.updateMany(
      {
        senderId,
        receiverId,
        status: { $ne: 'read' },
      },
      {
        $set: {
          status: 'read',
          readAt: new Date(),
        },
      },
    );

    this.logger.log(
      `Marked ${result.modifiedCount} messages as read in conversation ${senderId} -> ${receiverId}`,
    );
    return result.modifiedCount || 0;
  }

  /**
   * Đánh dấu tất cả tin nhắn chưa đọc trong một nhóm là đã đọc
   */
  async markGroupMessagesAsRead(groupId: string, userId: string): Promise<number> {
    // Kiểm tra thành viên
    await this.verifyGroupMember(groupId, userId);

    // Lấy tất cả tin nhắn chưa đọc trong nhóm
    const unreadMessages = await this.messageModel.find({
      groupId,
      senderId: { $ne: userId },
      status: { $ne: 'read' },
    }).exec();

    // Cập nhật từng tin nhắn để thêm vào readBy
    const updatePromises = unreadMessages.map(async (message) => {
      if (!message.readBy) {
        message.readBy = {};
      }
      message.readBy[userId] = new Date();
      message.status = 'read';
      message.readAt = new Date();
      return message.save();
    });

    await Promise.all(updatePromises);

    this.logger.log(
      `Marked ${unreadMessages.length} group messages as read by ${userId} in group ${groupId}`,
    );
    return unreadMessages.length;
  }

  /**
   * Thêm hoặc xóa reaction cho tin nhắn
   */
  async toggleReaction(messageId: string, userId: string, emoji: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    if (!message.reactions) {
      message.reactions = {};
    }

    const emojiKey = emoji;
    const userIdStr = userId.toString();

    // Nếu emoji chưa có trong reactions, tạo mới
    if (!message.reactions[emojiKey]) {
      message.reactions[emojiKey] = [];
    }

    // Kiểm tra user đã reaction emoji này chưa
    const userIndex = message.reactions[emojiKey].indexOf(userIdStr);
    
    if (userIndex > -1) {
      // Đã có reaction, xóa nó (unreact)
      message.reactions[emojiKey].splice(userIndex, 1);
      // Nếu không còn ai reaction emoji này, xóa key
      if (message.reactions[emojiKey].length === 0) {
        delete message.reactions[emojiKey];
      }
    } else {
      // Chưa có reaction, thêm vào
      message.reactions[emojiKey].push(userIdStr);
    }

    await message.save();
    return message;
  }

  /**
   * Chỉnh sửa tin nhắn
   */
  async editMessage(messageId: string, userId: string, newContent: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    // Chỉ người gửi mới có thể chỉnh sửa
    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa tin nhắn này');
    }

    // Không cho phép chỉnh sửa tin nhắn đã bị xóa
    if (message.isDeleted) {
      throw new ForbiddenException('Không thể chỉnh sửa tin nhắn đã bị xóa');
    }

    message.content = newContent;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    this.logger.log(`Message ${messageId} edited by ${userId}`);
    return message;
  }

  /**
   * Xóa tin nhắn
   * @param messageId ID tin nhắn
   * @param userId ID người dùng xóa
   * @param deleteType 'deleteForMe' hoặc 'deleteForEveryone'
   */
  async deleteMessage(
    messageId: string,
    userId: string,
    deleteType: 'deleteForMe' | 'deleteForEveryone' = 'deleteForMe',
  ): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    const isSender = message.senderId.toString() === userId;

    // Chỉ người gửi mới có thể xóa cho tất cả mọi người
    if (deleteType === 'deleteForEveryone') {
      if (!isSender) {
        throw new ForbiddenException('Chỉ người gửi mới có thể xóa tin nhắn cho tất cả mọi người');
      }

      // Xóa cho tất cả mọi người
      message.isDeleted = true;
      message.deleteType = 'deleteForEveryone';
      message.content = '[Tin nhắn đã bị xóa]';
      message.files = []; // Xóa files
      message.deletedForUsers = []; // Reset vì đã xóa cho tất cả
      
      // Emit event để các client khác cập nhật
      await message.save();
      this.logger.log(`Message ${messageId} deleted for everyone by ${userId}`);
      return message;
    }

    // Delete for me - bất kỳ ai cũng có thể xóa tin nhắn với mình
    if (!message.deletedForUsers) {
      message.deletedForUsers = [];
    }

    // Nếu chưa có trong danh sách, thêm vào
    if (!message.deletedForUsers.includes(userId)) {
      message.deletedForUsers.push(userId);
    }

    // Nếu tất cả người nhận đã xóa, đánh dấu isDeleted = true
    // Nhưng vẫn giữ deleteType = deleteForMe để phân biệt
    if (message.groupId) {
      // Với group, cần kiểm tra số lượng thành viên đã xóa
      const group = await this.groupService.getGroupById(message.groupId.toString());
      if (group && message.deletedForUsers.length >= group.members.length) {
        message.isDeleted = true;
      }
    } else if (message.receiverId) {
      // Với chat 1-1, nếu cả sender và receiver đều xóa thì isDeleted = true
      const allUsersDeleted = message.deletedForUsers.includes(message.senderId.toString()) &&
        message.deletedForUsers.includes(message.receiverId.toString());
      if (allUsersDeleted) {
        message.isDeleted = true;
      }
    }

    message.deleteType = 'deleteForMe';
    await message.save();

    this.logger.log(`Message ${messageId} deleted for user ${userId}`);
    return message;
  }

  /**
   * Lấy tin nhắn theo ID
   */
  async getMessageById(messageId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }
    return message;
  }

  /**
   * Tìm kiếm tin nhắn trong nhóm hoặc cuộc trò chuyện
   */
  async searchMessages(
    query: string,
    groupId?: string,
    userId?: string,
    otherUserId?: string,
  ): Promise<Message[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search
    const searchQuery: any = {
      content: searchRegex,
      // Không filter isDeleted ở đây vì cần xử lý deleteForMe riêng
    };

    if (groupId) {
      searchQuery.groupId = groupId;
    } else if (userId && otherUserId) {
      // Chat cá nhân
      searchQuery.$or = [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ];
    }

    const messages = await this.messageModel.find(searchQuery).sort({ createdAt: -1 }).limit(50).exec();
    
    // Filter messages đã bị xóa (chỉ filter deleteForEveryone, giữ lại deleteForMe để user có thể tìm)
    // Note: Với search, chúng ta có thể muốn hiển thị cả tin nhắn đã xóa để user biết có tồn tại
    return messages.filter((message) => {
      // Chỉ filter deleteForEveryone, vì tin nhắn đó đã bị xóa hoàn toàn
      return message.deleteType !== 'deleteForEveryone' || !message.isDeleted;
    });
  }

  /**
   * Ghim tin nhắn trong nhóm (chỉ admin/creator)
   */
  async pinMessage(messageId: string, groupId: string, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    if (message.groupId?.toString() !== groupId) {
      throw new BadRequestException('Tin nhắn không thuộc nhóm này');
    }

    // Kiểm tra quyền (chỉ admin/creator mới có thể ghim)
    const isAdmin = await this.groupService.isGroupAdmin(groupId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ admin mới có thể ghim tin nhắn');
    }

    // Bỏ ghim tin nhắn cũ (nếu có)
    await this.messageModel.updateMany(
      { groupId, pinned: true },
      { $set: { pinned: false } },
    );

    // Ghim tin nhắn mới
    message.pinned = true;
    await message.save();

    // Cập nhật pinnedMessageId trong group
    await this.groupService.setPinnedMessage(groupId, messageId);

    return message;
  }

  /**
   * Bỏ ghim tin nhắn
   */
  async unpinMessage(messageId: string, groupId: string, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    // Kiểm tra quyền
    const isAdmin = await this.groupService.isGroupAdmin(groupId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ admin mới có thể bỏ ghim tin nhắn');
    }

    message.pinned = false;
    await message.save();

    // Xóa pinnedMessageId trong group
    await this.groupService.setPinnedMessage(groupId, null);

    return message;
  }

  /**
   * Chuyển tiếp tin nhắn
   */
  async forwardMessage(
    messageId: string,
    senderId: string,
    targetGroupId?: string,
    targetUserId?: string,
  ): Promise<Message> {
    const originalMessage = await this.messageModel.findById(messageId);
    if (!originalMessage) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    if (!targetGroupId && !targetUserId) {
      throw new BadRequestException('Phải có targetGroupId hoặc targetUserId');
    }

    // Kiểm tra quyền truy cập tin nhắn gốc
    const canAccess =
      originalMessage.senderId.toString() === senderId ||
      (originalMessage.receiverId && originalMessage.receiverId.toString() === senderId) ||
      (originalMessage.groupId &&
        (await this.groupService.isGroupMember(originalMessage.groupId.toString(), senderId)));

    if (!canAccess) {
      throw new ForbiddenException('Bạn không có quyền chuyển tiếp tin nhắn này');
    }

    // Nếu chuyển đến nhóm, kiểm tra thành viên
    if (targetGroupId) {
      await this.verifyGroupMember(targetGroupId, senderId);
    }

    // Tạo tin nhắn mới với nội dung từ tin nhắn gốc
    const forwardedMessage = new this.messageModel({
      senderId,
      receiverId: targetUserId || null,
      groupId: targetGroupId || null,
      content: originalMessage.content,
      files: originalMessage.files || [],
      messageType: originalMessage.messageType,
      replyTo: null, // Không reply khi forward
    });

    return forwardedMessage.save();
  }

  /**
   * Cập nhật read receipt chi tiết (ai đã đọc tin nhắn)
   */
  async markMessageAsReadBy(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    // Không đánh dấu tin nhắn của chính mình
    if (message.senderId.toString() === userId) {
      return message;
    }

    // Cập nhật readBy
    if (!message.readBy) {
      message.readBy = {};
    }

    message.readBy[userId] = new Date();
    await message.save();

    return message;
  }

  /**
   * Lấy danh sách read receipts của một tin nhắn
   */
  async getReadReceipts(messageId: string): Promise<{ [userId: string]: Date }> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    return message.readBy || {};
  }
}
