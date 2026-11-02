import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { APPLICATION_STATUSES, type ApplicationStatus } from '../common/domain';

export class ChatAttachmentResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'error.png' })
  name: string;

  @ApiProperty({ example: 184320 })
  size: number;

  @ApiProperty({ example: 'image/png' })
  type: string;
}

export class ChatMessageResponse {
  @ApiProperty({ enum: ['message'] })
  type: 'message';

  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: '1025' })
  applicationId: string;

  @ApiProperty({ description: 'Id пользователя Keycloak (sub)' })
  authorId: string;

  @ApiProperty({ description: 'preferred_username на момент отправки' })
  authorName: string;

  @ApiProperty({ description: 'Сообщение написано администратором' })
  isAdmin: boolean;

  @ApiProperty({
    maxLength: 2000,
    description: 'Может быть пустым, если есть файл',
  })
  text: string;

  @ApiPropertyOptional({ type: ChatAttachmentResponse })
  attachment?: ChatAttachmentResponse;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class StatusEventResponse {
  @ApiProperty({ enum: ['status'] })
  type: 'status';

  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: '1025' })
  applicationId: string;

  @ApiProperty({ description: 'Кто изменил статус (sub)' })
  authorId: string;

  @ApiProperty()
  authorName: string;

  @ApiProperty({ enum: APPLICATION_STATUSES })
  status: ApplicationStatus;

  @ApiPropertyOptional({
    enum: APPLICATION_STATUSES,
    description: 'Отсутствует у первого события «Заявка открыта»',
  })
  previousStatus?: ApplicationStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class ApiErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request', required: false })
  error?: string;
}
