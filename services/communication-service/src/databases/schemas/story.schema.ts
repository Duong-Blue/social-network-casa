import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoryDocument = Story & Document;

@Schema({ timestamps: true })
export class Story {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  mediaUrl: string;

  @Prop({ default: 'image', enum: ['image', 'video'] })
  mediaType: string;

  @Prop({ type: [String], default: [] })
  viewers: string[];

  // TTL index: 86400 seconds = 24 hours
  @Prop({ type: Date, default: Date.now, expires: 86400 })
  createdAt: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);
