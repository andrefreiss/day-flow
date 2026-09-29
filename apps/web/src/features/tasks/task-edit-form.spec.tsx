import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateTask, type Task } from './tasks-api.ts';
import { TaskEditForm } from './task-edit-form.tsx';

vi.mock('./tasks-api.ts', () => ({
  updateTask: vi.fn(),
}));

const task: Task = {
  id: 'task-id',
  categoryId: null,
  title: 'Consulta médica',
  description: null,
  date: '2026-09-28',
  startTime: '09:00',
  endTime: null,
  status: 'PENDING',
  priority: 'MEDIUM',
  completedAt: null,
  createdAt: '2026-09-28T10:00:00.000Z',
  updatedAt: '2026-09-28T10:00:00.000Z',
};

function renderForm() {
  const onUpdated = vi.fn<(task: Task) => void>();

  render(
    <TaskEditForm
      categories={[]}
      onCancel={vi.fn()}
      onUpdated={onUpdated}
      task={task}
    />,
  );

  return { onUpdated };
}

function submit(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('TaskEditForm', () => {
  it('começa com a data atual da tarefa', () => {
    renderForm();

    expect(screen.getByLabelText<HTMLInputElement>('Data').value).toBe(
      '2026-09-28',
    );
  });

  it('envia a nova data ao remarcar e devolve a tarefa atualizada', async () => {
    const rescheduled: Task = { ...task, date: '2026-10-04' };
    vi.mocked(updateTask).mockResolvedValue(rescheduled);
    const { onUpdated } = renderForm();

    fireEvent.change(screen.getByLabelText('Data'), {
      target: { value: '2026-10-04' },
    });
    submit();

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledWith(rescheduled);
    });
    expect(updateTask).toHaveBeenCalledWith(
      'task-id',
      expect.objectContaining({ date: '2026-10-04' }),
    );
  });

  it('não envia a data quando ela não mudou', async () => {
    vi.mocked(updateTask).mockResolvedValue({ ...task, title: 'Dentista' });
    const { onUpdated } = renderForm();

    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'Dentista' },
    });
    submit();

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledOnce();
    });
    expect(vi.mocked(updateTask).mock.calls[0]?.[1].date).toBeUndefined();
  });

  it('exige uma data antes de enviar', () => {
    renderForm();

    fireEvent.change(screen.getByLabelText('Data'), {
      target: { value: '' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(screen.getByRole('alert').textContent).toBe(
      'Informe a data da tarefa',
    );
    expect(updateTask).not.toHaveBeenCalled();
  });
});
