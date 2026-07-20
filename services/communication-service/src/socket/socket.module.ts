import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { MessageModule } from '../messages/message.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GroupModule } from '../groups/group.module';

@Module({
  imports: [
    forwardRef(() => MessageModule), // Use forwardRef to avoid circular dependency
    NotificationsModule,
    GroupModule,
  ],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {} 