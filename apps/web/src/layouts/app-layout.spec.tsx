import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';
import { logout, type User } from '../features/auth/auth-api.ts';
import { AppLayout } from './app-layout.tsx';

vi.mock('../features/auth/auth-api.ts', () => ({
  logout: vi.fn(),
}));

const user: User = {
  id: 'user-id',
  name: 'Felipe',
  email: 'felipe@example.com',
  createdAt: '2026-09-28T10:00:00.000Z',
};

function SessionRoute() {
  return <Outlet context={user} />;
}

function renderLayout(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<SessionRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<p>Conteúdo da rotina</p>} />
            <Route path="calendar" element={<p>Conteúdo do calendário</p>} />
            <Route path="categories" element={<p>Conteúdo das categorias</p>} />
          </Route>
        </Route>
        <Route path="login" element={<p>Página de login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AppLayout', () => {
  it('navega entre as áreas protegidas e destaca a rota ativa', () => {
    renderLayout();

    const calendarLink = screen.getByRole('link', { name: 'Calendário' });
    fireEvent.click(calendarLink);

    expect(screen.getByText('Conteúdo do calendário')).toBeTruthy();
    expect(calendarLink.getAttribute('aria-current')).toBe('page');
  });

  it('encerra a sessão e direciona para o login', async () => {
    vi.mocked(logout).mockResolvedValue();
    renderLayout('/categories');

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledOnce();
      expect(screen.getByText('Página de login')).toBeTruthy();
    });
  });
});
