import { apiFetch } from '../../lib/api.ts';

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  password: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string' &&
    typeof value.createdAt === 'string'
  );
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Email ou senha inválidos');
    }

    throw new Error('Não foi possível entrar. Tente novamente.');
  }

  const data: unknown = await response.json();

  if (!isUser(data)) {
    throw new Error('Resposta inválida do servidor');
  }

  return data;
}

export async function register(
  credentials: RegisterCredentials,
): Promise<User> {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('Este email já está cadastrado');
    }

    if (response.status === 400) {
      throw new Error('Verifique os dados informados');
    }

    throw new Error('Não foi possível criar sua conta. Tente novamente.');
  }

  const data: unknown = await response.json();

  if (!isUser(data)) {
    throw new Error('Resposta inválida do servidor');
  }

  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  const response = await apiFetch('/auth/me');

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Não foi possível verificar sua sessão.');
  }

  const data: unknown = await response.json();

  if (!isUser(data)) {
    throw new Error('Resposta inválida do servidor');
  }

  return data;
}

export async function logout(): Promise<void> {
  const response = await apiFetch('/auth/logout', { method: 'POST' });

  if (!response.ok) {
    throw new Error('Não foi possível sair. Tente novamente.');
  }
}
