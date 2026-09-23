import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { register } from '../features/auth/auth-api.ts';

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegistration(): Promise<void> {
    const normalizedName = name.trim();

    if (normalizedName.length < 2) {
      setErrorMessage('O nome deve ter pelo menos 2 caracteres');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('As senhas não coincidem');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await register({
        name: normalizedName,
        email: email.trim(),
        password,
      });

      void navigate('/');
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar sua conta. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submitRegistration();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="font-medium text-indigo-600">Day Flow</p>

        <h1 className="mt-2 text-2xl font-semibold">Criar conta</h1>

        <p className="mt-2 text-slate-600">
          Cadastre-se para começar a organizar o seu dia.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium" htmlFor="name">
              Nome
            </label>

            <input
              autoComplete="name"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              disabled={isSubmitting}
              id="name"
              maxLength={80}
              minLength={2}
              name="name"
              onChange={(event) => {
                setName(event.target.value);
              }}
              required
              type="text"
              value={name}
            />
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="email">
              Email
            </label>

            <input
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              disabled={isSubmitting}
              id="email"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="password">
              Senha
            </label>

            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              disabled={isSubmitting}
              id="password"
              maxLength={128}
              minLength={8}
              name="password"
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              required
              type="password"
              value={password}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium"
              htmlFor="password-confirmation"
            >
              Confirmar senha
            </label>

            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              disabled={isSubmitting}
              id="password-confirmation"
              maxLength={128}
              minLength={8}
              name="passwordConfirmation"
              onChange={(event) => {
                setPasswordConfirmation(event.target.value);
              }}
              required
              type="password"
              value={passwordConfirmation}
            />
          </div>

          {errorMessage ? (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Já tem uma conta?{' '}
          <Link
            className="font-medium text-indigo-600 hover:text-indigo-700"
            to="/login"
          >
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
