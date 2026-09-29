function getApiUrl(): string {
  const value: unknown = import.meta.env.VITE_API_URL;

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('VITE_API_URL não está definida');
  }

  return value;
}

const apiUrl = getApiUrl();

type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);

  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);

  headers.set('Accept', 'application/json');

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    unauthorizedListeners.forEach((listener) => {
      listener();
    });
  }

  return response;
}
