import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, onUnauthorized } from './api.ts';

function stubFetchStatus(status: number): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(null, { status })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('envia o cookie de sessão em todas as chamadas', async () => {
    stubFetchStatus(200);

    await apiFetch('/tasks');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/tasks',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('avisa quem escuta quando a API responde 401', async () => {
    const listener = vi.fn();
    const stopListening = onUnauthorized(listener);
    stubFetchStatus(401);

    const response = await apiFetch('/tasks');

    expect(response.status).toBe(401);
    expect(listener).toHaveBeenCalledOnce();
    stopListening();
  });

  it('não avisa em respostas de sucesso ou de outros erros', async () => {
    const listener = vi.fn();
    const stopListening = onUnauthorized(listener);

    stubFetchStatus(200);
    await apiFetch('/tasks');
    stubFetchStatus(500);
    await apiFetch('/tasks');

    expect(listener).not.toHaveBeenCalled();
    stopListening();
  });

  it('para de avisar depois de cancelada a inscrição', async () => {
    const listener = vi.fn();
    const stopListening = onUnauthorized(listener);
    stubFetchStatus(401);

    stopListening();
    await apiFetch('/tasks');

    expect(listener).not.toHaveBeenCalled();
  });
});
