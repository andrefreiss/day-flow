import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  endOfMonth,
  formatLocalDate,
  formatMonth,
  parseLocalDate,
} from '../../lib/date.ts';
import { getTasksInRange, type Task } from '../tasks/tasks-api.ts';

type MonthCalendarProps = {
  month: string;
  onMonthChange: (month: string) => void;
  onSelectDate: (date: string) => void;
  refreshKey: number;
  selectedDate: string;
};

type CalendarState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tasks: Task[] };

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function MonthCalendar({
  month,
  onMonthChange,
  onSelectDate,
  refreshKey,
  selectedDate,
}: MonthCalendarProps) {
  const [state, setState] = useState<CalendarState>({ status: 'loading' });
  const today = formatLocalDate(new Date());

  useEffect(() => {
    let active = true;

    async function loadTasks(): Promise<void> {
      try {
        const tasks = await getTasksInRange(month, endOfMonth(month));

        if (active) {
          setState({ status: 'ready', tasks });
        }
      } catch (error: unknown) {
        if (active) {
          setState({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível carregar o calendário',
          });
        }
      }
    }

    void loadTasks();

    return () => {
      active = false;
    };
  }, [month, refreshKey]);

  const tasksByDate = useMemo(() => {
    const result = new Map<string, { completed: number; total: number }>();

    if (state.status !== 'ready') {
      return result;
    }

    for (const task of state.tasks) {
      const date = task.date.slice(0, 10);
      const current = result.get(date) ?? { completed: 0, total: 0 };
      current.total += 1;

      if (task.status === 'DONE') {
        current.completed += 1;
      }

      result.set(date, current);
    }

    return result;
  }, [state]);

  const monthDate = parseLocalDate(month);
  const daysInMonth = parseLocalDate(endOfMonth(month)).getDate();
  const emptyDays = monthDate.getDay();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  return (
    <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <button
          aria-label="Mês anterior"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
          onClick={() => {
            onMonthChange(addMonths(month, -1));
          }}
          type="button"
        >
          Anterior
        </button>
        <h2 className="text-lg font-semibold capitalize">
          {formatMonth(month)}
        </h2>
        <button
          aria-label="Próximo mês"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
          onClick={() => {
            onMonthChange(addMonths(month, 1));
          }}
          type="button"
        >
          Próximo
        </button>
      </div>

      {state.status === 'loading' ? (
        <p className="mt-5 text-sm text-slate-600" aria-live="polite">
          Carregando calendário...
        </p>
      ) : null}

      {state.status === 'error' ? (
        <p className="mt-5 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-7 gap-1 text-center">
        {weekDays.map((weekDay) => (
          <div
            className="py-2 text-xs font-semibold uppercase text-slate-500"
            key={weekDay}
          >
            {weekDay}
          </div>
        ))}

        {Array.from({ length: emptyDays }, (_, index) => (
          <div aria-hidden="true" key={`empty-${index}`} />
        ))}

        {days.map((day) => {
          const date = formatLocalDate(
            new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
          );
          const taskCount = tasksByDate.get(date);
          const isSelected = date === selectedDate;
          const isToday = date === today;

          return (
            <button
              aria-label={`${day} de ${formatMonth(month)}${taskCount ? `, ${taskCount.total} tarefas` : ''}`}
              aria-pressed={isSelected}
              className={`min-h-20 rounded-lg border p-2 text-left transition sm:min-h-24 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
              key={date}
              onClick={() => {
                onSelectDate(date);
              }}
              type="button"
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                  isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'
                }`}
              >
                {day}
              </span>
              {taskCount ? (
                <span className="mt-2 block text-xs text-slate-600">
                  {taskCount.completed}/{taskCount.total}
                  <span className="hidden sm:inline"> concluídas</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
