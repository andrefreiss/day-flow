import { useState, type FormEvent } from 'react';
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type Category,
} from './categories-api.ts';

type CategoriesPanelProps = {
  categories: Category[];
  error: string | null;
  isLoading: boolean;
  onChanged: () => void;
};

const defaultColor = '#4f46e5';

export function CategoriesPanel({
  categories,
  error,
  isLoading,
  onChanged,
}: CategoriesPanelProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(defaultColor);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState(defaultColor);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setActionError('Informe o nome da categoria');
      return;
    }

    setActionError(null);
    setIsSubmitting(true);

    try {
      await createCategory({ name: normalizedName, color });
      setName('');
      setColor(defaultColor);
      onChanged();
    } catch (requestError: unknown) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível criar a categoria',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditing(category: Category): void {
    setActionError(null);
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingColor(category.color);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId) {
      return;
    }

    const normalizedName = editingName.trim();

    if (!normalizedName) {
      setActionError('Informe o nome da categoria');
      return;
    }

    setActionError(null);
    setIsSubmitting(true);

    try {
      await updateCategory(editingId, {
        name: normalizedName,
        color: editingColor,
      });
      setEditingId(null);
      onChanged();
    } catch (requestError: unknown) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível atualizar a categoria',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(category: Category): Promise<void> {
    const confirmed = window.confirm(
      `Deseja excluir a categoria "${category.name}"? As tarefas serão mantidas sem categoria.`,
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setDeletingId(category.id);

    try {
      await deleteCategory(category.id);

      if (editingId === category.id) {
        setEditingId(null);
      }

      onChanged();
    } catch (requestError: unknown) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível excluir a categoria',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Categorias</h2>
        <p className="mt-1 text-sm text-slate-500">
          Organize suas tarefas por área e cor.
        </p>
      </div>

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          void handleCreate(event);
        }}
      >
        <div className="flex-1">
          <label className="block text-sm font-medium" htmlFor="category-name">
            Nome
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSubmitting}
            id="category-name"
            maxLength={40}
            onChange={(event) => {
              setName(event.target.value);
            }}
            placeholder="Ex.: Trabalho"
            required
            type="text"
            value={name}
          />
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="category-color">
            Cor
          </label>
          <input
            className="mt-2 h-11 w-full min-w-20 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-60 sm:w-20"
            disabled={isSubmitting}
            id="category-color"
            onChange={(event) => {
              setColor(event.target.value);
            }}
            type="color"
            value={color}
          />
        </div>

        <button
          className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Criando...' : 'Criar categoria'}
        </button>
      </form>

      {actionError ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-5 text-sm text-slate-600" aria-live="polite">
          Carregando categorias...
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && categories.length === 0 ? (
        <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          Nenhuma categoria criada.
        </p>
      ) : null}

      {categories.length > 0 ? (
        <ul className="mt-5 divide-y divide-slate-200">
          {categories.map((category) => (
            <li className="py-3" key={category.id}>
              {editingId === category.id ? (
                <form
                  className="flex flex-col gap-3 sm:flex-row sm:items-end"
                  onSubmit={(event) => {
                    void handleUpdate(event);
                  }}
                >
                  <div className="flex-1">
                    <label
                      className="block text-sm font-medium"
                      htmlFor={`category-name-${category.id}`}
                    >
                      Nome
                    </label>
                    <input
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                      disabled={isSubmitting}
                      id={`category-name-${category.id}`}
                      maxLength={40}
                      onChange={(event) => {
                        setEditingName(event.target.value);
                      }}
                      required
                      type="text"
                      value={editingName}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium"
                      htmlFor={`category-color-${category.id}`}
                    >
                      Cor
                    </label>
                    <input
                      className="mt-2 h-11 w-full min-w-20 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-60 sm:w-20"
                      disabled={isSubmitting}
                      id={`category-color-${category.id}`}
                      onChange={(event) => {
                        setEditingColor(event.target.value);
                      }}
                      type="color"
                      value={editingColor}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      {isSubmitting ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting}
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
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                    <span className="text-xs text-slate-500">
                      {category.color.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={deletingId !== null || isSubmitting}
                      onClick={() => {
                        startEditing(category);
                      }}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={deletingId !== null || isSubmitting}
                      onClick={() => {
                        void handleDelete(category);
                      }}
                      type="button"
                    >
                      {deletingId === category.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
