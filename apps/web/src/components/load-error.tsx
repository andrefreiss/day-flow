type LoadErrorProps = { message: string; onRetry: () => void; label?: string };

export function LoadError({
  message,
  onRetry,
  label = 'Tentar novamente',
}: LoadErrorProps) {
  return (
    <div className="mt-5 rounded-lg bg-red-50 p-4">
      <p className="text-sm text-red-700" role="alert">
        {message}
      </p>
      <button
        className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        onClick={onRetry}
        type="button"
      >
        {label}
      </button>
    </div>
  );
}
