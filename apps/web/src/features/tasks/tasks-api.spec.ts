import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTasks } from './tasks-api.ts';

const task = {
  id: 'task-id',
  categoryId: null,
  title: 'Consulta médica',
  description: null,
  date: '2026-09-28',
  startTime: null,
  endTime: null,
  status: 'PENDING',
  priority: 'MEDIUM',
  completedAt: null,
  createdAt: '2026-09-28T10:00:00.000Z',
  updatedAt: '2026-09-28T10:00:00.000Z',
};

function stubTasksResponse(body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json(body, { status: 200 })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getTasks', () => {
  it('aceita a data da tarefa no formato YYYY-MM-DD', async () => {
    stubTasksResponse([task]);

    await expect(getTasks('2026-09-28')).resolves.toEqual([task]);
  });

  it('recusa a data da tarefa enviada como instante', async () => {
    stubTasksResponse([{ ...task, date: '2026-09-28T00:00:00.000Z' }]);

    await expect(getTasks('2026-09-28')).rejects.toThrow(
      'Resposta inválida do servidor',
    );
  });
});
