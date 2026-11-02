import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { In, Repository } from 'typeorm';
import type { ApplicationStatus, NotificationKind } from '../common/domain';
import { UsersService } from '../users/users.service';
import { NotificationEntity } from './notification.entity';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface NotificationInput {
  kind: NotificationKind;
  applicationId: number;
  applicationTitle: string;
  actorName: string;
  createdAt: Date;
  text?: string;
  status?: ApplicationStatus;
  previousStatus?: ApplicationStatus;
}

export interface NotificationView {
  id: string;
  kind: NotificationKind;
  applicationId: string;
  applicationTitle: string;
  actorName: string;
  text?: string;
  status?: ApplicationStatus;
  previousStatus?: ApplicationStatus;
  createdAt: string;
  read: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
    private readonly users: UsersService,
  ) {}

  /** Notifies every known administrator except the actor. */
  async notifyAdmins(
    manager: EntityManager,
    input: NotificationInput,
    actorId: string,
  ): Promise<void> {
    const adminIds = await this.users.findAdminIds(manager);
    await this.createMany(
      manager,
      adminIds.filter((id) => id !== actorId),
      input,
    );
  }

  async createMany(
    manager: EntityManager,
    recipientIds: string[],
    input: NotificationInput,
  ): Promise<void> {
    const unique = [...new Set(recipientIds)];
    if (unique.length === 0) return;

    await manager.getRepository(NotificationEntity).insert(
      unique.map((recipientId) => ({
        id: randomUUID(),
        recipientId,
        kind: input.kind,
        applicationId: input.applicationId,
        applicationTitle: input.applicationTitle,
        actorName: input.actorName,
        text: input.text ?? null,
        status: input.status ?? null,
        previousStatus: input.previousStatus ?? null,
        createdAt: input.createdAt,
        read: false,
      })),
    );
  }

  async list(
    userId: string,
    options: { unreadOnly: boolean; limit: number },
  ): Promise<{ items: NotificationView[]; unreadCount: number }> {
    const [items, unreadCount] = await Promise.all([
      this.notifications.find({
        where: {
          recipientId: userId,
          ...(options.unreadOnly ? { read: false } : {}),
        },
        order: { createdAt: 'DESC' },
        take: options.limit,
      }),
      this.notifications.count({
        where: { recipientId: userId, read: false },
      }),
    ]);

    return { items: items.map((item) => this.toView(item)), unreadCount };
  }

  async markRead(
    userId: string,
    options: { ids?: string[]; all?: boolean },
  ): Promise<void> {
    if (options.all) {
      await this.notifications.update(
        { recipientId: userId, read: false },
        { read: true },
      );
      return;
    }

    if (!options.ids?.length) {
      throw new BadRequestException('Передайте ids или all = true');
    }

    const validIds = options.ids.filter((id) => UUID_PATTERN.test(id));
    if (validIds.length === 0) {
      throw new BadRequestException('Некорректные id уведомлений');
    }

    await this.notifications.update(
      { recipientId: userId, id: In(validIds), read: false },
      { read: true },
    );
  }

  private toView(item: NotificationEntity): NotificationView {
    return {
      id: item.id,
      kind: item.kind,
      applicationId: String(item.applicationId),
      applicationTitle: item.applicationTitle,
      actorName: item.actorName,
      ...(item.text !== null ? { text: item.text } : {}),
      ...(item.status !== null ? { status: item.status } : {}),
      ...(item.previousStatus !== null
        ? { previousStatus: item.previousStatus }
        : {}),
      createdAt: item.createdAt.toISOString(),
      read: item.read,
    };
  }
}
