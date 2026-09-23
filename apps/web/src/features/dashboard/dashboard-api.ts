import { apiFetch } from '../../lib/api.ts';

export type DashboardSummary = {
  date: string;
  today: {
    total: number;
    completed: number;
    pending: number;
  };
  overdue: number;
  upcoming: number;
  progress: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isDashboardSummary(value: unknown): value is DashboardSummary {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    isRecord(value.today) &&
    isNonNegativeInteger(value.today.total) &&
    isNonNegativeInteger(value.today.completed) &&
    isNonNegativeInteger(value.today.pending) &&
    isNonNegativeInteger(value.overdue) &&
    isNonNegativeInteger(value.upcoming) &&
    isNonNegativeInteger(value.progress) &&
    value.progress <= 100
  );
}

export async function getDashboard(date: string): Promise<DashboardSummary> {
  const query = new URLSearchParams({ date });
  const response = await apiFetch(`/dashboard?${query.toString()}`);

  if (response.status === 401) {
    throw new Error('Sua sessão expirou');
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar o resumo do dia');
  }

  const data: unknown = await response.json();

  if (!isDashboardSummary(data)) {
    throw new Error('Resposta inválida do servidor');
  }

  return data;
}
