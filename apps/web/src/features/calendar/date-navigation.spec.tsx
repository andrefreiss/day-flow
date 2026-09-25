import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DateNavigation } from './date-navigation.tsx';

afterEach(cleanup);

describe('DateNavigation', () => {
  it('navega para o dia anterior e o próximo', () => {
    const onChange = vi.fn<(date: string) => void>();

    render(<DateNavigation date="2026-09-25" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dia anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }));

    expect(onChange).toHaveBeenNthCalledWith(1, '2026-09-24');
    expect(onChange).toHaveBeenNthCalledWith(2, '2026-09-26');
  });

  it('seleciona uma data informada pelo usuário', () => {
    const onChange = vi.fn<(date: string) => void>();

    render(<DateNavigation date="2026-09-25" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Escolher data'), {
      target: { value: '2026-10-03' },
    });

    expect(onChange).toHaveBeenCalledWith('2026-10-03');
  });
});
