import { useEffect, useId, useRef, useState } from 'react';

type DeleteConfirmationProps = {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function DeleteConfirmation({
  title,
  description,
  onConfirm,
  onCancel,
}: DeleteConfirmationProps) {
  const id = useId();
  const cancelButton = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    cancelButton.current?.focus();

    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  async function confirm(): Promise<void> {
    if (submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível excluir. Tente novamente.',
      );
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div
      aria-describedby={`${id}-description`}
      aria-labelledby={`${id}-title`}
      aria-busy={isSubmitting}
      className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !submitting.current) {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }
      }}
      role="group"
    >
      <h3 className="font-semibold text-red-900" id={`${id}-title`}>
        {title}
      </h3>
      <p
        className="mt-2 break-words text-sm text-red-800"
        id={`${id}-description`}
      >
        {description}
      </p>
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60"
          disabled={isSubmitting}
          onClick={onCancel}
          ref={cancelButton}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
          disabled={isSubmitting}
          onClick={() => {
            void confirm();
          }}
          type="button"
        >
          {isSubmitting ? 'Excluindo...' : 'Confirmar exclusão'}
        </button>
      </div>
    </div>
  );
}
