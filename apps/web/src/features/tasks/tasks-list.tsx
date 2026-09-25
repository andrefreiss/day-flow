import { useEffect, useState } from 'react';
import type { Category } from '../categories/categories-api.ts';
import { SubtasksPanel } from '../subtasks/subtasks-panel.tsx';
import {
  deleteTask,
  getTasks,
  updateTaskStatus,
  type Task,
  type TaskPriority,
} from './tasks-api.ts';
import { TaskEditForm } from './task-edit-form.tsx';

type TasksListProps = {
  categories: Category[];
  date: string;
  refreshKey: number;
  onChanged: () => void;
};

type TasksState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tasks: Task[] };

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

const priorityStyles: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
};

function formatTaskTime(task: Task): string {
  if (!task.startTime) {
    return 'Sem horário';
  }

  if (!task.endTime) {
    return task.startTime;
  }

  return `${task.startTime}–${task.endTime}`;
}

function TaskCategoryBadge({
  categories,
  task,
}: {
  categories: Category[];
  task: Task;
}) {
  const category = categories.find((item) => item.id === task.categoryId);

  if (!category) {
    return null;
  }

  return (
    <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  );
}

export function TasksList({
  categories,
  date,
  refreshKey,
  onChanged,
}: TasksListProps) {
  const [state, setState] = useState<TasksState>({ status: 'loading' });
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [expandedSubtasksTaskId, setExpandedSubtasksTaskId] = useState<
    string | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTasks(): Promise<void> {
      try {
        const tasks = await getTasks(date);

        if (active) {
          setState({ status: 'ready', tasks });
        }
      } catch (error: unknown) {
        if (active) {
          setState({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível carregar as tarefas',
          });
        }
      }
    }

    void loadTasks();

    return () => {
      active = false;
    };
  }, [date, refreshKey]);

  async function handleStatusChange(task: Task): Promise<void> {
    setActionError(null);
    setUpdatingTaskId(task.id);
    try {
      await updateTaskStatus(
        task.id,
        task.status === 'DONE' ? 'PENDING' : 'DONE',
      );

      onChanged();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a tarefa',
      );
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function handleDelete(task: Task): Promise<void> {
    const confirmed = window.confirm(
      `Deseja realmente excluir a tarefa "${task.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setDeletingTaskId(task.id);

    try {
      await deleteTask(task.id);
      onChanged();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir a tarefa',
      );
    } finally {
      setDeletingTaskId(null);
    }
  }

  return (
    <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Tarefas de hoje</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sua programação para o dia.
        </p>
      </div>

      {actionError ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      {state.status === 'loading' ? (
        <p className="mt-6 text-slate-600" aria-live="polite">
          Carregando tarefas...
        </p>
      ) : null}

      {state.status === 'error' ? (
        <p className="mt-6 text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === 'ready' && state.tasks.length === 0 ? (
        <p className="mt-6 rounded-lg bg-slate-50 p-4 text-slate-600">
          Nenhuma tarefa para hoje.
        </p>
      ) : null}

      {state.status === 'ready' && state.tasks.length > 0 ? (
        <ul className="mt-6 divide-y divide-slate-200">
          {state.tasks.map((task) => (
            <li className="py-4" key={task.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p
                    className={
                      task.status === 'DONE'
                        ? 'font-medium text-slate-400 line-through'
                        : 'font-medium text-slate-900'
                    }
                  >
                    {task.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatTaskTime(task)}
                  </p>

                  <TaskCategoryBadge categories={categories} task={task} />

                  {task.description ? (
                    <p className="mt-2 text-sm text-slate-600">
                      {task.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[task.priority]}`}
                  >
                    {priorityLabels[task.priority]}
                  </span>

                  <span
                    className={
                      task.status === 'DONE'
                        ? 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700'
                        : 'rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700'
                    }
                  >
                    {task.status === 'DONE' ? 'Concluída' : 'Pendente'}
                  </span>

                  <button
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={
                      updatingTaskId !== null || deletingTaskId !== null
                    }
                    onClick={() => {
                      void handleStatusChange(task);
                    }}
                    type="button"
                  >
                    {updatingTaskId === task.id
                      ? 'Salvando...'
                      : task.status === 'DONE'
                        ? 'Reabrir'
                        : 'Concluir'}
                  </button>
                  <button
                    aria-expanded={expandedSubtasksTaskId === task.id}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={
                      updatingTaskId !== null || deletingTaskId !== null
                    }
                    onClick={() => {
                      setExpandedSubtasksTaskId((currentId) =>
                        currentId === task.id ? null : task.id,
                      );
                    }}
                    type="button"
                  >
                    {expandedSubtasksTaskId === task.id
                      ? 'Fechar subtarefas'
                      : 'Subtarefas'}
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={
                      updatingTaskId !== null || deletingTaskId !== null
                    }
                    onClick={() => {
                      setActionError(null);
                      setEditingTaskId((currentId) =>
                        currentId === task.id ? null : task.id,
                      );
                    }}
                    type="button"
                  >
                    {editingTaskId === task.id ? 'Fechar edição' : 'Editar'}
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={
                      updatingTaskId !== null || deletingTaskId !== null
                    }
                    onClick={() => {
                      void handleDelete(task);
                    }}
                    type="button"
                  >
                    {deletingTaskId === task.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </div>

              {editingTaskId === task.id ? (
                <TaskEditForm
                  categories={categories}
                  key={`${task.id}:${task.categoryId ?? ''}`}
                  onCancel={() => {
                    setEditingTaskId(null);
                  }}
                  onUpdated={() => {
                    setEditingTaskId(null);
                    onChanged();
                  }}
                  task={task}
                />
              ) : null}

              {expandedSubtasksTaskId === task.id ? (
                <SubtasksPanel taskId={task.id} />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
