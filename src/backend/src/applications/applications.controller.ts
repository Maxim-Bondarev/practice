import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ApplicationResponse } from './application.response';
import { ApiErrorResponse } from '../chat/chat.response';
import {
  ApplicationsService,
  type ApplicationView,
} from './applications.service';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQueryDto } from './dto/list-applications.dto';

@ApiTags('Applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    operationId: 'listApplications',
    summary: 'Список заявок',
    description:
      'Без фильтров — все заявки. `mine=true` требует токен. `search` ищет по заголовку, автору и номеру.',
  })
  @ApiOkResponse({ type: [ApplicationResponse] })
  @ApiBadRequestResponse({
    type: ApiErrorResponse,
    description: 'Ошибка валидации параметров',
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponse,
    description: 'mine=true без токена',
  })
  list(
    @Query() query: ListApplicationsQueryDto,
    @CurrentUser() user: AuthUser | null,
  ): Promise<ApplicationView[]> {
    return this.applications.list(query, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({
    operationId: 'createApplication',
    summary: 'Создать заявку',
    description:
      'Создаёт заявку со статусом «Открыта» и первое событие ленты чата.',
  })
  @ApiCreatedResponse({ type: ApplicationResponse })
  @ApiBadRequestResponse({
    type: ApiErrorResponse,
    description: 'Ошибка валидации',
  })
  @ApiUnauthorizedResponse({ type: ApiErrorResponse })
  create(
    @Body() dto: CreateApplicationDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ApplicationView> {
    return this.applications.create(dto, user);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'getApplication', summary: 'Заявка по id' })
  @ApiParam({ name: 'id', example: '1025' })
  @ApiOkResponse({ type: ApplicationResponse })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  get(@Param('id') id: string): Promise<ApplicationView> {
    return this.applications.get(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({
    operationId: 'changeApplicationStatus',
    summary: 'Изменить статус заявки',
    description:
      'Переходы ограничены ролью: автор и администратор имеют разные наборы. В ленту добавляется StatusEvent.',
  })
  @ApiParam({ name: 'id', example: '1025' })
  @ApiOkResponse({ type: ApplicationResponse })
  @ApiBadRequestResponse({
    type: ApiErrorResponse,
    description: 'Ошибка валидации',
  })
  @ApiUnauthorizedResponse({ type: ApiErrorResponse })
  @ApiForbiddenResponse({
    type: ApiErrorResponse,
    description: 'Не автор/не админ либо переход запрещён',
  })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  @ApiConflictResponse({
    type: ApiErrorResponse,
    description: 'Заявка уже в этом статусе',
  })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ApplicationView> {
    return this.applications.changeStatus(id, dto, user);
  }
}
