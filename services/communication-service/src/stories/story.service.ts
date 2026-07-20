import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Story } from './story.entity';

export function transformMediaUrl(url: string): string {
  if (!url) return url;

  // Nếu URL chứa /casa/, chuyển thành relative path /files/{folder}/{filename}
  // VD: http://minio:9000/casa/stories/123-abc.jpg → /files/stories/123-abc.jpg
  const casaIndex = url.indexOf('/casa/');
  if (casaIndex !== -1) {
    const relativePath = url.substring(casaIndex + '/casa/'.length);
    return `/files/${relativePath}`;
  }

  // Nếu URL chứa localhost, thay bằng host IP và giữ nguyên
  if (url.includes('localhost')) {
    return url.replace('localhost', process.env.HOST_IP || '192.168.1.8');
  }

  return url;
}

@Injectable()
export class StoryService {
  constructor(@InjectModel(Story.name) private storyModel: Model<Story>) {}

  async createStory(userId: string, mediaUrl: string, mediaType: string, caption?: string): Promise<Story> {
    const newStory = new this.storyModel({ userId, mediaUrl, mediaType, caption });
    return await newStory.save();
  }

  async getStoriesByUsers(userIds: string[]): Promise<any[]> {
    // Return stories grouped by user and sorted by createdAt
    const stories = await this.storyModel
      .find({ userId: { $in: userIds } })
      .sort({ createdAt: 1 })
      .exec();
    
    const grouped = stories.reduce((acc, story) => {
      if (!acc[story.userId]) {
        acc[story.userId] = [];
      }
      const storyObj = story.toObject();
      storyObj.mediaUrl = transformMediaUrl(storyObj.mediaUrl);
      acc[story.userId].push(storyObj);
      return acc;
    }, {});

    return Object.keys(grouped).map(userId => ({
      userId,
      stories: grouped[userId]
    }));
  }

  async getAllStories(): Promise<any[]> {
    // Fetch ALL active stories (MongoDB TTL handles 24h expiry automatically)
    const stories = await this.storyModel
      .find({})
      .sort({ createdAt: -1 })
      .exec();
    
    const grouped: Record<string, any[]> = {};
    for (const story of stories) {
      const uid = story.userId;
      if (!grouped[uid]) grouped[uid] = [];
      const storyObj = story.toObject();
      storyObj.mediaUrl = transformMediaUrl(storyObj.mediaUrl);
      grouped[uid].push(storyObj);
    }

    return Object.keys(grouped).map(userId => ({
      userId,
      stories: grouped[userId]
    }));
  }

  async markAsViewed(storyId: string, viewerId: string): Promise<Story> {
    return await this.storyModel.findByIdAndUpdate(
      storyId,
      { $addToSet: { viewers: viewerId } },
      { new: true } // return updated document
    ).exec();
  }

  async addReaction(storyId: string, userId: string, emoji: string): Promise<Story> {
    return await this.storyModel.findByIdAndUpdate(
      storyId,
      { 
        $push: { reactions: { userId, emoji } },
        $addToSet: { viewers: userId } // implicitly viewed
      },
      { new: true }
    ).exec();
  }

  async updateStory(storyId: string, userId: string, caption: string): Promise<Story | null> {
    return await this.storyModel.findOneAndUpdate(
      { _id: storyId, userId },
      { caption },
      { new: true }
    ).exec();
  }

  async deleteStory(storyId: string, userId: string): Promise<boolean> {
    const result = await this.storyModel.deleteOne({ _id: storyId, userId }).exec();
    return result.deletedCount > 0;
  }
}
