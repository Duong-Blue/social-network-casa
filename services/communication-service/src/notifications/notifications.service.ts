import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../databases/schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    try {
      const createdNotification = new this.notificationModel(createNotificationDto);
      return await createdNotification.save();
    } catch (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  async findAll(userId: string): Promise<Notification[]> {
    try {
      return await this.notificationModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }
  }

  async findUnread(userId: string): Promise<Notification[]> {
    try {
      return await this.notificationModel
        .find({ userId, isRead: false })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new Error(`Failed to fetch unread notifications: ${error.message}`);
    }
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    try {
      const notification = await this.notificationModel
        .findOneAndUpdate(
          { _id: id, userId },
          { isRead: true },
          { new: true }
        )
        .exec();

      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.notificationModel
        .updateMany(
          { userId, isRead: false },
          { isRead: true }
        )
        .exec();
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  async delete(id: string, userId: string): Promise<Notification> {
    try {
      const notification = await this.notificationModel
        .findOneAndDelete({ _id: id, userId })
        .exec();

      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }
} 