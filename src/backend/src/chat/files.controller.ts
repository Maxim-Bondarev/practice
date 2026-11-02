import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { ApiErrorResponse } from './chat.response';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const INLINE_TYPES: Record<string, true> = {
  'image/png': true,
  'image/jpeg': true,
  'image/gif': true,
  'image/webp': true,
};

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly chat: ChatService) {}

  @Get(':id')
  @ApiOperation({
    operationId: 'downloadFile',
    summary: 'Скачать вложение',
    description:
      'id — это attachment.id из сообщения. Доступ такой же, как к чату заявки.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description: 'Содержимое файла',
    content: {
      'application/octet-stream': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    if (!UUID_PATTERN.test(id)) {
      throw new NotFoundException('Файл не найден');
    }

    const attachment = await this.chat.findAttachment(id);
    const inline = INLINE_TYPES[attachment.type] === true;

    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader(
      'Content-Type',
      attachment.type || 'application/octet-stream',
    );
    response.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${asciiName(attachment.name)}"; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
    );

    return new StreamableFile(attachment.data);
  }
}

function asciiName(name: string): string {
  const fallback = name
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_')
    .trim();
  return fallback || 'file';
}
