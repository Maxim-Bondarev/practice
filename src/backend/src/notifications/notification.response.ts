import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { APPLICATION_STATUSES, type ApplicationStatus } from '../common/domain';

const NOTIFICATION_KINDS = [
  'application_created',
  'message_created',
  'status_changed',
] as const;

export class NotificationResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NOTIFICATION_KINDS })
  kind: (typeof NOTIFICATION_KINDS)[number];

  @ApiProperty({ example: '1025' })
  applicationId: string;

  @ApiProperty()
  applicationTitle: string;

  @ApiProperty({ description: 'Кто совершил действие' })
  actorName: string;

  @ApiPropertyOptional({
    description:
      'Превью сообщения; пустая строка, если в сообщении только файл',
  })
  text?: string;

  @ApiPropertyOptional({ enum: APPLICATION_STATUSES })
  status?: ApplicationStatus;

  @ApiPropertyOptional({ enum: APPLICATION_STATUSES })
  previousStatus?: ApplicationStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty()
  read: boolean;
}

export class NotificationsResponse {
  @ApiProperty({ type: [NotificationResponse] })
  items: NotificationResponse[];

  @ApiProperty({ minimum: 0, description: 'Общее число непрочитанных' })
  unreadCount: number;
}
