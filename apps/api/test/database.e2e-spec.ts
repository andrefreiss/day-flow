import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('Database', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde a uma consulta', async () => {
    const resultado = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;

    expect(resultado).toEqual([{ ok: 1 }]);
  });

  it('enxerga a tabela de usuários', async () => {
    await expect(prisma.user.count()).resolves.toBe(0);
  });
});
