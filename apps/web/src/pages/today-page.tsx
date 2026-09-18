import { Link } from 'react-router';

export function TodayPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-900">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Day Flow
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Organize sua rotina.
        </h1>
        <p className="mt-4 text-slate-600">
          Acompanhe suas tarefas e o progresso do seu dia.
        </p>
        <Link
          className="mt-8 inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          to="/login"
        >
          Entrar
        </Link>
      </section>
    </main>
  );
}
