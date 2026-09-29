import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CategoriesPage } from '../../pages/categories-page.tsx';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type Category,
} from './categories-api.ts';

vi.mock('./categories-api.ts', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const category: Category = {
  id: 'category-id',
  name: 'Estudos',
  color: '#4f46e5',
  createdAt: '2026-09-29T12:00:00.000Z',
  updatedAt: '2026-09-29T12:00:00.000Z',
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('CategoriesPanel', () => {
  it('recarrega as categorias após falha e só exclui depois de confirmar', async () => {
    vi.mocked(getCategories)
      .mockRejectedValueOnce(new Error('Falha de conexão'))
      .mockResolvedValueOnce([category])
      .mockResolvedValueOnce([]);
    vi.mocked(deleteCategory).mockResolvedValue();
    render(<CategoriesPage />);
    await screen.findByRole('alert');
    fireEvent.click(
      screen.getByRole('button', { name: 'Recarregar categorias' }),
    );
    await screen.findByText('Estudos');
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(
      screen.getByText(/As tarefas serão mantidas sem categoria/),
    ).toBeTruthy();
    expect(deleteCategory).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('Estudos')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    await screen.findByText('Categoria excluída. As tarefas foram mantidas.');
    await screen.findByText('Nenhuma categoria criada.');
    expect(deleteCategory).toHaveBeenCalledExactlyOnceWith('category-id');
  });

  it('mantém a categoria e a confirmação quando a exclusão falha', async () => {
    vi.mocked(getCategories).mockResolvedValue([category]);
    vi.mocked(deleteCategory).mockRejectedValueOnce(
      new Error('Não foi possível excluir a categoria'),
    );
    render(<CategoriesPage />);
    await screen.findByText('Estudos');
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    await screen.findByRole('alert');
    expect(screen.getByText('Estudos')).toBeTruthy();
    expect(
      screen.getByRole('group', { name: 'Excluir categoria' }),
    ).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    expect(getCategories).toHaveBeenCalledOnce();
  });

  it('confirma criação e edição somente depois de salvar', async () => {
    vi.mocked(getCategories)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([category])
      .mockResolvedValueOnce([{ ...category, name: 'Leitura' }]);
    vi.mocked(createCategory).mockResolvedValue(category);
    vi.mocked(updateCategory).mockResolvedValue({
      ...category,
      name: 'Leitura',
    });
    render(<CategoriesPage />);
    await screen.findByText('Nenhuma categoria criada.');
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Estudos' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar categoria' }));
    await screen.findByText('Categoria criada.');
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getAllByLabelText('Nome')[1]!, {
      target: { value: 'Leitura' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await screen.findByText('Categoria atualizada.');
    await screen.findByText('Leitura');
    expect(updateCategory).toHaveBeenCalledWith('category-id', {
      name: 'Leitura',
      color: '#4f46e5',
    });
  });
});
