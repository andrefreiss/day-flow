import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/config/setup.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('Subtasks', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let dono: string[];
  let estranho: string[];
  let tarefaDoDono: string;
  let tarefaDoEstranho: string;
  let subtarefaId: string;

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
  ): Promise<string> {
    const response = await request(server)
      .post('/api/tasks')
      .set('Cookie', cookies)
      .send({ title, date: '2026-09-20' })
      .expect(201);

    return (response.body as { id: string }).id;
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

    dono = await abrirSessao('dono-subtarefas@dayflow.dev');
    estranho = await abrirSessao('estranho-subtarefas@dayflow.dev');
    tarefaDoDono = await criarTarefa(dono, 'Tarefa do dono');
    tarefaDoEstranho = await criarTarefa(estranho, 'Tarefa do estranho');
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('exige sessão', async () => {
    await request(server)
      .get(`/api/tasks/${tarefaDoDono}/subtasks`)
      .expect(401);
  });

  it('começa sem nenhuma subtarefa', async () => {
    const response = await request(server)
      .get(`/api/tasks/${tarefaDoDono}/subtasks`)
      .set('Cookie', dono)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('cria com o estado inicial definido pelo servidor', async () => {
    const response = await request(server)
      .post(`/api/tasks/${tarefaDoDono}/subtasks`)
      .set('Cookie', dono)
      .send({ title: 'Revisar tipos' })
      .expect(201);

    expect(response.body).toMatchObject({
      taskId: tarefaDoDono,
      title: 'Revisar tipos',
      done: false,
    });

    subtarefaId = (response.body as { id: string }).id;
  });

  it('recusa estado inicial enviado pelo cliente', async () => {
    await request(server)
      .post(`/api/tasks/${tarefaDoDono}/subtasks`)
      .set('Cookie', dono)
      .send({ title: 'Estado indevido', done: true })
      .expect(400);
  });

  it('recusa id de tarefa malformado', async () => {
    await request(server)
      .get('/api/tasks/invalido/subtasks')
      .set('Cookie', dono)
      .expect(400);
  });

  it('recusa id de subtarefa malformado', async () => {
    await request(server)
      .get(`/api/tasks/${tarefaDoDono}/subtasks/invalido`)
      .set('Cookie', dono)
      .expect(400);
  });

  it('esconde a tarefa de outro usuário', async () => {
    await request(server)
      .get(`/api/tasks/${tarefaDoEstranho}/subtasks`)
      .set('Cookie', dono)
      .expect(404);
  });

  it('impede criar na tarefa de outro usuário', async () => {
    await request(server)
      .post(`/api/tasks/${tarefaDoEstranho}/subtasks`)
      .set('Cookie', dono)
      .send({ title: 'Subtarefa indevida' })
      .expect(404);
  });

  it('lista as subtarefas da própria tarefa', async () => {
    const response = await request(server)
      .get(`/api/tasks/${tarefaDoDono}/subtasks`)
      .set('Cookie', dono)
      .expect(200);

    const subtarefas = response.body as {
      id: string;
      title: string;
    }[];

    expect(subtarefas).toHaveLength(1);
    expect(subtarefas[0]).toMatchObject({
      id: subtarefaId,
      title: 'Revisar tipos',
    });
  });

  it('atualiza apenas o campo enviado', async () => {
    const response = await request(server)
      .patch(`/api/tasks/${tarefaDoDono}/subtasks/${subtarefaId}`)
      .set('Cookie', dono)
      .send({ done: true })
      .expect(200);

    expect(response.body).toMatchObject({
      title: 'Revisar tipos',
      done: true,
    });
  });

  it('esconde a subtarefa de outro usuário', async () => {
    await request(server)
      .get(`/api/tasks/${tarefaDoDono}/subtasks/${subtarefaId}`)
      .set('Cookie', estranho)
      .expect(404);
  });

  it('impede outro usuário de alterar', async () => {
    await request(server)
      .patch(`/api/tasks/${tarefaDoDono}/subtasks/${subtarefaId}`)
      .set('Cookie', estranho)
      .send({ done: false })
      .expect(404);
  });

  it('impede outro usuário de remover', async () => {
    await request(server)
      .delete(`/api/tasks/${tarefaDoDono}/subtasks/${subtarefaId}`)
      .set('Cookie', estranho)
      .expect(404);
  });

  it('remove a própria subtarefa', async () => {
    await request(server)
      .delete(`/api/tasks/${tarefaDoDono}/subtasks/${subtarefaId}`)
      .set('Cookie', dono)
      .expect(204);

    await request(server)
      .get(`/api/tasks/${tarefaDoDono}/subtasks/${subtarefaId}`)
      .set('Cookie', dono)
      .expect(404);
  });

  it('remove as subtarefas junto com a tarefa', async () => {
    const taskId = await criarTarefa(dono, 'Tarefa descartável');
    const subtask = await request(server)
      .post(`/api/tasks/${taskId}/subtasks`)
      .set('Cookie', dono)
      .send({ title: 'Subtarefa descartável' })
      .expect(201);

    const id = (subtask.body as { id: string }).id;

    await request(server)
      .delete(`/api/tasks/${taskId}`)
      .set('Cookie', dono)
      .expect(204);

    expect(await prisma.subtask.findUnique({ where: { id } })).toBeNull();
  });
});
