import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/config/setup.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('Dashboard', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let dono: string[];
  let estranho: string[];

  async function abrirSessao(email: string): Promise<string[]> {
    const response = await request(server)
      .post('/api/auth/register')
      .send({ email, name: 'Teste', password: 'senha-bem-comprida' })
      .expect(201);

    return response.headers['set-cookie'] as unknown as string[];
  }

  async function criarTarefa(
    cookies: string[],
    title: string,
    date: string,
    done = false,
  ): Promise<void> {
    const response = await request(server)
      .post('/api/tasks')
      .set('Cookie', cookies)
      .send({ title, date })
      .expect(201);

    if (!done) {
      return;
    }

    const id = (response.body as { id: string }).id;

    await request(server)
      .patch(`/api/tasks/${id}`)
      .set('Cookie', cookies)
      .send({ status: 'DONE' })
      .expect(200);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();

    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);

    await prisma.user.deleteMany();

    dono = await abrirSessao('dashboard@dayflow.dev');
    estranho = await abrirSessao('outro-dashboard@dayflow.dev');
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('exige sessão', async () => {
    await request(server).get('/api/dashboard?date=2026-09-17').expect(401);
  });

  it('exige uma data de referência', async () => {
    await request(server).get('/api/dashboard').set('Cookie', dono).expect(400);
  });

  it('recusa data fora do formato', async () => {
    await request(server)
      .get('/api/dashboard?date=17-09-2026')
      .set('Cookie', dono)
      .expect(400);
  });

  it('recusa parâmetros desconhecidos', async () => {
    await request(server)
      .get('/api/dashboard?date=2026-09-17&extra=true')
      .set('Cookie', dono)
      .expect(400);
  });

  it('começa com as métricas zeradas', async () => {
    const response = await request(server)
      .get('/api/dashboard?date=2026-09-17')
      .set('Cookie', dono)
      .expect(200);

    expect(response.body).toEqual({
      date: '2026-09-17',
      today: {
        total: 0,
        completed: 0,
        pending: 0,
      },
      overdue: 0,
      upcoming: 0,
      progress: 0,
    });
  });

  it('calcula as métricas pela data e pelo status', async () => {
    await criarTarefa(dono, 'Atrasada pendente', '2026-09-16');
    await criarTarefa(dono, 'Atrasada concluída', '2026-09-16', true);
    await criarTarefa(dono, 'Hoje pendente', '2026-09-17');
    await criarTarefa(dono, 'Hoje concluída', '2026-09-17', true);
    await criarTarefa(dono, 'Futura pendente', '2026-09-18');
    await criarTarefa(dono, 'Futura concluída', '2026-09-18', true);

    const response = await request(server)
      .get('/api/dashboard?date=2026-09-17')
      .set('Cookie', dono)
      .expect(200);

    expect(response.body).toEqual({
      date: '2026-09-17',
      today: {
        total: 2,
        completed: 1,
        pending: 1,
      },
      overdue: 1,
      upcoming: 1,
      progress: 50,
    });
  });

  it('isola as métricas por usuário', async () => {
    await criarTarefa(estranho, 'Tarefa de outro usuário', '2026-09-17');

    const response = await request(server)
      .get('/api/dashboard?date=2026-09-17')
      .set('Cookie', estranho)
      .expect(200);

    expect(response.body).toEqual({
      date: '2026-09-17',
      today: {
        total: 1,
        completed: 0,
        pending: 1,
      },
      overdue: 0,
      upcoming: 0,
      progress: 0,
    });
  });
});
