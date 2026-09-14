import { IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';
import { TaskStatus } from '../../../generated/prisma/enums.js';

export class TaskFiltersDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
