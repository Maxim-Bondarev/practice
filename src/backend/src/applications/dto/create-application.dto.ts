import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';
import { PROJECTS, type Project } from '../../common/domain';

export class CreateApplicationDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 1000,
    example: 'Не приходит код подтверждения',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 1000)
  title: string;

  @ApiProperty({ enum: PROJECTS, example: '1X' })
  @IsIn([...PROJECTS])
  project: Project;
}
