import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsOptional } from 'class-validator';

export class ListChatQueryDto {
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Только элементы с createdAt строго позже',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? value : undefined,
  )
  @IsISO8601({ strict: true })
  after?: string;
}
