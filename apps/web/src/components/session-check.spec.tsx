import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionCheck, slowStartDelayMs } from './session-check.tsx';

const slowStartMessage =
  'O servidor está iniciando. Isso pode levar até um minuto.';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SessionCheck', () => {
  it('avisa que o servidor está iniciando quando a verificação demora', () => {
    vi.useFakeTimers();
    render(<SessionCheck />);

    expect(screen.getByText('Verificando sessão...')).toBeTruthy();
    expect(screen.queryByText(slowStartMessage)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(slowStartDelayMs);
    });

    expect(screen.getByText(slowStartMessage)).toBeTruthy();
  });

  it('não mostra o aviso antes do tempo limite', () => {
    vi.useFakeTimers();
    render(<SessionCheck />);

    act(() => {
      vi.advanceTimersByTime(slowStartDelayMs - 1);
    });

    expect(screen.queryByText(slowStartMessage)).toBeNull();
  });
});
