import { useEffect, useState, type FormEvent } from 'react';
import {
  createSubtask,
  deleteSubtask,
  getSubtasks,
  updateSubtask,
  type Subtask,
} from './subtasks-api.ts';

type SubtasksPanelProps = {
  taskId: string;
};

type SubtasksState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; subtasks: Subtask[] };

export function SubtasksPanel({ taskId }: SubtasksPanelProps) {
  const [state, setState] = useState<SubtasksState>({ status: 'loading' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSubtasks(): Promise<void> {
      try {
        const subtasks = await getSubtasks(taskId);

        if (active) {
          setState({ status: 'ready', subtasks });
        }
      } catch (error: unknown) {
        if (active) {
          setState({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível carregar as subtarefas',
          });
        }
      }
    }

    void loadSubtasks();

    return () => {
      active = false;
    };
  }, [refreshKey, taskId]);

  function refresh(): void {
    setRefreshKey((value) => value + 1);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setActionError('Informe o título da subtarefa');
      return;
    }

    setActionError(null);
    setIsCreating(true);

    try {
      await createSubtask(taskId, normalizedTitle);
      setTitle('');
      refresh();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar a subtarefa',
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggle(subtask: Subtask): Promise<void> {
    setActionError(null);
    setMutatingId(subtask.id);

    try {
      await updateSubtask(taskId, subtask.id, { done: !subtask.done });
      refresh();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a subtarefa',
      );
    } finally {
      setMutatingId(null);
    }
  }

  function startEditing(subtask: Subtask): void {
    setActionError(null);
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  }

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId) {
      return;
    }

    const normalizedTitle = editingTitle.trim();

    if (!normalizedTitle) {
      setActionError('Informe o título da subtarefa');
      return;
    }

    setActionError(null);
    setMutatingId(editingId);

    try {
      await updateSubtask(taskId, editingId, { title: normalizedTitle });
      setEditingId(null);
      refresh();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a subtarefa',
      );
    } finally {
      setMutatingId(null);
    }
  }

  async function handleDelete(subtask: Subtask): Promise<void> {
    const confirmed = window.confirm(
      `Deseja excluir a subtarefa "${subtask.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setMutatingId(subtask.id);

    try {
      await deleteSubtask(taskId, subtask.id);

      if (editingId === subtask.id) {
        setEditingId(null);
      }

      refresh();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir a subtarefa',
      );
    } finally {
      setMutatingId(null);
    }
  }

  const completedCount =
    state.status === 'ready'
      ? state.subtasks.filter((subtask) => subtask.done).length
      : 0;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-medium">Subtarefas</h3>
          {state.status === 'ready' && state.subtasks.length > 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              {completedCount} de {state.subtasks.length} concluídas
            </p>
          ) : null}
        </div>
      </div>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          void handleCreate(event);
        }}
      >
        <label className="sr-only" htmlFor={`new-subtask-${taskId}`}>
          Nova subtarefa
        </label>
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          disabled={isCreating}
          id={`new-subtask-${taskId}`}
          maxLength={120}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          placeholder="Adicionar uma subtarefa"
          required
          type="text"
          value={title}
        />
        <button
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isCreating}
          type="submit"
        >
          {isCreating ? 'Adicionando...' : 'Adicionar'}
        </button>
      </form>

      {actionError ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      {state.status === 'loading' ? (
        <p className="mt-4 text-sm text-slate-600" aria-live="polite">
          Carregando subtarefas...
        </p>
      ) : null}

      {state.status === 'error' ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === 'ready' && state.subtasks.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Nenhuma subtarefa adicionada.
        </p>
      ) : null}

      {state.status === 'ready' && state.subtasks.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-200">
          {state.subtasks.map((subtask) => (
            <li className="py-3" key={subtask.id}>
              {editingId === subtask.id ? (
                <form
                  className="flex flex-col gap-2 sm:flex-row"
                  onSubmit={(event) => {
                    void handleRename(event);
                  }}
                >
                  <label
                    className="sr-only"
                    htmlFor={`edit-subtask-${subtask.id}`}
                  >
                    Título da subtarefa
                  </label>
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                    disabled={mutatingId !== null}
                    id={`edit-subtask-${subtask.id}`}
                    maxLength={120}
                    onChange={(event) => {
                      setEditingTitle(event.target.value);
                    }}
                    required
                    type="text"
                    value={editingTitle}
                  />
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={mutatingId !== null}
                      type="submit"
                    >
                      {mutatingId === subtask.id ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={mutatingId !== null}
                      onClick={() => {
                        setEditingId(null);
                      }}
                      type="button"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex min-w-0 items-center gap-3">
                    <input
                      aria-label={`Marcar ${subtask.title} como ${subtask.done ? 'pendente' : 'concluída'}`}
                      checked={subtask.done}
                      className="h-4 w-4 shrink-0 accent-indigo-600"
                      disabled={mutatingId !== null}
                      onChange={() => {
                        void handleToggle(subtask);
                      }}
                      type="checkbox"
                    />
                    <span
                      className={
                        subtask.done
                          ? 'truncate text-sm text-slate-400 line-through'
                          : 'truncate text-sm text-slate-700'
                      }
                    >
                      {subtask.title}
                    </span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={mutatingId !== null}
                      onClick={() => {
                        startEditing(subtask);
                      }}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={mutatingId !== null}
                      onClick={() => {
                        void handleDelete(subtask);
                      }}
                      type="button"
                    >
                      {mutatingId === subtask.id ? 'Aguarde...' : 'Excluir'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
