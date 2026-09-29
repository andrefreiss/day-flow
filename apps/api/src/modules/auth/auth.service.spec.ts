import { ConflictException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AuthService } from './auth.service.js';

const cadastro = {
  email: 'maria@dayflow.dev',
  name: 'Maria',
  password: 'senha-bem-comprida',
};

describe('AuthService', () => {
  const createUser = vi.fn();
  let service: AuthService;

  beforeEach(() => {
    createUser.mockReset();

    const prisma = { user: { create: createUser } } as unknown as PrismaService;
    const jwt = {
      signAsync: vi.fn().mockResolvedValue('token'),
    } as unknown as JwtService;

    service = new AuthService(prisma, jwt);
  });

  it('traduz email duplicado para conflito', async () => {
    createUser.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );

    await expect(service.register(cadastro)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('propaga falhas inesperadas sem disfarçar de conflito', async () => {
    const falha = new Error('conexão recusada');
    createUser.mockRejectedValue(falha);

    await expect(service.register(cadastro)).rejects.toBe(falha);
  });
});
