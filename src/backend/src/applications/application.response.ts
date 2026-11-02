import { ApiProperty } from '@nestjs/swagger';
import {
  APPLICATION_STATUSES,
  PROJECTS,
  type ApplicationStatus,
  type Project,
} from '../common/domain';

export class ApplicationResponse {
  @ApiProperty({ example: '1025' })
  id: string;

  @ApiProperty({ example: 'Не приходит код подтверждения' })
  title: string;

  @ApiProperty({ format: 'date-time' })
  date: string;

  @ApiProperty({ enum: PROJECTS })
  project: Project;

  @ApiProperty({ enum: APPLICATION_STATUSES })
  status: ApplicationStatus;

  @ApiProperty({ description: 'Id пользователя Keycloak (sub)' })
  authorId: string;

  @ApiProperty({ description: 'preferred_username автора' })
  authorName: string;

  @ApiProperty({ minimum: 0 })
  messagesCount: number;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'null, если сообщений ещё нет',
  })
  lastMessageAt: string | null;
}
