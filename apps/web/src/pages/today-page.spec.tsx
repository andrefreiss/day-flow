import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { getCategories } from '../features/categories/categories-api.ts';
import { getDashboard } from '../features/dashboard/dashboard-api.ts';
import { getTasks } from '../features/tasks/tasks-api.ts';
import { TodayPage } from './today-page.tsx';

vi.mock('../features/categories/categories-api.ts', () => ({
  getCategories: vi.fn(),
}));
vi.mock('../features/dashboard/dashboard-api.ts', () => ({
  getDashboard: vi.fn(),
}));
vi.mock('../features/tasks/tasks-api.ts', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  updateTaskStatus: vi.fn(),
  deleteTask: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it('recupera resumo e categorias sem apagar o formulário nem recarregar as tarefas', async () => {
  vi.mocked(getTasks).mockResolvedValue([]);
  vi.mocked(getCategories)
    .mockRejectedValueOnce(new Error('Falha nas categorias'))
    .mockResolvedValueOnce([]);
  vi.mocked(getDashboard)
    .mockRejectedValueOnce(new Error('Falha no resumo'))
    .mockResolvedValueOnce({
      date: '2026-09-29',
      today: { total: 0, completed: 0, pending: 0 },
      overdue: 0,
      upcoming: 0,
      progress: 0,
    });
  render(
    <MemoryRouter>
      <Routes>
        <Route
          element={
            <Outlet
              context={{
                id: 'user-id',
                name: 'Felipe',
                email: 'felipe@example.com',
                createdAt: '2026-09-29',
              }}
            />
          }
        >
          <Route index element={<TodayPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByText('Falha no resumo');
  fireEvent.change(screen.getByLabelText('Título'), {
    target: { value: 'Continuar estudando' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Recarregar resumo' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Recarregar categorias' }),
  );
  await screen.findByRole('progressbar');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByLabelText<HTMLInputElement>('Título').value).toBe(
    'Continuar estudando',
  );
  expect(getTasks).toHaveBeenCalledOnce();
  expect(getDashboard).toHaveBeenCalledTimes(2);
  expect(getCategories).toHaveBeenCalledTimes(2);
});
