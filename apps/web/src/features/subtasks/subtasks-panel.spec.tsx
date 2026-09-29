import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SubtasksPanel } from './subtasks-panel.tsx';
import {
  deleteSubtask,
  getSubtasks,
  updateSubtask,
  type Subtask,
} from './subtasks-api.ts';

vi.mock('./subtasks-api.ts', () => ({
  getSubtasks: vi.fn(),
  createSubtask: vi.fn(),
  updateSubtask: vi.fn(),
  deleteSubtask: vi.fn(),
}));

const subtask: Subtask = {
  id: 'subtask-id',
  taskId: 'task-id',
  title: 'Revisar exercícios',
  done: false,
  createdAt: '2026-09-29T12:00:00.000Z',
  updatedAt: '2026-09-29T12:00:00.000Z',
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('SubtasksPanel', () => {
  it('recupera o carregamento e confirma conclusão', async () => {
    const done = { ...subtask, done: true };
    vi.mocked(getSubtasks)
      .mockRejectedValueOnce(new Error('Falha de conexão'))
      .mockResolvedValueOnce([subtask])
      .mockResolvedValueOnce([done]);
    vi.mocked(updateSubtask).mockResolvedValue(done);
    render(<SubtasksPanel taskId="task-id" />);
    await screen.findByRole('alert');
    fireEvent.click(
      screen.getByRole('button', { name: 'Recarregar subtarefas' }),
    );
    fireEvent.click(await screen.findByRole('checkbox'));
    await screen.findByText('Subtarefa concluída.');
    await screen.findByText('1 de 1 concluídas');
    expect(updateSubtask).toHaveBeenCalledWith('task-id', 'subtask-id', {
      done: true,
    });
  });

  it('permite cancelar, preserva após falha e só remove após sucesso', async () => {
    vi.mocked(getSubtasks)
      .mockResolvedValueOnce([subtask])
      .mockResolvedValueOnce([]);
    vi.mocked(deleteSubtask)
      .mockRejectedValueOnce(new Error('Falha ao excluir'))
      .mockResolvedValueOnce();
    render(<SubtasksPanel taskId="task-id" />);
    await screen.findByText('Revisar exercícios');
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(deleteSubtask).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(
      screen.queryByRole('group', { name: 'Excluir subtarefa' }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    await screen.findByRole('alert');
    expect(screen.getByText('Revisar exercícios')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    await screen.findByText('Subtarefa excluída.');
    await screen.findByText('Nenhuma subtarefa adicionada.');
    expect(deleteSubtask).toHaveBeenLastCalledWith('task-id', 'subtask-id');
  });
});
