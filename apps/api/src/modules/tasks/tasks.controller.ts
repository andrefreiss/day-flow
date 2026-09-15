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
  Query,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user.decorator.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { TaskFiltersDto } from './dto/task-filters.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  findAll(@CurrentUserId() userId: string, @Query() filters: TaskFiltersDto) {
    return this.tasks.findAll(userId, filters);
  }

  @Get(':id')
  findOne(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.findOne(userId, id);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateTaskDto) {
    return this.tasks.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(userId, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.remove(userId, id);
  }
}
