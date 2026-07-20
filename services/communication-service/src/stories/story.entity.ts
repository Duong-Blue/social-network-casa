import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Story extends Document {
  @Prop({ type: String, required: true })
  userId: string; // User who posted

  @Prop({ type: String, required: true })
  mediaUrl: string;

  @Prop({ type: String, default: 'image', enum: ['image', 'video'] })
  mediaType: string;

  @Prop({ type: String, default: '' })
  caption: string;

  @Prop({ type: [String], default: [] })
  viewers: string[];

  @Prop({ type: [{ userId: { type: String, required: true }, emoji: { type: String, required: true } }], default: [] })
  reactions: { userId: string; emoji: string }[];

  // TTL index: automatically delete after 24 hours (86400 seconds)
  @Prop({ type: Date, default: Date.now, expires: 86400 })
  createdAt: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);
