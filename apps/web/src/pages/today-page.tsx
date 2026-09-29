import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import { LoadError } from '../components/load-error.tsx';
import type { User } from '../features/auth/auth-api.ts';
import { DateNavigation } from '../features/calendar/date-navigation.tsx';
import { useCategories } from '../features/categories/use-categories.ts';
import {
  getDashboard,
  type DashboardSummary,
} from '../features/dashboard/dashboard-api.ts';
import { TaskForm } from '../features/tasks/task-form.tsx';
import { TasksList } from '../features/tasks/tasks-list.tsx';
import { formatLocalDate, formatLongDate } from '../lib/date.ts';

type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; summary: DashboardSummary };

export function TodayPage() {
  const user = useOutletContext<User>();
  const [referenceDate, setReferenceDate] = useState(() =>
    formatLocalDate(new Date()),
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [dashboardRetryKey, setDashboardRetryKey] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardState>({
    status: 'loading',
  });
  const {
    categories,
    error: categoriesError,
    refresh: refreshCategories,
  } = useCategories();

  function handleTasksChanged(): void {
    setRefreshKey((value) => value + 1);
  }

  function handleReferenceDateChange(date: string): void {
    setReferenceDate(date);
    setDashboard({ status: 'loading' });
  }

  useEffect(() => {
    let active = true;

    async function loadDashboard(): Promise<void> {
      try {
        const summary = await getDashboard(referenceDate);

        if (active) {
          setDashboard({ status: 'ready', summary });
        }
      } catch (error: unknown) {
        if (active) {
          setDashboard({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível carregar o resumo do dia',
          });
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [referenceDate, refreshKey, dashboardRetryKey]);

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Sua rotina
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Olá, {user.name}.
        </h1>
        <p className="mt-2 text-slate-600">
          Acompanhe o andamento do dia e mantenha o foco no que importa.
        </p>
      </header>

      {categoriesError ? (
        <LoadError
          message={`${categoriesError}. As tarefas continuam disponíveis.`}
          onRetry={refreshCategories}
          label="Recarregar categorias"
        />
      ) : null}

      <DateNavigation
        date={referenceDate}
        onChange={handleReferenceDateChange}
      />

      {dashboard.status === 'loading' ? (
        <p className="mt-8 text-slate-600" aria-live="polite">
          Carregando resumo...
        </p>
      ) : null}

      {dashboard.status === 'error' ? (
        <LoadError
          message={dashboard.message}
          onRetry={() => {
            setDashboard({ status: 'loading' });
            setDashboardRetryKey((value) => value + 1);
          }}
          label="Recarregar resumo"
        />
      ) : null}

      {dashboard.status === 'ready' ? (
        <>
          <div className="mt-8 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold">Resumo do dia</h2>
              <p className="mt-1 text-sm capitalize text-slate-500">
                {formatLongDate(dashboard.summary.date)}
              </p>
            </div>
          </div>

          <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <article className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total</p>
              <p className="mt-2 text-3xl font-semibold">
                {dashboard.summary.today.total}
              </p>
            </article>

            <article className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Concluídas</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">
                {dashboard.summary.today.completed}
              </p>
            </article>

            <article className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Pendentes</p>
              <p className="mt-2 text-3xl font-semibold text-amber-600">
                {dashboard.summary.today.pending}
              </p>
            </article>

            <article className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Atrasadas</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">
                {dashboard.summary.overdue}
              </p>
            </article>

            <article className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Próximas</p>
              <p className="mt-2 text-3xl font-semibold text-indigo-600">
                {dashboard.summary.upcoming}
              </p>
            </article>
          </section>

          <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Progresso do dia</h2>
              <span className="font-semibold text-indigo-600">
                {dashboard.summary.progress}%
              </span>
            </div>

            <div
              aria-label="Progresso do dia"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={dashboard.summary.progress}
              className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-indigo-600"
                style={{ width: `${dashboard.summary.progress}%` }}
              />
            </div>
          </section>
        </>
      ) : null}

      <TaskForm
        categories={categories}
        date={referenceDate}
        onCreated={handleTasksChanged}
      />
      <TasksList
        categories={categories}
        date={referenceDate}
        key={referenceDate}
        onChanged={handleTasksChanged}
        refreshKey={refreshKey}
      />
    </>
  );
}
