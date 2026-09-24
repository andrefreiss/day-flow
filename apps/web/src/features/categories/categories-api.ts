import { apiFetch } from '../../lib/api.ts';

export type Category = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveCategoryInput = {
  name: string;
  color: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isCategoryList(value: unknown): value is Category[] {
  return Array.isArray(value) && value.every(isCategory);
}

async function readCategory(response: Response): Promise<Category> {
  const data: unknown = await response.json();

  if (!isCategory(data)) {
    throw new Error('Resposta inválida do servidor');
  }

  return data;
}

function handleCategoryError(response: Response, fallback: string): never {
  if (response.status === 401) {
    throw new Error('Sua sessão expirou');
  }

  if (response.status === 400) {
    throw new Error('Verifique os dados da categoria');
  }

  if (response.status === 404) {
    throw new Error('Categoria não encontrada');
  }

  if (response.status === 409) {
    throw new Error('Já existe uma categoria com esse nome');
  }

  throw new Error(fallback);
}

export async function getCategories(): Promise<Category[]> {
  const response = await apiFetch('/categories');

  if (!response.ok) {
    handleCategoryError(response, 'Não foi possível carregar as categorias');
  }

  const data: unknown = await response.json();

  if (!isCategoryList(data)) {
    throw new Error('Resposta inválida do servidor');
  }

  return data;
}

export async function createCategory(
  input: SaveCategoryInput,
): Promise<Category> {
  const response = await apiFetch('/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    handleCategoryError(response, 'Não foi possível criar a categoria');
  }

  return readCategory(response);
}

export async function updateCategory(
  id: string,
  input: SaveCategoryInput,
): Promise<Category> {
  const response = await apiFetch(`/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    handleCategoryError(response, 'Não foi possível atualizar a categoria');
  }

  return readCategory(response);
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await apiFetch(`/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    handleCategoryError(response, 'Não foi possível excluir a categoria');
  }
}
