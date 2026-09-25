import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTask } from './tasks-api.ts';
import { TaskForm } from './task-form.tsx';

vi.mock('./tasks-api.ts', () => ({
  createTask: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('TaskForm', () => {
  it('cria uma tarefa na data e categoria selecionadas', async () => {
    vi.mocked(createTask).mockResolvedValue({
      id: 'task-id',
      categoryId: 'category-id',
      title: 'Estudar React',
      description: null,
      date: '2026-09-25T00:00:00.000Z',
      startTime: null,
      endTime: null,
      status: 'PENDING',
      priority: 'MEDIUM',
      completedAt: null,
      createdAt: '2026-09-25T10:00:00.000Z',
      updatedAt: '2026-09-25T10:00:00.000Z',
    });
    const onCreated = vi.fn<() => void>();

    render(
      <TaskForm
        categories={[
          {
            id: 'category-id',
            name: 'Estudos',
            color: '#4f46e5',
            createdAt: '2026-09-25T10:00:00.000Z',
            updatedAt: '2026-09-25T10:00:00.000Z',
          },
        ]}
        date="2026-09-25"
        onCreated={onCreated}
      />,
    );

    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: '  Estudar React  ' },
    });
    fireEvent.change(screen.getByLabelText('Categoria'), {
      target: { value: 'category-id' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith({
        title: 'Estudar React',
        description: undefined,
        date: '2026-09-25',
        startTime: undefined,
        endTime: undefined,
        priority: 'MEDIUM',
        categoryId: 'category-id',
      });
    });

    expect(onCreated).toHaveBeenCalledOnce();
  });

  it('impede horário final sem horário inicial', async () => {
    render(<TaskForm categories={[]} date="2026-09-25" onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'Estudar React' },
    });
    fireEvent.change(screen.getByLabelText('Horário final'), {
      target: { value: '11:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    expect(
      await screen.findByText('O horário final exige um horário inicial'),
    ).toBeTruthy();
    expect(createTask).not.toHaveBeenCalled();
  });
});
