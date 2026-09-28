import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { getCategories } from '../features/categories/categories-api.ts';
import {
  createTask,
  getTasks,
  getTasksInRange,
  updateTaskStatus,
  type Task,
} from '../features/tasks/tasks-api.ts';
import { CalendarPage } from './calendar-page.tsx';

vi.mock('../features/categories/categories-api.ts', () => ({
  getCategories: vi.fn(),
}));
vi.mock('../features/tasks/tasks-api.ts', () => ({
  getTasks: vi.fn(),
  getTasksInRange: vi.fn(),
  createTask: vi.fn(),
  updateTaskStatus: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('CalendarPage', () => {
  it('mantém a data selecionada ao alternar mês, semana e dia', async () => {
    vi.mocked(getCategories).mockResolvedValue([]);
    vi.mocked(getTasks).mockResolvedValue([]);
    vi.mocked(getTasksInRange).mockResolvedValue([]);
    render(<CalendarPage />);
    fireEvent.change(screen.getByLabelText('Escolher data'), {
      target: { value: '2027-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));
    await screen.findAllByText('Sem tarefas');
    expect(getTasksInRange).toHaveBeenLastCalledWith(
      '2026-12-27',
      '2027-01-02',
    );
    fireEvent.change(screen.getByLabelText('Filtrar por status'), {
      target: { value: 'DONE' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Selecionar sábado, 2 de janeiro de 2027',
      }),
    );
    await waitFor(() =>
      expect(getTasks).toHaveBeenLastCalledWith('2027-01-02'),
    );
    expect(
      screen.getByLabelText<HTMLSelectElement>('Filtrar por status').value,
    ).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Dia' }));
    expect(
      screen.queryByRole('region', { name: 'Calendário semanal' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Dia' }).getAttribute('aria-pressed'),
    ).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Mês' }));
    await waitFor(() =>
      expect(getTasksInRange).toHaveBeenLastCalledWith(
        '2027-01-01',
        '2027-01-31',
      ),
    );
    expect(
      screen
        .getByRole('button', { name: '2 de janeiro de 2027' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('cria na data escolhida e atualiza semana e lista ao concluir uma tarefa', async () => {
    vi.mocked(getCategories).mockResolvedValue([]);
    vi.mocked(getTasks).mockResolvedValue([]);
    vi.mocked(getTasksInRange).mockResolvedValue([]);
    render(<CalendarPage />);
    fireEvent.change(screen.getByLabelText('Escolher data'), {
      target: { value: '2027-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));
    await screen.findAllByText('Sem tarefas');

    const task: Task = {
      id: 'task-id',
      title: 'Estudar React',
      date: '2027-01-01',
      description: null,
      categoryId: null,
      startTime: null,
      endTime: null,
      status: 'PENDING',
      priority: 'MEDIUM',
      completedAt: null,
      createdAt: '2027-01-01T12:00:00.000Z',
      updatedAt: '2027-01-01T12:00:00.000Z',
    };
    vi.mocked(createTask).mockResolvedValue(task);
    vi.mocked(getTasks).mockResolvedValue([task]);
    vi.mocked(getTasksInRange).mockResolvedValue([task]);
    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'Estudar React' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar tarefa' }));
    const week = within(
      screen.getByRole('region', { name: 'Calendário semanal' }),
    );
    await week.findByText('0/1 concluídas');
    fireEvent.change(screen.getByLabelText('Filtrar por prioridade'), {
      target: { value: 'LOW' },
    });
    expect(screen.getByText('Tarefas exibidas: 0 de 1.')).toBeTruthy();
    expect(week.getByText('Estudar React')).toBeTruthy();
    expect(week.getByText('0/1 concluídas')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Estudar React', date: '2027-01-01' }),
    );

    const completed: Task = {
      ...task,
      status: 'DONE',
      completedAt: '2027-01-01T13:00:00.000Z',
    };
    vi.mocked(updateTaskStatus).mockResolvedValue(completed);
    vi.mocked(getTasks).mockResolvedValue([completed]);
    vi.mocked(getTasksInRange).mockResolvedValue([completed]);
    fireEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
    await week.findByText('1/1 concluídas');
    expect(await screen.findByRole('button', { name: 'Reabrir' })).toBeTruthy();
    expect(updateTaskStatus).toHaveBeenCalledWith('task-id', 'DONE');
  });
});
