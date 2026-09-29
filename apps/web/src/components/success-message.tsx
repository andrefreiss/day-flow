type SuccessMessageProps = { message: string | null; onDismiss: () => void };

export function SuccessMessage({ message, onDismiss }: SuccessMessageProps) {
  if (!message) return null;

  return (
    <div className="mt-4 flex items-start justify-between gap-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
      <p className="min-w-0 break-words" role="status">
        {message}
      </p>
      <button
        aria-label="Dispensar mensagem de sucesso"
        className="shrink-0 rounded px-2 font-medium underline hover:text-emerald-950"
        onClick={onDismiss}
        type="button"
      >
        Fechar
      </button>
    </div>
  );
}
