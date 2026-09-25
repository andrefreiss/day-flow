import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { getTasksInRange, type Task } from '../tasks/tasks-api.ts';
import { MonthCalendar } from './month-calendar.tsx';

vi.mock('../tasks/tasks-api.ts', () => ({
  getTasksInRange: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function createTask(id: string, status: Task['status']): Task {
  return {
    id,
    categoryId: null,
    title: `Tarefa ${id}`,
    description: null,
    date: '2026-09-25T00:00:00.000Z',
    startTime: null,
    endTime: null,
    status,
    priority: 'MEDIUM',
    completedAt: status === 'DONE' ? '2026-09-25T12:00:00.000Z' : null,
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-09-25T10:00:00.000Z',
  };
}

describe('MonthCalendar', () => {
  it('carrega e apresenta a quantidade de tarefas do mês', async () => {
    vi.mocked(getTasksInRange).mockResolvedValue([
      createTask('1', 'DONE'),
      createTask('2', 'PENDING'),
    ]);

    render(
      <MonthCalendar
        month="2026-09-01"
        onMonthChange={vi.fn()}
        onSelectDate={vi.fn()}
        refreshKey={0}
        selectedDate="2026-09-25"
      />,
    );

    await waitFor(() => {
      expect(getTasksInRange).toHaveBeenCalledWith('2026-09-01', '2026-09-30');
    });

    expect(screen.getByText('1/2', { exact: false })).toBeTruthy();
    const selectedDay = screen.getByRole('button', {
      name: '25 de setembro de 2026, 2 tarefas',
    });

    expect(selectedDay.getAttribute('aria-pressed')).toBe('true');
  });

  it('seleciona um dia e permite navegar entre os meses', async () => {
    vi.mocked(getTasksInRange).mockResolvedValue([]);
    const onSelectDate = vi.fn<(date: string) => void>();
    const onMonthChange = vi.fn<(month: string) => void>();

    render(
      <MonthCalendar
        month="2026-09-01"
        onMonthChange={onMonthChange}
        onSelectDate={onSelectDate}
        refreshKey={0}
        selectedDate="2026-09-25"
      />,
    );

    await waitFor(() => {
      expect(getTasksInRange).toHaveBeenCalled();
    });

    fireEvent.click(
      screen.getByRole('button', { name: '26 de setembro de 2026' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }));

    expect(onSelectDate).toHaveBeenCalledWith('2026-09-26');
    expect(onMonthChange).toHaveBeenCalledWith('2026-08-01');
  });
});
