import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from '../../common/domain';

export class ChangeStatusDto {
  @ApiProperty({ enum: APPLICATION_STATUSES, example: 'Закрыта' })
  @IsIn([...APPLICATION_STATUSES])
  status: ApplicationStatus;
}
