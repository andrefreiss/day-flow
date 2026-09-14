import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { isUniqueViolation } from '../../database/prisma-errors.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

const omitOwner = { userId: true };

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      omit: omitOwner,
    });
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
      omit: omitOwner,
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return category;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: { userId, name: dto.name.trim(), color: dto.color },
        omit: omitOwner,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Já existe uma categoria com esse nome');
      }

      throw error;
    }
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOne(userId, id);

    try {
      return await this.prisma.category.update({
        where: { id },
        data: { name: dto.name?.trim(), color: dto.color },
        omit: omitOwner,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Já existe uma categoria com esse nome');
      }

      throw error;
    }
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.category.delete({ where: { id } });
  }
}
