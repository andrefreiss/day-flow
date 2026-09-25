import { useState, type FormEvent } from 'react';
import type { Category } from '../categories/categories-api.ts';
import { createTask, type TaskPriority } from './tasks-api.ts';

type TaskFormProps = {
  categories: Category[];
  date: string;
  onCreated: () => void;
};

export function TaskForm({ categories, date, onCreated }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [categoryId, setCategoryId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedCategoryId = categories.some(
    (category) => category.id === categoryId,
  )
    ? categoryId
    : '';

  async function submitTask(): Promise<void> {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setErrorMessage('Informe o título da tarefa');
      return;
    }

    if (endTime && !startTime) {
      setErrorMessage('O horário final exige um horário inicial');
      return;
    }

    if (startTime && endTime && endTime <= startTime) {
      setErrorMessage('O horário final deve ser depois do inicial');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await createTask({
        title: normalizedTitle,
        description: description.trim() || undefined,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        priority,
        categoryId: selectedCategoryId || undefined,
      });

      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setPriority('MEDIUM');
      setCategoryId('');
      onCreated();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar a tarefa',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submitTask();
  }

  return (
    <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Nova tarefa</h2>
        <p className="mt-1 text-sm text-slate-500">
          Adicione uma atividade para a data selecionada.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium" htmlFor="task-title">
            Título
          </label>

          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSubmitting}
            id="task-title"
            maxLength={120}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
            required
            type="text"
            value={title}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium"
            htmlFor="task-description"
          >
            Descrição
          </label>

          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSubmitting}
            id="task-description"
            maxLength={2000}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
            value={description}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="block text-sm font-medium"
              htmlFor="task-start-time"
            >
              Horário inicial
            </label>

            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              disabled={isSubmitting}
              id="task-start-time"
              onChange={(event) => {
                setStartTime(event.target.value);
              }}
              type="time"
              value={startTime}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium"
              htmlFor="task-end-time"
            >
              Horário final
            </label>

            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              disabled={isSubmitting}
              id="task-end-time"
              onChange={(event) => {
                setEndTime(event.target.value);
              }}
              type="time"
              value={endTime}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="block text-sm font-medium"
              htmlFor="task-category"
            >
              Categoria
            </label>

            <select
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              disabled={isSubmitting}
              id="task-category"
              onChange={(event) => {
                setCategoryId(event.target.value);
              }}
              value={selectedCategoryId}
            >
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium"
              htmlFor="task-priority"
            >
              Prioridade
            </label>

            <select
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              disabled={isSubmitting}
              id="task-priority"
              onChange={(event) => {
                setPriority(event.target.value as TaskPriority);
              }}
              value={priority}
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
            </select>
          </div>
        </div>

        {errorMessage ? (
          <p
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <button
          className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Criando...' : 'Criar tarefa'}
        </button>
      </form>
    </section>
  );
}
