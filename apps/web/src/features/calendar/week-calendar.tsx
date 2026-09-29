import { useEffect, useState } from 'react';
import {
  addDays,
  endOfWeek,
  formatLocalDate,
  formatLongDate,
  parseLocalDate,
} from '../../lib/date.ts';
import { getTasksInRange, type Task } from '../tasks/tasks-api.ts';

type WeekCalendarProps = {
  week: string;
  selectedDate: string;
  refreshKey: number;
  onSelectDate: (date: string) => void;
};

type CalendarState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tasks: Task[] };

const shortDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const weekDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

export function WeekCalendar({
  week,
  selectedDate,
  refreshKey,
  onSelectDate,
}: WeekCalendarProps) {
  const [state, setState] = useState<CalendarState>({ status: 'loading' });
  const [retryKey, setRetryKey] = useState(0);
  const today = formatLocalDate(new Date());
  const days = Array.from({ length: 7 }, (_, index) => addDays(week, index));

  useEffect(() => {
    let active = true;

    async function loadTasks(): Promise<void> {
      try {
        const tasks = await getTasksInRange(week, endOfWeek(week));

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
                : 'Não foi possível carregar a semana',
          });
        }
      }
    }

    void loadTasks();

    return () => {
      active = false;
    };
  }, [week, refreshKey, retryKey]);

  const tasksByDate = new Map<string, Task[]>();

  if (state.status === 'ready') {
    for (const task of state.tasks) {
      const tasks = tasksByDate.get(task.date) ?? [];
      tasks.push(task);
      tasksByDate.set(task.date, tasks);
    }
  }

  return (
    <section
      aria-label="Calendário semanal"
      className="mt-6 rounded-xl bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="w-full text-lg font-semibold sm:order-2 sm:w-auto">
          {shortDate.format(parseLocalDate(week))} a{' '}
          {shortDate.format(parseLocalDate(endOfWeek(week)))}
        </h2>
        <button
          aria-label="Semana anterior"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 sm:order-1"
          onClick={() => onSelectDate(addDays(selectedDate, -7))}
          type="button"
        >
          Anterior
        </button>
        <button
          aria-label="Próxima semana"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 sm:order-3"
          onClick={() => onSelectDate(addDays(selectedDate, 7))}
          type="button"
        >
          Próxima
        </button>
      </div>

      {state.status === 'loading' ? (
        <p className="mt-5 text-sm text-slate-600" role="status">
          Carregando semana...
        </p>
      ) : null}

      {state.status === 'error' ? (
        <div className="mt-5 rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-700" role="alert">
            {state.message}
          </p>
          <button
            className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            onClick={() => {
              setState({ status: 'loading' });
              setRetryKey((value) => value + 1);
            }}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((date) => {
          const tasks = tasksByDate.get(date) ?? [];
          const completed = tasks.filter(
            (task) => task.status === 'DONE',
          ).length;

          return (
            <section
              aria-label={formatLongDate(date)}
              className={`min-w-0 rounded-lg border ${
                date === selectedDate
                  ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                  : 'border-slate-200'
              }`}
              key={date}
            >
              <h3>
                <button
                  aria-label={`Selecionar ${formatLongDate(date)}`}
                  aria-pressed={date === selectedDate}
                  className="w-full rounded-lg p-3 text-left hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
                  onClick={() => onSelectDate(date)}
                  type="button"
                >
                  <span className="block text-xs font-semibold uppercase text-slate-500">
                    {weekDay.format(parseLocalDate(date))}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xl font-semibold">
                      {parseLocalDate(date).getDate()}
                    </span>
                    {date === today ? (
                      <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                        Hoje
                      </span>
                    ) : null}
                  </span>
                </button>
              </h3>
              {state.status === 'ready' ? (
                <div className="px-3 pb-3">
                  {tasks.length === 0 ? (
                    <p className="text-xs text-slate-500">Sem tarefas</p>
                  ) : (
                    <>
                      <p className="mb-3 text-xs text-slate-500">
                        {completed}/{tasks.length} concluídas
                      </p>
                      <ul className="space-y-2">
                        {tasks.map((task) => (
                          <li
                            className="rounded-lg border border-slate-200 bg-white p-2 text-sm"
                            key={task.id}
                          >
                            <p className="text-xs text-slate-500">
                              {task.startTime
                                ? `${task.startTime}${task.endTime ? ` – ${task.endTime}` : ''}`
                                : 'Sem horário'}
                            </p>
                            <p
                              className={`mt-1 break-words font-medium ${task.status === 'DONE' ? 'text-slate-500 line-through' : 'text-slate-800'}`}
                            >
                              {task.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {task.status === 'DONE'
                                ? 'Concluída'
                                : 'Pendente'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Selecione um dia para criar ou editar suas tarefas abaixo.
      </p>
    </section>
  );
}
