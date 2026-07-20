import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageModule } from './messages/message.module';
import { DatabaseModule } from './databases/database.module';
import { ConversationModule } from './conversations/conversation.module';
import { AppService } from './app.service';
import { SocketModule } from './socket/socket.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GroupModule } from './groups/group.module';
import { StoryModule } from './stories/story.module';


@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://admin:123zXc_@localhost:27017/chat-db?authSource=admin', {
      serverSelectionTimeoutMS: 5000, // Timeout sau 5 giây nếu không kết nối được
      socketTimeoutMS: 45000,
    }),
    DatabaseModule,
    MessageModule,
    ConversationModule,
    SocketModule,
    NotificationsModule,
    GroupModule,
    StoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
