import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user.decorator.js';
import { CreateSubtaskDto } from './dto/create-subtask.dto.js';
import { UpdateSubtaskDto } from './dto/update-subtask.dto.js';
import { SubtasksService } from './subtasks.service.js';

@Controller('tasks/:taskId/subtasks')
export class SubtasksController {
  constructor(private readonly subtasks: SubtasksService) {}

  @Get()
  findAll(
    @CurrentUserId() userId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.subtasks.findAll(userId, taskId);
  }

  @Get(':id')
  findOne(
    @CurrentUserId() userId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.subtasks.findOne(userId, taskId, id);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.subtasks.create(userId, taskId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.subtasks.update(userId, taskId, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @CurrentUserId() userId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.subtasks.remove(userId, taskId, id);
  }
}
