import { Controller, Post, Get, Delete, Patch, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoryService } from './story.service';
import { MinioService } from '../storage/minio.service';
import { transformMediaUrl } from './story.service';
import { SocketGateway } from '../socket/socket.gateway';

@Controller('stories')
export class StoryController {
  constructor(
    private readonly storyService: StoryService,
    private readonly minioService: MinioService,
    @Inject(forwardRef(() => SocketGateway))
    private readonly socketGateway: SocketGateway,
  ) {}

  @Get('all')
  async getAllStories() {
    const feed = await this.storyService.getAllStories();
    return { success: true, data: feed };
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createStory(
    @Body('userId') userId: string,
    @Body('mediaType') mediaType: string,
    @Body('caption') caption: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!userId || !file) {
      throw new BadRequestException('userId and file are required');
    }

    // Upload to Minio
    const uploaded = await this.minioService.uploadFile(file, 'stories');
    const mediaUrl = uploaded.url;

    const story = await this.storyService.createStory(userId, mediaUrl, mediaType || 'image', caption || '');
    const storyObj = story.toObject();
    storyObj.mediaUrl = transformMediaUrl(storyObj.mediaUrl);
    return { success: true, data: storyObj };
  }

  @Post('feed')
  async getFeed(@Body('friendIds') friendIds: string[]) {
    if (!friendIds || friendIds.length === 0) return { success: true, data: [] };
    const feed = await this.storyService.getStoriesByUsers(friendIds);
    return { success: true, data: feed };
  }

  @Post(':id/view')
  async markViewed(@Param('id') id: string, @Body('userId') userId: string) {
    if (!userId) return { success: false, message: 'viewerId required' };
    const story = await this.storyService.markAsViewed(id, userId);
    return { success: !!story, data: story };
  }

  @Post(':id/react')
  async reactStory(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('emoji') emoji: string,
  ) {
    if (!userId || !emoji) return { success: false, message: 'Missing userId or emoji' };
    const story = await this.storyService.addReaction(id, userId, emoji);
    
    // Gửi thông báo đến người đăng story nếu người thả emoji không phải là chính họ
    if (story && story.userId !== userId) {
      this.socketGateway.sendNotification({
        actor: userId,
        userId: story.userId,
        title: 'Phản hồi tin',
        content: `đã bày tỏ cảm xúc ${emoji} với tin của bạn.`,
        data: {
          storyId: story._id.toString(),
          emoji: emoji,
          type: 'story_reaction'
        }
      }).catch(err => console.error('Failed to send story react notification:', err));
    }
    
    return { success: !!story, data: story };
  }

  @Delete(':id')
  async deleteStory(@Param('id') id: string, @Query('userId') userId: string) {
    const success = await this.storyService.deleteStory(id, userId);
    return { success };
  }

  @Patch(':id')
  async updateStory(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('caption') caption: string,
  ) {
    if (!userId) throw new BadRequestException('userId is required');
    const updated = await this.storyService.updateStory(id, userId, caption ?? '');
    if (!updated) throw new NotFoundException('Story not found or not authorized');
    return { success: true, data: updated };
  }
}
