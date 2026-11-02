import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import type { AuthUser } from '../auth/auth-user';
import type { ApplicationStatus } from '../common/domain';
import { ApplicationsService } from '../applications/applications.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { ChatAttachmentEntity } from './attachment.entity';
import { ChatItemEntity } from './chat-item.entity';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ChatAttachmentView {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface ChatMessageView {
  type: 'message';
  id: string;
  applicationId: string;
  authorId: string;
  authorName: string;
  isAdmin: boolean;
  text: string;
  attachment?: ChatAttachmentView;
  createdAt: string;
}

export interface StatusEventView {
  type: 'status';
  id: string;
  applicationId: string;
  authorId: string;
  authorName: string;
  status: ApplicationStatus;
  previousStatus?: ApplicationStatus;
  createdAt: string;
}

export type ChatItemView = ChatMessageView | StatusEventView;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatItemEntity)
    private readonly items: Repository<ChatItemEntity>,
    @InjectRepository(ChatAttachmentEntity)
    private readonly attachments: Repository<ChatAttachmentEntity>,
    private readonly applications: ApplicationsService,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
    private readonly users: UsersService,
  ) {}

  async list(
    rawApplicationId: string,
    after?: string,
  ): Promise<ChatItemView[]> {
    const application = await this.applications.findEntity(rawApplicationId);

    const qb = this.items
      .createQueryBuilder('item')
      .where('item.applicationId = :applicationId', {
        applicationId: application.id,
      });

    if (after) {
      const afterDate = new Date(after);
      if (Number.isNaN(afterDate.getTime())) {
        throw new BadRequestException('Некорректное значение after');
      }
      qb.andWhere('item.createdAt > :after', { after: afterDate });
    }

    const items = await qb
      .orderBy('item.createdAt', 'ASC')
      .addOrderBy('item.id', 'ASC')
      .getMany();

    return this.toViews(items);
  }

  async createMessage(
    rawApplicationId: string,
    user: AuthUser,
    text: string | undefined,
    file: UploadedFile | undefined,
  ): Promise<ChatMessageView> {
    const application = await this.applications.findEntity(rawApplicationId);
    const isAuthor = application.authorId === user.id;

    if (!isAuthor && !user.isAdmin) {
      throw new ForbiddenException(
        'Писать в чат может автор заявки или администратор',
      );
    }

    const trimmed = text?.trim() ?? '';
    if (trimmed === '' && !file) {
      throw new BadRequestException('Нужно передать текст или файл');
    }
    if (file && file.buffer.length > MAX_FILE_SIZE) {
      // Multer usually rejects earlier; this guard also covers custom limits.
      throw new PayloadTooLargeException('Файл больше 10 МБ');
    }

    const createdAt = new Date();
    const fileData = file
      ? {
          id: randomUUID(),
          name: file.originalname,
          size: file.buffer.length,
          type: file.mimetype || 'application/octet-stream',
          data: file.buffer,
        }
      : null;

    const item = await this.dataSource.transaction(async (manager) => {
      if (fileData) {
        await manager.getRepository(ChatAttachmentEntity).insert(fileData);
      }

      const saved = await manager.getRepository(ChatItemEntity).save({
        id: randomUUID(),
        applicationId: application.id,
        type: 'message' as const,
        authorId: user.id,
        authorName: user.username,
        isAdmin: user.isAdmin,
        text: text ?? '',
        attachmentId: fileData?.id ?? null,
        status: null,
        previousStatus: null,
        createdAt,
      });

      const adminIds = await this.users.findAdminIds(manager);
      const recipients = adminIds.filter((id) => id !== user.id);
      if (application.authorId !== user.id) {
        recipients.push(application.authorId);
      }

      await this.notifications.createMany(manager, recipients, {
        kind: 'message_created',
        applicationId: application.id,
        applicationTitle: application.title,
        actorName: user.username,
        text: text ?? '',
        createdAt,
      });

      return saved;
    });

    const [message] = await this.toMessages([item]);
    return message;
  }

  async findAttachment(id: string): Promise<ChatAttachmentEntity> {
    const attachment = await this.attachments
      .createQueryBuilder('attachment')
      .addSelect('attachment.data')
      .where('attachment.id = :id', { id })
      .getOne();

    if (!attachment) {
      throw new NotFoundException('Файл не найден');
    }
    return attachment;
  }

  private async toViews(items: ChatItemEntity[]): Promise<ChatItemView[]> {
    const messages = items.filter((item) => item.type === 'message');
    const attachments = await this.loadAttachments(
      messages
        .map((item) => item.attachmentId)
        .filter((id): id is string => id !== null),
    );

    return items.map((item) =>
      item.type === 'message'
        ? this.toMessage(item, attachments.get(item.attachmentId ?? ''))
        : this.toStatus(item),
    );
  }

  private async toMessages(
    items: ChatItemEntity[],
  ): Promise<ChatMessageView[]> {
    const attachments = await this.loadAttachments(
      items
        .map((item) => item.attachmentId)
        .filter((id): id is string => id !== null),
    );
    return items.map((item) =>
      this.toMessage(item, attachments.get(item.attachmentId ?? '')),
    );
  }

  private async loadAttachments(
    ids: string[],
  ): Promise<Map<string, ChatAttachmentEntity>> {
    if (ids.length === 0) return new Map();
    const found = await this.attachments.find({ where: { id: In(ids) } });
    return new Map(found.map((attachment) => [attachment.id, attachment]));
  }

  private toMessage(
    item: ChatItemEntity,
    attachment?: ChatAttachmentEntity,
  ): ChatMessageView {
    return {
      type: 'message',
      id: item.id,
      applicationId: String(item.applicationId),
      authorId: item.authorId,
      authorName: item.authorName,
      isAdmin: item.isAdmin ?? false,
      text: item.text ?? '',
      ...(attachment
        ? {
            attachment: {
              id: attachment.id,
              name: attachment.name,
              size: attachment.size,
              type: attachment.type,
            },
          }
        : {}),
      createdAt: item.createdAt.toISOString(),
    };
  }

  private toStatus(item: ChatItemEntity): StatusEventView {
    return {
      type: 'status',
      id: item.id,
      applicationId: String(item.applicationId),
      authorId: item.authorId,
      authorName: item.authorName,
      status: item.status as ApplicationStatus,
      ...(item.previousStatus !== null
        ? { previousStatus: item.previousStatus }
        : {}),
      createdAt: item.createdAt.toISOString(),
    };
  }
}
