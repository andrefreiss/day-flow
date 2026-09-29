import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { startOfWeek } from '../../lib/date.ts';
import { getTasksInRange, type Task } from '../tasks/tasks-api.ts';
import { WeekCalendar } from './week-calendar.tsx';

vi.mock('../tasks/tasks-api.ts', () => ({
  getTasksInRange: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-id',
    title: 'Estudar TypeScript',
    date: '2027-01-01',
    description: null,
    categoryId: null,
    startTime: '09:00',
    endTime: '10:00',
    priority: 'MEDIUM',
    status: 'PENDING',
    completedAt: null,
    createdAt: '2026-12-27T12:00:00.000Z',
    updatedAt: '2026-12-27T12:00:00.000Z',
    ...overrides,
  };
}

function Calendar() {
  const [date, setDate] = useState('2027-01-01');

  return (
    <WeekCalendar
      key={startOfWeek(date)}
      week={startOfWeek(date)}
      selectedDate={date}
      onSelectDate={setDate}
      refreshKey={0}
    />
  );
}

describe('WeekCalendar', () => {
  it('agrupa tarefas na data local e mostra horários e conclusão na virada do ano', async () => {
    vi.mocked(getTasksInRange).mockResolvedValue([
      task(),
      task({
        id: 'completed',
        title: 'Planejar a semana',
        status: 'DONE',
        startTime: null,
        endTime: null,
      }),
      task({ id: 'saturday', date: '2027-01-02', title: 'Revisar exercícios' }),
    ]);
    render(<Calendar />);

    await screen.findByText('Estudar TypeScript');
    expect(getTasksInRange).toHaveBeenCalledWith('2026-12-27', '2027-01-02');
    const friday = within(
      screen.getByRole('region', { name: 'sexta-feira, 1 de janeiro de 2027' }),
    );
    expect(friday.getByText('09:00 – 10:00')).toBeTruthy();
    expect(friday.getByText('Sem horário')).toBeTruthy();
    expect(friday.getByText('1/2 concluídas')).toBeTruthy();
    expect(friday.getByText('Concluída')).toBeTruthy();
    expect(friday.queryByText('Revisar exercícios')).toBeNull();
    expect(screen.getAllByText('Sem tarefas')).toHaveLength(5);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Selecionar sábado, 2 de janeiro de 2027',
      }),
    );
    expect(
      screen
        .getByRole('button', {
          name: 'Selecionar sábado, 2 de janeiro de 2027',
        })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(getTasksInRange).toHaveBeenCalledTimes(1);
  });

  it('preserva o dia da semana ao navegar e ignora respostas da semana anterior', async () => {
    let resolvePrevious!: (tasks: Task[]) => void;
    const previousRequest = new Promise<Task[]>((resolve) => {
      resolvePrevious = resolve;
    });
    vi.mocked(getTasksInRange)
      .mockReturnValueOnce(previousRequest)
      .mockResolvedValueOnce([
        task({ date: '2027-01-08', title: 'Tarefa da próxima semana' }),
      ]);
    render(<Calendar />);
    expect(screen.queryByText('Sem tarefas')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Próxima semana' }));
    await screen.findByText('Tarefa da próxima semana');
    expect(getTasksInRange).toHaveBeenLastCalledWith(
      '2027-01-03',
      '2027-01-09',
    );
    expect(
      screen
        .getByRole('button', {
          name: 'Selecionar sexta-feira, 8 de janeiro de 2027',
        })
        .getAttribute('aria-pressed'),
    ).toBe('true');

    await act(async () => {
      resolvePrevious([task()]);
      await previousRequest;
    });
    expect(screen.queryByText('Estudar TypeScript')).toBeNull();
    expect(screen.getByText('Tarefa da próxima semana')).toBeTruthy();

    vi.mocked(getTasksInRange).mockResolvedValue([]);
    fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }));
    await screen.findAllByText('Sem tarefas');
    expect(getTasksInRange).toHaveBeenLastCalledWith(
      '2026-12-27',
      '2027-01-02',
    );
  });

  it('atualiza o resumo quando uma tarefa muda', async () => {
    vi.mocked(getTasksInRange)
      .mockResolvedValueOnce([task()])
      .mockResolvedValueOnce([task({ status: 'DONE' })]);
    const props = {
      week: '2026-12-27',
      selectedDate: '2027-01-01',
      onSelectDate: vi.fn(),
    };
    const { rerender } = render(<WeekCalendar {...props} refreshKey={0} />);
    await screen.findByText('0/1 concluídas');
    rerender(<WeekCalendar {...props} refreshKey={1} />);
    expect(await screen.findByText('1/1 concluídas')).toBeTruthy();
  });

  it('mostra a falha sem afirmar que não há tarefas e permite tentar novamente', async () => {
    vi.mocked(getTasksInRange)
      .mockRejectedValueOnce(new Error('Falha de conexão'))
      .mockResolvedValueOnce([]);
    render(<Calendar />);
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Falha de conexão',
    );
    expect(screen.queryByText('Sem tarefas')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findAllByText('Sem tarefas')).toHaveLength(7);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
