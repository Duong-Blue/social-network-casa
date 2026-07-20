import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Group extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  avatar?: string; // Avatar của nhóm

  @Prop({ type: String })
  description?: string; // Mô tả nhóm

  @Prop({ type: Types.ObjectId, required: true })
  creatorId: string; // Người tạo nhóm

  @Prop({ type: [Types.ObjectId], default: [] })
  admins: string[]; // Danh sách admin (ngoài creator)

  @Prop({ type: [Types.ObjectId], required: true })
  members: string[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: [Types.ObjectId], default: [] })
  mutedBy?: string[]; // Danh sách userId đã tắt thông báo nhóm

  @Prop({ type: Types.ObjectId })
  pinnedMessageId?: string; // ID tin nhắn được ghim trong nhóm
}

export const GroupSchema = SchemaFactory.createForClass(Group);
