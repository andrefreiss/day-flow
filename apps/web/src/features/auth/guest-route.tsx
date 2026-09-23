import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { getCurrentUser } from './auth-api.ts';

type GuestState = 'loading' | 'guest' | 'authenticated' | 'error';

export function GuestRoute() {
  const [status, setStatus] = useState<GuestState>('loading');

  useEffect(() => {
    let active = true;

    async function checkSession(): Promise<void> {
      try {
        const user = await getCurrentUser();

        if (active) {
          setStatus(user ? 'authenticated' : 'guest');
        }
      } catch {
        if (active) {
          setStatus('error');
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (status === 'loading') {
    return <p className="p-6">Verificando sessão...</p>;
  }

  if (status === 'error') {
    return <p className="p-6">Não foi possível verificar sua sessão.</p>;
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
