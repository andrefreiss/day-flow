import { addDays, formatLocalDate, formatLongDate } from '../../lib/date.ts';

type DateNavigationProps = {
  date: string;
  onChange: (date: string) => void;
};

export function DateNavigation({ date, onChange }: DateNavigationProps) {
  const today = formatLocalDate(new Date());

  return (
    <section className="mt-8 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            {date === today ? 'Hoje' : 'Data selecionada'}
          </p>
          <h2 className="mt-1 text-xl font-semibold capitalize">
            {formatLongDate(date)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-label="Dia anterior"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium hover:bg-slate-50"
            onClick={() => {
              onChange(addDays(date, -1));
            }}
            type="button"
          >
            Anterior
          </button>
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={date === today}
            onClick={() => {
              onChange(today);
            }}
            type="button"
          >
            Hoje
          </button>
          <button
            aria-label="Próximo dia"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium hover:bg-slate-50"
            onClick={() => {
              onChange(addDays(date, 1));
            }}
            type="button"
          >
            Próximo
          </button>
          <label className="sr-only" htmlFor="selected-date">
            Escolher data
          </label>
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            id="selected-date"
            onChange={(event) => {
              if (event.target.value) {
                onChange(event.target.value);
              }
            }}
            type="date"
            value={date}
          />
        </div>
      </div>
    </section>
  );
}
