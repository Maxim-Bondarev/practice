import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class MarkReadDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Передайте ids или all = true',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids?: string[];

  @ApiPropertyOptional({ description: 'Отметить все уведомления' })
  @IsOptional()
  @IsBoolean()
  all?: boolean;
}
