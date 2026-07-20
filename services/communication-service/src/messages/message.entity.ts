import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class MessageFile {
  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String, required: true })
  filename: string;

  @Prop({ type: String, required: true })
  mimetype: string;

  @Prop({ type: Number })
  size?: number;

  @Prop({ type: String })
  originalName?: string;
}

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: String, index: true }) // ── Thêm conversationId để query nhanh ──
  conversationId?: string;

  @Prop({ type: Types.ObjectId, index: true })
  senderId: string;

  @Prop({ type: Types.ObjectId, index: true })
  receiverId?: string; // cá nhân

  @Prop({ type: Types.ObjectId, index: true })
  groupId?: string; // nhóm

  @Prop({ type: String, default: '' })
  content: string;

  @Prop({ type: [Object], default: [] })
  files?: MessageFile[];

  @Prop({ type: String, enum: ['text', 'file', 'mixed'], default: 'text' })
  messageType: string;

  @Prop({
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  })
  status: string;

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ type: Object, default: {} })
  reactions?: { [emoji: string]: string[] };

  @Prop({ type: Boolean, default: false })
  isEdited?: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted?: boolean;

  @Prop({ type: String, enum: ['deleteForMe', 'deleteForEveryone'], default: null })
  deleteType?: string;

  @Prop({ type: [String], default: [] })
  deletedForUsers?: string[];

  @Prop({ type: Date })
  editedAt?: Date;

  @Prop({ type: Types.ObjectId })
  replyTo?: string;

  @Prop({ type: Boolean, default: false })
  pinned?: boolean;

  @Prop({ type: Object, default: {} })
  readBy?: { [userId: string]: Date };

  @Prop({ type: [Types.ObjectId], default: [] })
  mentions?: string[];

  // timestamps: true tự động tạo createdAt và updatedAt
  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// ── Compound index để query messages theo conversationId + createdAt (sort) ──
MessageSchema.index({ conversationId: 1, createdAt: 1 });
// ── Index cho chat 1-1 (fallback khi không có conversationId) ──
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
// ── Index cho group chat ──
MessageSchema.index({ groupId: 1, createdAt: 1 });

