import { apiFetch } from '../../lib/api.ts';

export type Subtask = {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateSubtaskInput = {
  title?: string;
  done?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSubtask(value: unknown): value is Subtask {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.taskId === 'string' &&
    typeof value.title === 'string' &&
    typeof value.done === 'boolean' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isSubtaskList(value: unknown): value is Subtask[] {
  return Array.isArray(value) && value.every(isSubtask);
}

function handleSubtaskError(response: Response, fallback: string): never {
  if (response.status === 401) {
    throw new Error('Sua sessão expirou');
  }

  if (response.status === 400) {
    throw new Error('Verifique os dados da subtarefa');
  }

  if (response.status === 404) {
    throw new Error('Tarefa ou subtarefa não encontrada');
  }

  throw new Error(fallback);
}

async function readSubtask(response: Response): Promise<Subtask> {
  const data: unknown = await response.json();

  if (!isSubtask(data)) {
    throw new Error('Resposta inválida do servidor');
  }

  return data;
}

export async function getSubtasks(taskId: string): Promise<Subtask[]> {
  const response = await apiFetch(
    `/tasks/${encodeURIComponent(taskId)}/subtasks`,
  );

  if (!response.ok) {
    handleSubtaskError(response, 'Não foi possível carregar as subtarefas');
  }

  const data: unknown = await response.json();

  if (!isSubtaskList(data)) {
    throw new Error('Resposta inválida do servidor');
  }

  return data;
}

export async function createSubtask(
  taskId: string,
  title: string,
): Promise<Subtask> {
  const response = await apiFetch(
    `/tasks/${encodeURIComponent(taskId)}/subtasks`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    },
  );

  if (!response.ok) {
    handleSubtaskError(response, 'Não foi possível criar a subtarefa');
  }

  return readSubtask(response);
}

export async function updateSubtask(
  taskId: string,
  id: string,
  input: UpdateSubtaskInput,
): Promise<Subtask> {
  const response = await apiFetch(
    `/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    handleSubtaskError(response, 'Não foi possível atualizar a subtarefa');
  }

  return readSubtask(response);
}

export async function deleteSubtask(taskId: string, id: string): Promise<void> {
  const response = await apiFetch(
    `/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );

  if (!response.ok) {
    handleSubtaskError(response, 'Não foi possível excluir a subtarefa');
  }
}
