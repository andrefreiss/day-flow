import { IsCalendarDate } from '../../../common/is-calendar-date.js';

export class DashboardQueryDto {
  @IsCalendarDate()
  date: string;
}
