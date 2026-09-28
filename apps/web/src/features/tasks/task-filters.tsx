import { useId } from 'react';
import type { Category } from '../categories/categories-api.ts';
import type { TaskPriority, TaskStatus } from './tasks-api.ts';

export type TaskFilterValues = {
  query: string;
  status: TaskStatus | '';
  priority: TaskPriority | '';
  categoryId: string;
};

type TaskFiltersProps = {
  categories: Category[];
  value: TaskFilterValues;
  onChange: (value: TaskFilterValues) => void;
};

const controlClass =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

export function TaskFilters({ categories, value, onChange }: TaskFiltersProps) {
  const id = useId();
  const hasFilters = Boolean(
    value.query || value.status || value.priority || value.categoryId,
  );

  return (
    <fieldset className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <legend className="px-1 text-sm font-medium">Buscar e filtrar</legend>
      <p className="text-xs text-slate-500">
        Os filtros afetam apenas esta lista. O resumo e o calendário mantêm os
        totais do período.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-sm font-medium" htmlFor={`${id}-query`}>
            Buscar tarefas
          </label>
          <input
            className={controlClass}
            id={`${id}-query`}
            onChange={(event) =>
              onChange({ ...value, query: event.target.value })
            }
            placeholder="Título ou descrição"
            type="search"
            value={value.query}
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor={`${id}-status`}>
            Filtrar por status
          </label>
          <select
            className={controlClass}
            id={`${id}-status`}
            onChange={(event) => {
              const status = event.target.value;
              if (status === '' || status === 'PENDING' || status === 'DONE') {
                onChange({ ...value, status });
              }
            }}
            value={value.status}
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendentes</option>
            <option value="DONE">Concluídas</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor={`${id}-priority`}>
            Filtrar por prioridade
          </label>
          <select
            className={controlClass}
            id={`${id}-priority`}
            onChange={(event) => {
              const priority = event.target.value;
              if (
                priority === '' ||
                priority === 'LOW' ||
                priority === 'MEDIUM' ||
                priority === 'HIGH'
              ) {
                onChange({ ...value, priority });
              }
            }}
            value={value.priority}
          >
            <option value="">Todas as prioridades</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Média</option>
            <option value="LOW">Baixa</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor={`${id}-category`}>
            Filtrar por categoria
          </label>
          <select
            className={controlClass}
            id={`${id}-category`}
            onChange={(event) =>
              onChange({ ...value, categoryId: event.target.value })
            }
            value={value.categoryId}
          >
            <option value="">Todas as categorias</option>
            <option value="uncategorized">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        className="mt-4 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!hasFilters}
        onClick={() =>
          onChange({ query: '', status: '', priority: '', categoryId: '' })
        }
        type="button"
      >
        Limpar filtros
      </button>
    </fieldset>
  );
}
