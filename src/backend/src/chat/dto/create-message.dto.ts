import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @ApiPropertyOptional({
    maxLength: 2000,
    description: 'Нужно передать text, file или оба поля',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  text?: string;
}
