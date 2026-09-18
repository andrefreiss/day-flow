import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center text-slate-900">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Erro 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Página não encontrada</h1>
        <Link
          className="mt-6 inline-flex font-medium text-indigo-600 hover:text-indigo-700"
          to="/"
        >
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
