import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/config/setup.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('Tasks', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let dono: string[];
  let estranho: string[];
  let categoriaDoDono: string;
  let categoriaDoEstranho: string;
  let tarefaId: string;

  async function abrirSessao(email: string): Promise<string[]> {
    const response = await request(server)
      .post('/api/auth/register')
      .send({ email, name: 'Teste', password: 'senha-bem-comprida' })
      .expect(201);

    return response.headers['set-cookie'] as unknown as string[];
  }

  async function criarCategoria(cookies: string[]): Promise<string> {
    const response = await request(server)
      .post('/api/categories')
      .set('Cookie', cookies)
      .send({ name: 'Estudos', color: '#3b82f6' })
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

    dono = await abrirSessao('dono@dayflow.dev');
    estranho = await abrirSessao('estranho@dayflow.dev');
    categoriaDoDono = await criarCategoria(dono);
    categoriaDoEstranho = await criarCategoria(estranho);
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('exige sessão', async () => {
    await request(server).get('/api/tasks').expect(401);
  });

  it('cria com os padrões do servidor e devolve a data sem fuso', async () => {
    const response = await request(server)
      .post('/api/tasks')
      .set('Cookie', dono)
      .send({ title: 'Estudar generics', date: '2026-09-20' })
      .expect(201);

    expect(response.body).toMatchObject({
      title: 'Estudar generics',
      date: '2026-09-20',
      status: 'PENDING',
      priority: 'MEDIUM',
      completedAt: null,
    });
    expect(response.body).not.toHaveProperty('userId');

    tarefaId = (response.body as { id: string }).id;
  });

  it('recusa horário final sem inicial', async () => {
    await request(server)
      .post('/api/tasks')
      .set('Cookie', dono)
      .send({ title: 'Academia', date: '2026-09-21', endTime: '08:00' })
      .expect(400);
  });

  it('recusa horário final anterior ao inicial', async () => {
    await request(server)
      .post('/api/tasks')
      .set('Cookie', dono)
      .send({
        title: 'Academia',
        date: '2026-09-21',
        startTime: '08:00',
        endTime: '07:00',
      })
      .expect(400);
  });

  it('recusa horário fora do formato', async () => {
    await request(server)
      .post('/api/tasks')
      .set('Cookie', dono)
      .send({ title: 'Academia', date: '2026-09-21', startTime: '25:00' })
      .expect(400);
  });

  it('aceita a própria categoria', async () => {
    await request(server)
      .post('/api/tasks')
      .set('Cookie', dono)
      .send({
        title: 'Revisar interfaces',
        date: '2026-09-25',
        startTime: '09:00',
        endTime: '10:30',
        priority: 'HIGH',
        categoryId: categoriaDoDono,
      })
      .expect(201);
  });

  it('limpa campos opcionais com null', async () => {
    const criada = await request(server)
      .post('/api/tasks')
      .set('Cookie', dono)
      .send({
        title: 'Planejar apresentação',
        description: 'Preparar roteiro',
        date: '2026-09-22',
        startTime: '14:00',
        endTime: '15:00',
        categoryId: categoriaDoDono,
      })
      .expect(201);

    const id = (criada.body as { id: string }).id;

    const response = await request(server)
      .patch(`/api/tasks/${id}`)
      .set('Cookie', dono)
      .send({
        description: null,
        startTime: null,
        endTime: null,
        categoryId: null,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      description: null,
      startTime: null,
      endTime: null,
      categoryId: null,
    });
  });

  it('recusa a categoria de outro usuário', async () => {
    await request(server)
      .post('/api/tasks')
      .set('Cookie', dono)
      .send({
        title: 'Roubo de categoria',
        date: '2026-09-25',
        categoryId: categoriaDoEstranho,
      })
      .expect(404);
  });

  it('filtra por intervalo de datas', async () => {
    const response = await request(server)
      .get('/api/tasks?from=2026-09-24&to=2026-09-26')
      .set('Cookie', dono)
      .expect(200);

    const tarefas = response.body as { title: string }[];

    expect(tarefas).toHaveLength(1);
    expect(tarefas[0]?.title).toBe('Revisar interfaces');
  });

  it('recusa filtro desconhecido', async () => {
    await request(server)
      .get('/api/tasks?statuss=DONE')
      .set('Cookie', dono)
      .expect(400);
  });

  it('conclui e marca o instante', async () => {
    const response = await request(server)
      .patch(`/api/tasks/${tarefaId}`)
      .set('Cookie', dono)
      .send({ status: 'DONE' })
      .expect(200);

    const tarefa = response.body as { completedAt: string | null };

    expect(tarefa.completedAt).not.toBeNull();
  });

  it('filtra por status', async () => {
    const response = await request(server)
      .get('/api/tasks?status=DONE')
      .set('Cookie', dono)
      .expect(200);

    expect(response.body).toHaveLength(1);
  });

  it('não mexe na conclusão ao editar outro campo', async () => {
    const antes = await request(server)
      .get(`/api/tasks/${tarefaId}`)
      .set('Cookie', dono)
      .expect(200);

    const depois = await request(server)
      .patch(`/api/tasks/${tarefaId}`)
      .set('Cookie', dono)
      .send({ title: 'Estudar generics a fundo' })
      .expect(200);

    const original = antes.body as { completedAt: string | null };
    const atualizado = depois.body as {
      completedAt: string | null;
      title: string;
    };

    expect(atualizado.title).toBe('Estudar generics a fundo');
    expect(atualizado.completedAt).toBe(original.completedAt);
  });

  it('reabre e limpa a conclusão', async () => {
    const response = await request(server)
      .patch(`/api/tasks/${tarefaId}`)
      .set('Cookie', dono)
      .send({ status: 'PENDING' })
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'PENDING',
      completedAt: null,
    });
  });

  it('esconde a tarefa de outro usuário', async () => {
    await request(server)
      .get(`/api/tasks/${tarefaId}`)
      .set('Cookie', estranho)
      .expect(404);
  });

  it('impede outro usuário de apagar', async () => {
    await request(server)
      .delete(`/api/tasks/${tarefaId}`)
      .set('Cookie', estranho)
      .expect(404);
  });

  it('remove a própria tarefa', async () => {
    await request(server)
      .delete(`/api/tasks/${tarefaId}`)
      .set('Cookie', dono)
      .expect(204);

    await request(server)
      .get(`/api/tasks/${tarefaId}`)
      .set('Cookie', dono)
      .expect(404);
  });
});
