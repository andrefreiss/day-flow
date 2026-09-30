import { useEffect, useState } from 'react';

export const slowStartDelayMs = 5000;

export function SessionCheck() {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsSlow(true);
    }, slowStartDelayMs);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div aria-live="polite" className="p-6">
      <p>Verificando sessão...</p>
      {isSlow ? (
        <p className="mt-2 text-sm text-slate-600">
          O servidor está iniciando. Isso pode levar até um minuto.
        </p>
      ) : null}
    </div>
  );
}
