import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/config/setup.js';
import { PrismaService } from '../src/database/prisma.service.js';

const credenciais = {
  email: 'maria@dayflow.dev',
  name: 'Maria',
  password: 'senha-bem-comprida',
};

describe('Auth', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('cadastra um usuário e devolve o cookie de sessão', async () => {
    const response = await request(server)
      .post('/api/auth/register')
      .send(credenciais);

    const body = response.body as Record<string, unknown>;
    const cookies = response.headers['set-cookie'] as unknown as string[];

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      email: credenciais.email,
      name: credenciais.name,
    });
    expect(body).not.toHaveProperty('passwordHash');
    expect(cookies[0]).toContain('access_token=');
    expect(cookies[0]).toContain('HttpOnly');
  });

  it('recusa email já cadastrado, ignorando maiúsculas', async () => {
    await request(server)
      .post('/api/auth/register')
      .send({ ...credenciais, email: credenciais.email.toUpperCase() })
      .expect(409);
  });

  it('recusa campo que não existe no contrato', async () => {
    await request(server)
      .post('/api/auth/register')
      .send({ ...credenciais, email: 'outro@dayflow.dev', admin: true })
      .expect(400);
  });

  it('responde igual para senha errada e email inexistente', async () => {
    const senhaErrada = await request(server)
      .post('/api/auth/login')
      .send({ email: credenciais.email, password: 'errada' });

    const emailInexistente = await request(server)
      .post('/api/auth/login')
      .send({ email: 'ninguem@dayflow.dev', password: 'errada' });

    expect(senhaErrada.status).toBe(401);
    expect(emailInexistente.status).toBe(401);
    expect(senhaErrada.body).toEqual(emailInexistente.body);
  });

  it('bloqueia rota protegida sem cookie', async () => {
    await request(server).get('/api/auth/me').expect(401);
  });

  it('devolve o usuário autenticado a partir do cookie', async () => {
    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: credenciais.email, password: credenciais.password })
      .expect(200);

    const cookies = login.headers['set-cookie'] as unknown as string[];

    const response = await request(server)
      .get('/api/auth/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(response.body).toMatchObject({ email: credenciais.email });
  });

  it('invalida a sessão no logout', async () => {
    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: credenciais.email, password: credenciais.password })
      .expect(200);

    const cookies = login.headers['set-cookie'] as unknown as string[];

    const logout = await request(server)
      .post('/api/auth/logout')
      .set('Cookie', cookies)
      .expect(204);

    const derrubado = logout.headers['set-cookie'] as unknown as string[];

    await request(server)
      .get('/api/auth/me')
      .set('Cookie', derrubado)
      .expect(401);
  });
});
