import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../../lib/api.ts';
import { LoginPage } from '../../pages/login-page.tsx';
import { getCurrentUser, type User } from './auth-api.ts';
import { ProtectedRoute } from './protected-route.tsx';

vi.mock('./auth-api.ts', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
}));

const user: User = {
  id: 'user-id',
  name: 'Felipe',
  email: 'felipe@example.com',
  createdAt: '2026-09-28T10:00:00.000Z',
};

function ProtectedContent() {
  return (
    <button
      onClick={() => {
        void apiFetch('/tasks');
      }}
      type="button"
    >
      Carregar tarefas
    </button>
  );
}

function renderRoutes() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route index element={<ProtectedContent />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('ProtectedRoute', () => {
  it('leva ao login avisando quando a sessão expira durante o uso', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(user);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    renderRoutes();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Carregar tarefas' }),
    );

    expect(
      await screen.findByText('Sua sessão expirou. Entre novamente.'),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeTruthy();
  });

  it('leva ao login sem aviso de expiração quando não havia sessão', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    renderRoutes();

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeTruthy();
    expect(screen.queryByText('Sua sessão expirou. Entre novamente.')).toBe(
      null,
    );
  });

  it('mantém o conteúdo quando as chamadas continuam autorizadas', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(user);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );
    renderRoutes();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Carregar tarefas' }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledOnce();
    });
    expect(
      screen.getByRole('button', { name: 'Carregar tarefas' }),
    ).toBeTruthy();
  });
});
