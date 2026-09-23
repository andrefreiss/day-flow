import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { logout, type User } from '../features/auth/auth-api.ts';

export function TodayPage() {
  const user = useOutletContext<User>();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogout(): Promise<void> {
    setErrorMessage(null);
    setIsLoggingOut(true);

    try {
      await logout();
      void navigate('/login', { replace: true });
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível sair. Tente novamente.',
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-900">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Day Flow
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Olá, {user.name}.
        </h1>

        <p className="mt-4 text-slate-600">
          Acompanhe suas tarefas e o progresso do seu dia.
        </p>

        {errorMessage ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button
          className="mt-8 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          disabled={isLoggingOut}
          onClick={() => {
            void handleLogout();
          }}
          type="button"
        >
          {isLoggingOut ? 'Saindo...' : 'Sair'}
        </button>
      </section>
    </main>
  );
}
