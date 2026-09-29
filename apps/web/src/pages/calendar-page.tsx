import { useState } from 'react';
import { LoadError } from '../components/load-error.tsx';
import { DateNavigation } from '../features/calendar/date-navigation.tsx';
import { MonthCalendar } from '../features/calendar/month-calendar.tsx';
import { WeekCalendar } from '../features/calendar/week-calendar.tsx';
import { useCategories } from '../features/categories/use-categories.ts';
import { TaskForm } from '../features/tasks/task-form.tsx';
import { TasksList } from '../features/tasks/tasks-list.tsx';
import { formatLocalDate, startOfMonth, startOfWeek } from '../lib/date.ts';

type CalendarView = 'month' | 'week' | 'day';

const calendarViews: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
];

export function CalendarPage() {
  const [view, setView] = useState<CalendarView>('month');
  const [referenceDate, setReferenceDate] = useState(() =>
    formatLocalDate(new Date()),
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(formatLocalDate(new Date())),
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const {
    categories,
    error: categoriesError,
    refresh: refreshCategories,
  } = useCategories();

  function handleReferenceDateChange(date: string): void {
    setReferenceDate(date);
    setCalendarMonth(startOfMonth(date));
  }

  function handleTasksChanged(): void {
    setRefreshKey((value) => value + 1);
  }

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Planejamento
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Calendário
        </h1>
        <p className="mt-2 text-slate-600">
          Visualize a distribuição das tarefas e planeje qualquer data.
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
      <div
        aria-label="Visualização do calendário"
        className="mt-6 flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1"
        role="group"
      >
        {calendarViews.map((option) => (
          <button
            aria-pressed={view === option.value}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === option.value ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            key={option.value}
            onClick={() => {
              setView(option.value);
              setCalendarMonth(startOfMonth(referenceDate));
            }}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      {view === 'month' ? (
        <MonthCalendar
          key={`month:${calendarMonth}`}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          onSelectDate={handleReferenceDateChange}
          refreshKey={refreshKey}
          selectedDate={referenceDate}
        />
      ) : null}
      {view === 'week' ? (
        <WeekCalendar
          key={`week:${startOfWeek(referenceDate)}`}
          week={startOfWeek(referenceDate)}
          onSelectDate={handleReferenceDateChange}
          refreshKey={refreshKey}
          selectedDate={referenceDate}
        />
      ) : null}
      <TaskForm
        categories={categories}
        date={referenceDate}
        onCreated={handleTasksChanged}
      />
      <TasksList
        categories={categories}
        date={referenceDate}
        key={`tasks:${referenceDate}`}
        onChanged={handleTasksChanged}
        refreshKey={refreshKey}
      />
    </>
  );
}
