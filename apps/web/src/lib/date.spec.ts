import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  endOfMonth,
  formatLocalDate,
  parseLocalDate,
  startOfMonth,
} from './date.ts';

describe('date utilities', () => {
  it('formata a data sem converter o fuso horário', () => {
    expect(formatLocalDate(new Date(2026, 8, 25))).toBe('2026-09-25');
    expect(parseLocalDate('2026-09-25').getDate()).toBe(25);
  });

  it('navega entre dias e respeita anos bissextos', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('calcula os limites e a navegação dos meses', () => {
    expect(startOfMonth('2026-09-25')).toBe('2026-09-01');
    expect(endOfMonth('2026-09-25')).toBe('2026-09-30');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-01');
  });
});
