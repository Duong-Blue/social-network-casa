import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ConversationService } from './conversation.service';

// Hàm helper: chuyển Mongoose Document thành plain object với _id là string
const toPlain = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    _id: obj._id?.toString(),
    participants: (obj.participants || []).map((p: any) => p?.toString()),
  };
};

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  // POST /conversations/create – Idempotent: trả về conversation đã tồn tại nếu có
  @Post('create')
  async createConversation(
    @Body('user1Id') user1Id: string,
    @Body('user2Id') user2Id: string,
  ) {
    const conversation = await this.conversationService.createOrGetConversation(user1Id, user2Id);
    return toPlain(conversation);
  }

  // GET /conversations/user/:userId
  @Get('user/:userId')
  async getUserConversations(
    @Param('userId') userId: string,
  ) {
    const conversations = await this.conversationService.getUserConversations(userId);
    return conversations.map(toPlain);
  }

  // GET /conversations/:id
  @Get(':id')
  async getConversationById(
    @Param('id') id: string,
  ) {
    const conversation = await this.conversationService.findById(id);
    return conversation ? toPlain(conversation) : null;
  }

  // POST /conversations/:id/delete
  @Post(':id/delete')
  async deleteConversation(@Param('id') id: string) {
    await this.conversationService.deleteConversation(id);
    return { success: true, message: 'Đã xóa cuộc hội thoại thành công' };
  }
}

