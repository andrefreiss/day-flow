import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { logout, type User } from '../features/auth/auth-api.ts';
import { DateNavigation } from '../features/calendar/date-navigation.tsx';
import { MonthCalendar } from '../features/calendar/month-calendar.tsx';
import {
  getCategories,
  type Category,
} from '../features/categories/categories-api.ts';
import { CategoriesPanel } from '../features/categories/categories-panel.tsx';
import {
  getDashboard,
  type DashboardSummary,
} from '../features/dashboard/dashboard-api.ts';
import { formatLocalDate, formatLongDate, startOfMonth } from '../lib/date.ts';
import { TaskForm } from '../features/tasks/task-form.tsx';
import { TasksList } from '../features/tasks/tasks-list.tsx';

type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; summary: DashboardSummary };

type CategoriesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; categories: Category[] };

export function TodayPage() {
  const user = useOutletContext<User>();
  const navigate = useNavigate();
  const [referenceDate, setReferenceDate] = useState(() =>
    formatLocalDate(new Date()),
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(formatLocalDate(new Date())),
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoriesRefreshKey, setCategoriesRefreshKey] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardState>({
    status: 'loading',
  });
  const [categoriesState, setCategoriesState] = useState<CategoriesState>({
    status: 'loading',
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  function handleTasksChanged(): void {
    setRefreshKey((value) => value + 1);
  }

  function handleReferenceDateChange(date: string): void {
    setReferenceDate(date);
    setCalendarMonth(startOfMonth(date));
    setDashboard({ status: 'loading' });
  }

  function handleCategoriesChanged(): void {
    setCategoriesRefreshKey((value) => value + 1);
    setRefreshKey((value) => value + 1);
  }

  useEffect(() => {
    let active = true;

    async function loadCategories(): Promise<void> {
      try {
        const categories = await getCategories();

        if (active) {
          setCategoriesState({ status: 'ready', categories });
        }
      } catch (error: unknown) {
        if (active) {
          setCategoriesState({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível carregar as categorias',
          });
        }
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, [categoriesRefreshKey]);

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
  }, [referenceDate, refreshKey]);

  async function handleLogout(): Promise<void> {
    setLogoutError(null);
    setIsLoggingOut(true);

    try {
      await logout();
      void navigate('/login', { replace: true });
    } catch (error: unknown) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : 'Não foi possível sair. Tente novamente.',
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  const categories =
    categoriesState.status === 'ready' ? categoriesState.categories : [];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Day Flow
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Olá, {user.name}.
            </h1>

            <p className="mt-1 text-slate-600">
              Acompanhe o andamento do seu dia.
            </p>
          </div>

          <button
            className="self-start rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-100 disabled:opacity-60"
            disabled={isLoggingOut}
            onClick={() => {
              void handleLogout();
            }}
            type="button"
          >
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </button>
        </header>

        {logoutError ? (
          <p className="mt-6 text-sm text-red-700" role="alert">
            {logoutError}
          </p>
        ) : null}

        <DateNavigation
          date={referenceDate}
          onChange={handleReferenceDateChange}
        />
        <MonthCalendar
          key={calendarMonth}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          onSelectDate={handleReferenceDateChange}
          refreshKey={refreshKey}
          selectedDate={referenceDate}
        />

        {dashboard.status === 'loading' ? (
          <p className="mt-8 text-slate-600" aria-live="polite">
            Carregando resumo...
          </p>
        ) : null}

        {dashboard.status === 'error' ? (
          <p
            className="mt-8 rounded-xl bg-red-50 p-4 text-red-700"
            role="alert"
          >
            {dashboard.message}
          </p>
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
        <CategoriesPanel
          categories={categories}
          error={
            categoriesState.status === 'error' ? categoriesState.message : null
          }
          isLoading={categoriesState.status === 'loading'}
          onChanged={handleCategoriesChanged}
        />
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
      </div>
    </main>
  );
}
