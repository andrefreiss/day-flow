import { Module } from '@nestjs/common';
import { SubtasksController } from './subtasks.controller.js';
import { SubtasksService } from './subtasks.service.js';

@Module({
  controllers: [SubtasksController],
  providers: [SubtasksService],
})
export class SubtasksModule {}
