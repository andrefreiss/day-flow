import { CategoriesPanel } from '../features/categories/categories-panel.tsx';
import { useCategories } from '../features/categories/use-categories.ts';

export function CategoriesPage() {
  const { categories, error, isLoading, refresh } = useCategories();

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Organização
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Categorias
        </h1>
        <p className="mt-2 text-slate-600">
          Crie áreas para identificar e encontrar suas tarefas com facilidade.
        </p>
      </header>

      <CategoriesPanel
        categories={categories}
        error={error}
        isLoading={isLoading}
        onChanged={refresh}
      />
    </>
  );
}
