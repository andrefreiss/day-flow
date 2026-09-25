export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseLocalDate(value: string): Date {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  return new Date(year, month - 1, day);
}

export function addDays(value: string, amount: number): string {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + amount);

  return formatLocalDate(date);
}

export function startOfMonth(value: string): string {
  const date = parseLocalDate(value);

  return formatLocalDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonth(value: string): string {
  const date = parseLocalDate(value);

  return formatLocalDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function addMonths(value: string, amount: number): string {
  const date = parseLocalDate(value);

  return formatLocalDate(
    new Date(date.getFullYear(), date.getMonth() + amount, 1),
  );
}

export function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
  }).format(parseLocalDate(value));
}

export function formatMonth(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(parseLocalDate(value));
}
