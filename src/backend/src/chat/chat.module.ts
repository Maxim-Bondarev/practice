import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from '../applications/applications.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatAttachmentEntity } from './attachment.entity';
import { ChatController } from './chat.controller';
import { ChatItemEntity } from './chat-item.entity';
import { ChatService } from './chat.service';
import { FilesController } from './files.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatItemEntity, ChatAttachmentEntity]),
    ApplicationsModule,
    NotificationsModule,
  ],
  controllers: [ChatController, FilesController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
