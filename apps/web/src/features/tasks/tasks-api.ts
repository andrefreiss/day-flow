import { apiFetch } from '../../lib/api.ts';

export type TaskStatus = 'PENDING' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type Task = {
  id: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  priority: TaskPriority;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'PENDING' || value === 'DONE';
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH';
}

function isTask(value: unknown): value is Task {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isNullableString(value.categoryId) &&
    typeof value.title === 'string' &&
    isNullableString(value.description) &&
    typeof value.date === 'string' &&
    isNullableString(value.startTime) &&
    isNullableString(value.endTime) &&
    isTaskStatus(value.status) &&
    isTaskPriority(value.priority) &&
    isNullableString(value.completedAt) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isTaskList(value: unknown): value is Task[] {
  return Array.isArray(value) && value.every(isTask);
}

export async function getTasks(date: string): Promise<Task[]> {
  const query = new URLSearchParams({
    from: date,
    to: date,
  });

  const response = await apiFetch(`/tasks?${query.toString()}`);

  if (response.status === 401) {
    throw new Error('Sua sessão expirou');
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar as tarefas');
  }

  const data: unknown = await response.json();

  if (!isTaskList(data)) {
    throw new Error('Resposta inválida do servidor');
  }

  return data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await apiFetch('/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (response.status === 401) {
    throw new Error('Sua sessão expirou');
  }

  if (response.status === 400) {
    throw new Error('Verifique os dados da tarefa');
  }

  if (!response.ok) {
    throw new Error('Não foi possível criar a tarefa');
  }

  const data: unknown = await response.json();

  if (!isTask(data)) {
    throw new Error('Resposta inválida do servidor');
  }

  return data;
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<Task> {
  const response = await apiFetch(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (response.status === 401) {
    throw new Error('Sua sessão expirou');
  }

  if (response.status === 404) {
    throw new Error('Tarefa não encontrada');
  }

  if (!response.ok) {
    throw new Error('Não foi possível atualizar a tarefa');
  }

  const data: unknown = await response.json();

  if (!isTask(data)) {
    throw new Error('Resposta inválida do servidor');
  }

  return data;
}
