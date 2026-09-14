import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/config/setup.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('Categories', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let dono: string[];
  let estranho: string[];
  let categoriaId: string;

  async function abrirSessao(email: string): Promise<string[]> {
    const response = await request(server)
      .post('/api/auth/register')
      .send({ email, name: 'Teste', password: 'senha-bem-comprida' })
      .expect(201);

    return response.headers['set-cookie'] as unknown as string[];
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

    dono = await abrirSessao('dono@dayflow.dev');
    estranho = await abrirSessao('estranho@dayflow.dev');
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('exige sessão', async () => {
    await request(server).get('/api/categories').expect(401);
  });

  it('começa sem nenhuma categoria', async () => {
    const response = await request(server)
      .get('/api/categories')
      .set('Cookie', dono)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('cria uma categoria sem expor o dono', async () => {
    const response = await request(server)
      .post('/api/categories')
      .set('Cookie', dono)
      .send({ name: 'Estudos', color: '#3b82f6' })
      .expect(201);

    const body = response.body as { id: string };

    expect(response.body).toMatchObject({
      name: 'Estudos',
      color: '#3b82f6',
    });
    expect(response.body).not.toHaveProperty('userId');

    categoriaId = body.id;
  });

  it('recusa nome repetido do mesmo usuário', async () => {
    await request(server)
      .post('/api/categories')
      .set('Cookie', dono)
      .send({ name: 'Estudos', color: '#ef4444' })
      .expect(409);
  });

  it('aceita o mesmo nome para outro usuário', async () => {
    await request(server)
      .post('/api/categories')
      .set('Cookie', estranho)
      .send({ name: 'Estudos', color: '#ef4444' })
      .expect(201);
  });

  it('recusa cor fora do formato', async () => {
    await request(server)
      .post('/api/categories')
      .set('Cookie', dono)
      .send({ name: 'Academia', color: 'azul' })
      .expect(400);
  });

  it('recusa id malformado', async () => {
    await request(server)
      .get('/api/categories/banana')
      .set('Cookie', dono)
      .expect(400);
  });

  it('esconde a categoria de outro usuário', async () => {
    await request(server)
      .get(`/api/categories/${categoriaId}`)
      .set('Cookie', estranho)
      .expect(404);
  });

  it('impede outro usuário de alterar', async () => {
    await request(server)
      .patch(`/api/categories/${categoriaId}`)
      .set('Cookie', estranho)
      .send({ color: '#000000' })
      .expect(404);
  });

  it('atualiza apenas o campo enviado', async () => {
    const response = await request(server)
      .patch(`/api/categories/${categoriaId}`)
      .set('Cookie', dono)
      .send({ color: '#10b981' })
      .expect(200);

    expect(response.body).toMatchObject({
      name: 'Estudos',
      color: '#10b981',
    });
  });

  it('remove e some da listagem', async () => {
    await request(server)
      .delete(`/api/categories/${categoriaId}`)
      .set('Cookie', dono)
      .expect(204);

    const response = await request(server)
      .get('/api/categories')
      .set('Cookie', dono)
      .expect(200);

    expect(response.body).toEqual([]);
  });
});
