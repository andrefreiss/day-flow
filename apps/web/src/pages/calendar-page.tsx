import { useState } from 'react';
import { DateNavigation } from '../features/calendar/date-navigation.tsx';
import { MonthCalendar } from '../features/calendar/month-calendar.tsx';
import { useCategories } from '../features/categories/use-categories.ts';
import { TaskForm } from '../features/tasks/task-form.tsx';
import { TasksList } from '../features/tasks/tasks-list.tsx';
import { formatLocalDate, startOfMonth } from '../lib/date.ts';

export function CalendarPage() {
  const [referenceDate, setReferenceDate] = useState(() =>
    formatLocalDate(new Date()),
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(formatLocalDate(new Date())),
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const { categories, error: categoriesError } = useCategories();

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
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          {categoriesError}. As tarefas continuam disponíveis sem o filtro de
          categorias.
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
