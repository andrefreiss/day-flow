import { Injectable } from '@nestjs/common';
import { toDateColumn } from '../../common/date-column.js';
import { PrismaService } from '../../database/prisma.service.js';
import { TaskStatus } from '../../generated/prisma/enums.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, date: string) {
    const referenceDate = toDateColumn(date);

    const [statusGroups, overdue, upcoming] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: {
          userId,
          date: referenceDate,
        },
        _count: {
          _all: true,
        },
      }),
      this.prisma.task.count({
        where: {
          userId,
          status: TaskStatus.PENDING,
          date: {
            lt: referenceDate,
          },
        },
      }),
      this.prisma.task.count({
        where: {
          userId,
          status: TaskStatus.PENDING,
          date: {
            gt: referenceDate,
          },
        },
      }),
    ]);

    const completed =
      statusGroups.find((group) => group.status === TaskStatus.DONE)?._count
        ._all ?? 0;

    const pending =
      statusGroups.find((group) => group.status === TaskStatus.PENDING)?._count
        ._all ?? 0;

    const total = completed + pending;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      date,
      today: {
        total,
        completed,
        pending,
      },
      overdue,
      upcoming,
      progress,
    };
  }
}
