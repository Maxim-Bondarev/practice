import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  APPLICATION_SORTS,
  APPLICATION_STATUSES,
  PROJECTS,
  type ApplicationSort,
  type ApplicationStatus,
  type Project,
} from '../../common/domain';

export function toBoolean({ value }: { value: unknown }): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class ListApplicationsQueryDto {
  @ApiPropertyOptional({
    enum: APPLICATION_STATUSES,
    isArray: true,
    description:
      'Параметр можно повторять; заявка подходит, если статус входит в список',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : Array.isArray(value) ? value : [value],
  )
  @IsArray()
  @IsIn([...APPLICATION_STATUSES], { each: true })
  status?: ApplicationStatus[];

  @ApiPropertyOptional({ enum: PROJECTS })
  @IsOptional()
  @IsIn([...PROJECTS])
  project?: Project;

  @ApiPropertyOptional({ description: 'Поиск по заголовку, автору и номеру' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Только заявки текущего пользователя (нужен токен)',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  mine?: boolean;

  @ApiPropertyOptional({ enum: APPLICATION_SORTS, default: 'newest' })
  @IsOptional()
  @IsIn([...APPLICATION_SORTS])
  sort?: ApplicationSort;
}
