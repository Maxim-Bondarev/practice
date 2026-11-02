import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import {
  ChatService,
  MAX_FILE_SIZE,
  type ChatItemView,
  type ChatMessageView,
  type UploadedFile as UploadedFileShape,
} from './chat.service';
import {
  ApiErrorResponse,
  ChatMessageResponse,
  StatusEventResponse,
} from './chat.response';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListChatQueryDto } from './dto/list-chat.dto';

@ApiTags('Chat')
@ApiExtraModels(ChatMessageResponse, StatusEventResponse)
@Controller('applications/:id/chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    operationId: 'listChat',
    summary: 'Лента чата заявки',
    description:
      'Отсортирована по createdAt; первый элемент — событие «Заявка открыта». Параметр `after` возвращает только более новые элементы.',
  })
  @ApiParam({ name: 'id', example: '1025' })
  @ApiOkResponse({
    description: 'Лента',
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: getSchemaPath(ChatMessageResponse) },
          { $ref: getSchemaPath(StatusEventResponse) },
        ],
        discriminator: {
          propertyName: 'type',
          mapping: {
            message: getSchemaPath(ChatMessageResponse),
            status: getSchemaPath(StatusEventResponse),
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponse,
    description: 'Некорректный after',
  })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  list(
    @Param('id') id: string,
    @Query() query: ListChatQueryDto,
  ): Promise<ChatItemView[]> {
    return this.chat.list(id, query.after);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({
    operationId: 'createMessage',
    summary: 'Отправить сообщение (с файлом или без)',
    description:
      'Писать может автор заявки или администратор. Нужно передать text, file или оба поля. Файл — до 10 МБ.',
  })
  @ApiParam({ name: 'id', example: '1025' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', maxLength: 2000 },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  @ApiCreatedResponse({ type: ChatMessageResponse })
  @ApiBadRequestResponse({
    type: ApiErrorResponse,
    description: 'Нет text/file или text длиннее 2000',
  })
  @ApiUnauthorizedResponse({ type: ApiErrorResponse })
  @ApiForbiddenResponse({
    type: ApiErrorResponse,
    description: 'Не автор и не администратор',
  })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  @ApiPayloadTooLargeResponse({
    type: ApiErrorResponse,
    description: 'Файл больше 10 МБ',
  })
  createMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @UploadedFile() file: UploadedFileShape | undefined,
    @CurrentUser() user: AuthUser,
  ): Promise<ChatMessageView> {
    return this.chat.createMessage(id, user, dto.text, file);
  }
}
