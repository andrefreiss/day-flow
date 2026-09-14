import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service.js';
import { isUniqueViolation } from '../../database/prisma-errors.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const publicFields = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: this.normalizeEmail(dto.email),
          name: dto.name.trim(),
          passwordHash: await argon2.hash(dto.password),
        },
        select: publicFields,
      });

      return { user, token: await this.signToken(user.id) };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Email já cadastrado');
      }
      {
        throw new ConflictException('Email já cadastrado');
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(dto.email) },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token: await this.signToken(user.id),
    };
  }

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicFields,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private signToken(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }
}
