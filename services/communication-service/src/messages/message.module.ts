import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { Message, MessageSchema } from './message.entity';
import { ConversationModule } from '../conversations/conversation.module';
import { GroupModule } from 'src/groups/group.module';
import { StorageModule } from '../storage/storage.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    ConversationModule,
    GroupModule,
    StorageModule,
    forwardRef(() => SocketModule), // Use forwardRef to avoid circular dependency
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
