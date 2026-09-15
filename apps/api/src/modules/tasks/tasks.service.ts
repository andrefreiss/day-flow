import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { TaskStatus } from '../../generated/prisma/enums.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { TaskFiltersDto } from './dto/task-filters.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

const omitOwner = { userId: true };

function toDateColumn(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters: TaskFiltersDto) {
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        status: filters.status,
        categoryId: filters.categoryId,
        date: this.buildDateRange(filters),
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { title: 'asc' }],
      omit: omitOwner,
    });

    return tasks.map((task) => this.toResponse(task));
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      omit: omitOwner,
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    return this.toResponse(task);
  }

  async create(userId: string, dto: CreateTaskDto) {
    this.assertTimeRange(dto.startTime, dto.endTime);
    await this.assertCategoryBelongsToUser(userId, dto.categoryId);

    const task = await this.prisma.task.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        date: toDateColumn(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        priority: dto.priority,
      },
      omit: omitOwner,
    });

    return this.toResponse(task);
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const current = await this.prisma.task.findFirst({ where: { id, userId } });

    if (!current) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    this.assertTimeRange(
      dto.startTime ?? current.startTime,
      dto.endTime ?? current.endTime,
    );
    await this.assertCategoryBelongsToUser(userId, dto.categoryId);

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        date: dto.date ? toDateColumn(dto.date) : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: dto.status,
        priority: dto.priority,
        completedAt: this.resolveCompletedAt(current.status, dto.status),
      },
      omit: omitOwner,
    });

    return this.toResponse(task);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.task.delete({ where: { id } });
  }

  private toResponse<T extends { date: Date }>(task: T) {
    return { ...task, date: task.date.toISOString().slice(0, 10) };
  }

  private buildDateRange(
    filters: TaskFiltersDto,
  ): Prisma.DateTimeFilter | undefined {
    if (!filters.from && !filters.to) {
      return undefined;
    }

    return {
      gte: filters.from ? toDateColumn(filters.from) : undefined,
      lte: filters.to ? toDateColumn(filters.to) : undefined,
    };
  }

  private assertTimeRange(start?: string | null, end?: string | null): void {
    if (end && !start) {
      throw new BadRequestException('Horário final exige um horário inicial');
    }

    if (start && end && end <= start) {
      throw new BadRequestException('Horário final deve ser depois do inicial');
    }
  }

  private async assertCategoryBelongsToUser(
    userId: string,
    categoryId?: string,
  ): Promise<void> {
    if (!categoryId) {
      return;
    }

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }
  }

  private resolveCompletedAt(
    currentStatus: TaskStatus,
    nextStatus?: TaskStatus,
  ): Date | null | undefined {
    if (!nextStatus || nextStatus === currentStatus) {
      return undefined;
    }

    return nextStatus === TaskStatus.DONE ? new Date() : null;
  }
}
