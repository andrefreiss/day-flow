import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { IsCalendarDate } from '../../../common/is-calendar-date.js';
import { TaskStatus } from '../../../generated/prisma/enums.js';

export class TaskFiltersDto {
  @IsOptional()
  @IsCalendarDate()
  from?: string;

  @IsOptional()
  @IsCalendarDate()
  to?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
