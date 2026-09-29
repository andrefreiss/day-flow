import { useState } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeleteConfirmation } from './delete-confirmation.tsx';

afterEach(cleanup);

describe('DeleteConfirmation', () => {
  it('foca cancelar, aceita Escape e devolve o foco sem excluir', () => {
    const onConfirm = vi.fn<() => Promise<void>>();
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)} type="button">
            Excluir
          </button>
          {open ? (
            <DeleteConfirmation
              title="Excluir item"
              description="A exclusão é permanente."
              onConfirm={onConfirm}
              onCancel={() => setOpen(false)}
            />
          ) : null}
        </>
      );
    }
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Excluir' });
    trigger.focus();
    fireEvent.click(trigger);
    const cancel = screen.getByRole('button', { name: 'Cancelar' });
    expect(document.activeElement).toBe(cancel);
    fireEvent.keyDown(cancel, { key: 'Escape' });
    expect(screen.queryByRole('group')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('bloqueia cliques repetidos e cancelamento enquanto a exclusão está pendente', async () => {
    let finish!: () => void;
    const request = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const onConfirm = vi.fn(() => request);
    const onCancel = vi.fn();
    render(
      <DeleteConfirmation
        title="Excluir item"
        description="A exclusão é permanente."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    const confirm = screen.getByRole('button', { name: 'Confirmar exclusão' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.keyDown(screen.getByRole('group'), { key: 'Escape' });
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('group').getAttribute('aria-busy')).toBe('true');
    await act(async () => {
      finish();
      await request;
    });
    expect(screen.getByRole('group').getAttribute('aria-busy')).toBe('false');
  });

  it('mantém a confirmação aberta após erro e permite tentar novamente', async () => {
    const onConfirm = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('Falha ao excluir'))
      .mockResolvedValueOnce();
    render(
      <DeleteConfirmation
        title="Excluir item"
        description="A exclusão é permanente."
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Falha ao excluir',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    await screen.findByRole('button', { name: 'Confirmar exclusão' });
    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
