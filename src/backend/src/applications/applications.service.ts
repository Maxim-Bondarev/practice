import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import type { AuthUser } from '../auth/auth-user';
import {
  allowedTransitions,
  type ApplicationSort,
  type ApplicationStatus,
  type Project,
} from '../common/domain';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { ApplicationEntity } from './application.entity';
import type { ChangeStatusDto } from './dto/change-status.dto';
import type { CreateApplicationDto } from './dto/create-application.dto';
import type { ListApplicationsQueryDto } from './dto/list-applications.dto';
import { ChatItemEntity } from '../chat/chat-item.entity';

export interface ApplicationView {
  id: string;
  title: string;
  date: string;
  project: Project;
  status: ApplicationStatus;
  authorId: string;
  authorName: string;
  messagesCount: number;
  lastMessageAt: string | null;
}

interface MessageStats {
  count: number;
  lastMessageAt: Date | null;
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(ChatItemEntity)
    private readonly chatItems: Repository<ChatItemEntity>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
    private readonly users: UsersService,
  ) {}

  async list(
    query: ListApplicationsQueryDto,
    user: AuthUser | null,
  ): Promise<ApplicationView[]> {
    const qb = this.applications.createQueryBuilder('application');

    if (query.status?.length) {
      qb.andWhere('application.status IN (:...statuses)', {
        statuses: query.status,
      });
    }
    if (query.project) {
      qb.andWhere('application.project = :project', {
        project: query.project,
      });
    }
    if (query.mine) {
      if (!user) {
        throw new UnauthorizedException();
      }
      qb.andWhere('application.authorId = :authorId', {
        authorId: user.id,
      });
    }
    if (query.search?.trim()) {
      const escaped = query.search.trim().replace(/[\\%_]/g, '\\$&');
      const pattern = `%${escaped}%`;
      qb.andWhere(
        '(application.title ILIKE :pattern OR application.authorName ILIKE :pattern OR CAST(application.id AS TEXT) LIKE :pattern)',
        { pattern },
      );
    }

    this.applySort(qb, query.sort ?? 'newest');

    const applications = await qb.getMany();
    const stats = await this.statsFor(applications.map((app) => app.id));
    return applications.map((app) => this.toView(app, stats.get(app.id)));
  }

  async findEntity(rawId: string): Promise<ApplicationEntity> {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('Заявка не найдена');
    }
    const application = await this.applications.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException('Заявка не найдена');
    }
    return application;
  }

  async get(rawId: string): Promise<ApplicationView> {
    const application = await this.findEntity(rawId);
    const stats = await this.statsFor([application.id]);
    return this.toView(application, stats.get(application.id));
  }

  async create(
    dto: CreateApplicationDto,
    user: AuthUser,
  ): Promise<ApplicationView> {
    const createdAt = new Date();

    const application = await this.dataSource.transaction(async (manager) => {
      const saved = await manager.getRepository(ApplicationEntity).save({
        title: dto.title,
        date: createdAt,
        project: dto.project,
        status: 'Открыта' as const,
        authorId: user.id,
        authorName: user.username,
      });

      await manager.getRepository(ChatItemEntity).insert({
        id: randomUUID(),
        applicationId: saved.id,
        type: 'status',
        authorId: user.id,
        authorName: user.username,
        isAdmin: user.isAdmin,
        text: null,
        attachmentId: null,
        status: 'Открыта',
        previousStatus: null,
        createdAt,
      });

      await this.notifications.notifyAdmins(
        manager,
        {
          kind: 'application_created',
          applicationId: saved.id,
          applicationTitle: saved.title,
          actorName: user.username,
          status: 'Открыта',
          createdAt,
        },
        user.id,
      );

      return saved;
    });

    return this.toView(application, { count: 0, lastMessageAt: null });
  }

  async changeStatus(
    rawId: string,
    dto: ChangeStatusDto,
    user: AuthUser,
  ): Promise<ApplicationView> {
    const application = await this.findEntity(rawId);
    const isAuthor = application.authorId === user.id;

    if (!isAuthor && !user.isAdmin) {
      throw new ForbiddenException(
        'Менять статус может автор заявки или администратор',
      );
    }
    if (application.status === dto.status) {
      throw new ConflictException('Заявка уже находится в этом статусе');
    }

    const allowed = allowedTransitions(application.status, {
      isAdmin: user.isAdmin,
      isAuthor,
    });
    if (!allowed.includes(dto.status)) {
      throw new ForbiddenException(
        `Переход «${application.status}» → «${dto.status}» недоступен`,
      );
    }

    const createdAt = new Date();

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(ApplicationEntity)
        .update({ id: application.id }, { status: dto.status });

      await manager.getRepository(ChatItemEntity).insert({
        id: randomUUID(),
        applicationId: application.id,
        type: 'status',
        authorId: user.id,
        authorName: user.username,
        isAdmin: user.isAdmin,
        text: null,
        attachmentId: null,
        status: dto.status,
        previousStatus: application.status,
        createdAt,
      });

      const adminIds = await this.users.findAdminIds(manager);
      const recipients = adminIds.filter((id) => id !== user.id);
      if (application.authorId !== user.id) {
        recipients.push(application.authorId);
      }

      await this.notifications.createMany(manager, recipients, {
        kind: 'status_changed',
        applicationId: application.id,
        applicationTitle: application.title,
        actorName: user.username,
        status: dto.status,
        previousStatus: application.status,
        createdAt,
      });
    });

    application.status = dto.status;
    const stats = await this.statsFor([application.id]);
    return this.toView(application, stats.get(application.id));
  }

  private applySort(
    qb: SelectQueryBuilder<ApplicationEntity>,
    sort: ApplicationSort,
  ): void {
    if (sort === 'oldest') {
      qb.orderBy('application.date', 'ASC').addOrderBy('application.id', 'ASC');
      return;
    }
    if (sort === 'activity') {
      const lastMessage = `(SELECT MAX(message.created_at) FROM app.chat_items message WHERE message.application_id = application.id AND message.type = 'message')`;
      qb.orderBy(
        `COALESCE(${lastMessage}, application.date)`,
        'DESC',
      ).addOrderBy('application.id', 'DESC');
      return;
    }
    qb.orderBy('application.date', 'DESC').addOrderBy('application.id', 'DESC');
  }

  private async statsFor(ids: number[]): Promise<Map<number, MessageStats>> {
    const stats = new Map<number, MessageStats>();
    if (ids.length === 0) return stats;

    const rows = await this.chatItems
      .createQueryBuilder('item')
      .select('item.application_id', 'applicationId')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(item.created_at)', 'lastMessageAt')
      .where('item.application_id IN (:...ids)', { ids: ids })
      .andWhere("item.type = 'message'")
      .groupBy('item.application_id')
      .getRawMany<{
        applicationId: number;
        count: string;
        lastMessageAt: Date | string | null;
      }>();

    for (const row of rows) {
      stats.set(Number(row.applicationId), {
        count: Number(row.count),
        lastMessageAt: row.lastMessageAt ? new Date(row.lastMessageAt) : null,
      });
    }
    return stats;
  }

  private toView(
    application: ApplicationEntity,
    stats?: MessageStats,
  ): ApplicationView {
    return {
      id: String(application.id),
      title: application.title,
      date: new Date(application.date).toISOString(),
      project: application.project,
      status: application.status,
      authorId: application.authorId,
      authorName: application.authorName,
      messagesCount: stats?.count ?? 0,
      lastMessageAt: stats?.lastMessageAt
        ? stats.lastMessageAt.toISOString()
        : null,
    };
  }
}
