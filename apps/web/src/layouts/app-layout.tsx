import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useOutletContext } from 'react-router';
import { logout, type User } from '../features/auth/auth-api.ts';

function navigationClass(isActive: boolean): string {
  return isActive
    ? 'rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700'
    : 'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900';
}

export function AppLayout() {
  const user = useOutletContext<User>();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout(): Promise<void> {
    setLogoutError(null);
    setIsLoggingOut(true);

    try {
      await logout();
      void navigate('/login', { replace: true });
    } catch (error: unknown) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : 'Não foi possível sair. Tente novamente.',
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <NavLink className="flex items-center gap-3" end to="/">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                DF
              </span>
              <span>
                <span className="block font-semibold tracking-tight">
                  Day Flow
                </span>
                <span className="block text-xs text-slate-500">
                  Organize o seu dia
                </span>
              </span>
            </NavLink>

            <div className="text-right lg:hidden">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="max-w-40 truncate text-xs text-slate-500">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-1">
            <nav
              aria-label="Navegação principal"
              className="flex items-center gap-1 overflow-x-auto lg:ml-8"
            >
              <NavLink
                className={({ isActive }) => navigationClass(isActive)}
                end
                to="/"
              >
                Rotina
              </NavLink>
              <NavLink
                className={({ isActive }) => navigationClass(isActive)}
                to="/calendar"
              >
                Calendário
              </NavLink>
              <NavLink
                className={({ isActive }) => navigationClass(isActive)}
                to="/categories"
              >
                Categorias
              </NavLink>
            </nav>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="hidden text-right lg:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="max-w-48 truncate text-xs text-slate-500">
                  {user.email}
                </p>
              </div>
              <button
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoggingOut}
                onClick={() => {
                  void handleLogout();
                }}
                type="button"
              >
                {isLoggingOut ? 'Saindo...' : 'Sair'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {logoutError ? (
            <p
              className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
              role="alert"
            >
              {logoutError}
            </p>
          ) : null}
          <Outlet context={user} />
        </div>
      </main>
    </div>
  );
}
