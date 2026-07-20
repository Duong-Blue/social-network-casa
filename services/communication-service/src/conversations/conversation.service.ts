import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from './conversation.entity';

@Injectable()
export class ConversationService {

  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
  ) {}

  // ── Tạo hoặc lấy conversation 1-1 (idempotent) ──
  async createOrGetConversation(user1Id: string, user2Id: string): Promise<Conversation> {
    // Kiểm tra conversation đã tồn tại chưa (cả 2 chiều)
    const existing = await this.conversationModel.findOne({
      participants: { $all: [user1Id, user2Id] },
      isGroup: false,
    }).exec();

    if (existing) return existing;

    // Tạo mới nếu chưa tồn tại
    const newConversation = new this.conversationModel({
      participants: [user1Id, user2Id],
      isGroup: false,
    });
    return newConversation.save();
  }

  // ── Lấy tất cả conversations của user, sort theo updatedAt ──
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return this.conversationModel
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  // ── Cập nhật lastMessage khi có tin nhắn mới ──
  async updateLastMessage(conversationId: string, message: {
    _id: string;
    content: string;
    senderId: string;
    createdAt: string;
    status: string;
  }): Promise<Conversation> {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        {
          lastMessage: message,
          updatedAt: new Date(),
        },
        { new: true }
      )
      .exec();
  }

  // ── Tìm conversation theo ID ──
  async findById(conversationId: string): Promise<Conversation | null> {
    return this.conversationModel.findById(conversationId).exec();
  }

  // ── Xóa conversation theo ID ──
  async deleteConversation(conversationId: string): Promise<any> {
    return this.conversationModel.findByIdAndDelete(conversationId).exec();
  }
}
