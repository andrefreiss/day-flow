import { useCallback, useEffect, useState } from 'react';
import { getCategories, type Category } from './categories-api.ts';

type CategoriesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; categories: Category[] };

export function useCategories() {
  const [state, setState] = useState<CategoriesState>({ status: 'loading' });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCategories(): Promise<void> {
      try {
        const categories = await getCategories();

        if (active) {
          setState({ status: 'ready', categories });
        }
      } catch (error: unknown) {
        if (active) {
          setState({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível carregar as categorias',
          });
        }
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  return {
    categories: state.status === 'ready' ? state.categories : [],
    error: state.status === 'error' ? state.message : null,
    isLoading: state.status === 'loading',
    refresh,
  };
}
