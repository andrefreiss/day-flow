import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { Category } from '../categories/categories-api.ts';
import { getTasks, updateTaskStatus, type Task } from './tasks-api.ts';
import { TasksList } from './tasks-list.tsx';

vi.mock('./tasks-api.ts', () => ({
  getTasks: vi.fn(),
  updateTaskStatus: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

const categories: Category[] = [
  {
    id: 'work',
    name: 'Trabalho',
    color: '#4f46e5',
    createdAt: '2026-09-28T12:00:00.000Z',
    updatedAt: '2026-09-28T12:00:00.000Z',
  },
];

function task(id: string, title: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title,
    date: '2026-09-28',
    categoryId: null,
    description: null,
    startTime: null,
    endTime: null,
    priority: 'MEDIUM',
    status: 'PENDING',
    completedAt: null,
    createdAt: '2026-09-28T12:00:00.000Z',
    updatedAt: '2026-09-28T12:00:00.000Z',
    ...overrides,
  };
}

const tasks = [
  task('1', 'Reunião de revisão', { categoryId: 'work', priority: 'HIGH' }),
  task('2', 'Preparar apresentação', {
    categoryId: 'work',
    priority: 'HIGH',
    status: 'DONE',
  }),
  task('3', 'Estudar React', {
    description: 'Exercícios de composição',
    priority: 'LOW',
  }),
  task('4', 'Comprar pão'),
];

function TaskList() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <TasksList
      categories={categories}
      date="2026-09-28"
      refreshKey={refreshKey}
      onChanged={() => setRefreshKey((value) => value + 1)}
    />
  );
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function changeFilter(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('TasksList filters', () => {
  it('busca por título e descrição ignorando acentos, espaços externos e maiúsculas sem consultar a API novamente', async () => {
    vi.mocked(getTasks).mockResolvedValue(tasks);
    render(<TaskList />);
    await screen.findByText('Tarefas exibidas: 4 de 4.');
    changeFilter('Buscar tarefas', '  REUNIAO  ');
    expect(screen.getByText('Reunião de revisão')).toBeTruthy();
    expect(screen.queryByText('Estudar React')).toBeNull();
    changeFilter('Buscar tarefas', 'COMPOSICAO');
    expect(screen.getByText('Estudar React')).toBeTruthy();
    expect(screen.queryByText('Reunião de revisão')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe(
      'Tarefas exibidas: 1 de 4.',
    );
    expect(getTasks).toHaveBeenCalledOnce();
  });

  it('combina os quatro filtros e restaura a lista na ordem original ao limpar', async () => {
    vi.mocked(getTasks).mockResolvedValue(tasks);
    render(<TaskList />);
    await screen.findByText('Tarefas exibidas: 4 de 4.');
    changeFilter('Filtrar por categoria', 'work');
    changeFilter('Filtrar por prioridade', 'HIGH');
    changeFilter('Filtrar por status', 'PENDING');
    changeFilter('Buscar tarefas', 'revisao');
    expect(screen.getByText('Reunião de revisão')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText('Preparar apresentação')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByRole('status').textContent).toBe(
      'Tarefas exibidas: 4 de 4.',
    );
    const rows = screen.getAllByRole('listitem');
    tasks.forEach((item, index) =>
      expect(rows[index]?.textContent).toContain(item.title),
    );
    expect(
      screen.getByLabelText<HTMLInputElement>('Buscar tarefas').value,
    ).toBe('');
    expect(
      screen.getByLabelText<HTMLSelectElement>('Filtrar por status').value,
    ).toBe('');
    expect(getTasks).toHaveBeenCalledOnce();
  });

  it('encontra tarefas sem categoria e recupera uma busca sem resultados', async () => {
    vi.mocked(getTasks).mockResolvedValue(tasks);
    render(<TaskList />);
    await screen.findByText('Tarefas exibidas: 4 de 4.');
    changeFilter('Filtrar por categoria', 'uncategorized');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Comprar pão')).toBeTruthy();
    expect(screen.queryByText('Reunião de revisão')).toBeNull();
    changeFilter('Buscar tarefas', 'não existe');
    expect(
      screen.getByText(/Nenhuma tarefa corresponde aos filtros/),
    ).toBeTruthy();
    expect(
      screen.queryByText('Nenhuma tarefa para a data selecionada.'),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('deixa de aplicar uma categoria removida sem ocultar tarefas', async () => {
    vi.mocked(getTasks).mockResolvedValue(tasks);
    const props = { date: '2026-09-28', refreshKey: 0, onChanged: vi.fn() };
    const { rerender } = render(
      <TasksList {...props} categories={categories} />,
    );
    await screen.findByText('Tarefas exibidas: 4 de 4.');
    changeFilter('Filtrar por categoria', 'work');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    rerender(<TasksList {...props} categories={[]} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(
      screen.getByLabelText<HTMLSelectElement>('Filtrar por categoria').value,
    ).toBe('');
  });

  it('mantém os filtros ao concluir e remove a tarefa da lista de pendentes após atualizar', async () => {
    const pending = task('pending', 'Estudar filtros');
    const done: Task = { ...pending, status: 'DONE' };
    vi.mocked(getTasks)
      .mockResolvedValueOnce([pending])
      .mockResolvedValueOnce([done]);
    vi.mocked(updateTaskStatus).mockResolvedValue(done);
    render(<TaskList />);
    await screen.findByText('Estudar filtros');
    changeFilter('Filtrar por status', 'PENDING');
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));
    await screen.findByText(/Nenhuma tarefa corresponde aos filtros/);
    expect(updateTaskStatus).toHaveBeenCalledWith('pending', 'DONE');
    expect(
      screen.getByLabelText<HTMLSelectElement>('Filtrar por status').value,
    ).toBe('PENDING');
    changeFilter('Filtrar por status', 'DONE');
    expect(screen.getByRole('button', { name: 'Reabrir' })).toBeTruthy();
  });

  it('preserva a tarefa filtrada quando a atualização falha', async () => {
    vi.mocked(getTasks).mockResolvedValue([task('pending', 'Estudar filtros')]);
    vi.mocked(updateTaskStatus).mockRejectedValue(
      new Error('Não foi possível atualizar a tarefa'),
    );
    render(<TaskList />);
    await screen.findByText('Estudar filtros');
    changeFilter('Filtrar por status', 'PENDING');
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Não foi possível atualizar a tarefa',
    );
    expect(screen.getByText('Estudar filtros')).toBeTruthy();
    expect(getTasks).toHaveBeenCalledOnce();
  });

  it('distingue dia vazio de falha no carregamento', async () => {
    vi.mocked(getTasks)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('Falha de conexão'));
    const props = { date: '2026-09-28', categories, onChanged: vi.fn() };
    const { rerender } = render(<TasksList {...props} refreshKey={0} />);
    await screen.findByText('Nenhuma tarefa para a data selecionada.');
    expect(
      screen.queryByText(/Nenhuma tarefa corresponde aos filtros/),
    ).toBeNull();
    rerender(<TasksList {...props} refreshKey={1} />);
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('Falha de conexão'),
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(
      screen.queryByText('Nenhuma tarefa para a data selecionada.'),
    ).toBeNull();
  });
});
