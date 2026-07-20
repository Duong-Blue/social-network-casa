import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Conversation extends Document {
  // ── Dùng participants[] thay vì user1Id/user2Id để FE nhất quán ──
  @Prop({ type: [String], required: true, index: true })
  participants: string[]; // Danh sách userId

  @Prop({ type: Boolean, default: false })
  isGroup: boolean;

  @Prop({ type: String })
  name?: string; // Tên nhóm (với group chat) hoặc tên người dùng

  @Prop({ type: String })
  avatar?: string; // Avatar nhóm hoặc avatar người dùng

  @Prop({ type: Object })
  lastMessage?: {
    _id: string;
    content: string;
    senderId: string;
    createdAt: string;
    status: string;
  };

  @Prop({ type: Number, default: 0 })
  unreadCount?: number;

  // timestamps: true tự động tạo createdAt và updatedAt
  createdAt: Date;
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// ── Index tối ưu tìm kiếm theo participants ──
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });
