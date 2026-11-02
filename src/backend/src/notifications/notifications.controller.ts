import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { HttpCode } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListNotificationsQueryDto } from './dto/list-notifications.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import {
  NotificationsService,
  type NotificationView,
} from './notifications.service';
import { NotificationsResponse } from './notification.response';
import { ApiErrorResponse } from '../chat/chat.response';

@ApiTags('Notifications')
@ApiBearerAuth('keycloak')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({
    operationId: 'listNotifications',
    summary: 'Уведомления текущего пользователя',
    description:
      'Создаются о действиях других людей. Отсортированы от новых к старым.',
  })
  @ApiOkResponse({ type: NotificationsResponse })
  @ApiUnauthorizedResponse({ type: ApiErrorResponse })
  list(
    @Query() query: ListNotificationsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ items: NotificationView[]; unreadCount: number }> {
    return this.notifications.list(user.id, {
      unreadOnly: query.unreadOnly ?? false,
      limit: query.limit ?? 30,
    });
  }

  @Post('read')
  @HttpCode(204)
  @ApiOperation({
    operationId: 'markNotificationsRead',
    summary: 'Отметить уведомления прочитанными',
    description: 'Передайте ids нужных уведомлений либо all = true.',
  })
  @ApiNoContentResponse({ description: 'Отмечено' })
  @ApiBadRequestResponse({
    type: ApiErrorResponse,
    description: 'Не переданы ids или all',
  })
  @ApiUnauthorizedResponse({ type: ApiErrorResponse })
  async markRead(
    @Body() dto: MarkReadDto,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.notifications.markRead(user.id, {
      ids: dto.ids,
      all: dto.all,
    });
  }
}
