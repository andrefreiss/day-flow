import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user.decorator.js';
import { DashboardQueryDto } from './dto/dashboard-query.dto.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  getSummary(
    @CurrentUserId() userId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboard.getSummary(userId, query.date);
  }
}
