import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { getCurrentUser, type User } from './auth-api.ts';

type SessionState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; user: User | null };

export function ProtectedRoute() {
  const [session, setSession] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    async function checkSession(): Promise<void> {
      try {
        const user = await getCurrentUser();

        if (active) {
          setSession({ status: 'ready', user });
        }
      } catch {
        if (active) {
          setSession({ status: 'error' });
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (session.status === 'loading') {
    return <p className="p-6">Verificando sessão...</p>;
  }

  if (session.status === 'error') {
    return <p className="p-6">Não foi possível verificar sua sessão.</p>;
  }

  if (!session.user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet context={session.user} />;
}
