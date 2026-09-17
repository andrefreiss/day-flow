import { Matches } from 'class-validator';

export class DashboardQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}
