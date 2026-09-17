import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateSubtaskDto } from './dto/create-subtask.dto.js';
import { UpdateSubtaskDto } from './dto/update-subtask.dto.js';

@Injectable()
export class SubtasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, taskId: string) {
    await this.assertTaskBelongsToUser(userId, taskId);

    return this.prisma.subtask.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, taskId: string, id: string) {
    await this.assertTaskBelongsToUser(userId, taskId);

    const subtask = await this.prisma.subtask.findFirst({
      where: { id, taskId },
    });

    if (!subtask) {
      throw new NotFoundException('Subtarefa não encontrada');
    }

    return subtask;
  }

  async create(userId: string, taskId: string, dto: CreateSubtaskDto) {
    await this.assertTaskBelongsToUser(userId, taskId);

    return this.prisma.subtask.create({
      data: { taskId, title: dto.title.trim() },
    });
  }

  async update(
    userId: string,
    taskId: string,
    id: string,
    dto: UpdateSubtaskDto,
  ) {
    await this.findOne(userId, taskId, id);

    return this.prisma.subtask.update({
      where: { id },
      data: { title: dto.title?.trim(), done: dto.done },
    });
  }

  async remove(userId: string, taskId: string, id: string) {
    await this.findOne(userId, taskId, id);

    await this.prisma.subtask.delete({ where: { id } });
  }

  private async assertTaskBelongsToUser(
    userId: string,
    taskId: string,
  ): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
  }
}
