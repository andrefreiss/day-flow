import { Link } from 'react-router';

export function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-900">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="mt-2 text-slate-600">
          Acesse sua conta para organizar o seu dia.
        </p>
        <Link
          className="mt-6 inline-flex font-medium text-indigo-600 hover:text-indigo-700"
          to="/"
        >
          Voltar
        </Link>
      </section>
    </main>
  );
}
