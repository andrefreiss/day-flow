function getApiUrl(): string {
  const value: unknown = import.meta.env.VITE_API_URL;

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('VITE_API_URL não está definida');
  }

  return value;
}

const apiUrl = getApiUrl();

export function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  headers.set('Accept', 'application/json');

  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
}
