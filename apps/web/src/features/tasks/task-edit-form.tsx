import { useId, useState, type FormEvent } from 'react';
import type { Category } from '../categories/categories-api.ts';
import { updateTask, type Task, type TaskPriority } from './tasks-api.ts';

type TaskEditFormProps = {
  categories: Category[];
  task: Task;
  onCancel: () => void;
  onUpdated: () => void;
};

export function TaskEditForm({
  categories,
  task,
  onCancel,
  onUpdated,
}: TaskEditFormProps) {
  const fieldId = useId();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [startTime, setStartTime] = useState(task.startTime ?? '');
  const [endTime, setEndTime] = useState(task.endTime ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [categoryId, setCategoryId] = useState(task.categoryId ?? '');
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
      await updateTask(task.id, {
        title: normalizedTitle,
        description: description.trim() || null,
        startTime: startTime || null,
        endTime: endTime || null,
        priority,
        categoryId: selectedCategoryId || null,
      });

      onUpdated();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a tarefa',
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
    <form
      className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            className="block text-sm font-medium"
            htmlFor={`${fieldId}-title`}
          >
            Título
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSubmitting}
            id={`${fieldId}-title`}
            maxLength={120}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
            required
            type="text"
            value={title}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            className="block text-sm font-medium"
            htmlFor={`${fieldId}-description`}
          >
            Descrição
          </label>
          <textarea
            className="mt-2 min-h-20 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSubmitting}
            id={`${fieldId}-description`}
            maxLength={2000}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
            value={description}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium"
            htmlFor={`${fieldId}-start-time`}
          >
            Horário inicial
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSubmitting}
            id={`${fieldId}-start-time`}
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
            htmlFor={`${fieldId}-end-time`}
          >
            Horário final
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSubmitting}
            id={`${fieldId}-end-time`}
            onChange={(event) => {
              setEndTime(event.target.value);
            }}
            type="time"
            value={endTime}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium"
            htmlFor={`${fieldId}-category`}
          >
            Categoria
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSubmitting}
            id={`${fieldId}-category`}
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
            htmlFor={`${fieldId}-priority`}
          >
            Prioridade
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSubmitting}
            id={`${fieldId}-priority`}
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
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <button
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
