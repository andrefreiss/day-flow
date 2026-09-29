import { describe, expect, it } from 'vitest';
import { isCalendarDate } from './is-calendar-date.js';

describe('isCalendarDate', () => {
  it.each(['2026-09-29', '2026-12-31', '2028-02-29'])('aceita %s', (value) => {
    expect(isCalendarDate(value)).toBe(true);
  });

  it.each([
    '2026-02-29',
    '2026-02-30',
    '2026-09-31',
    '2026-13-01',
    '2026-00-10',
    '2026-09-00',
  ])('recusa a data inexistente %s', (value) => {
    expect(isCalendarDate(value)).toBe(false);
  });

  it.each(['29-09-2026', '2026-9-29', '2026-09-29T00:00:00.000Z', ''])(
    'recusa o formato %s',
    (value) => {
      expect(isCalendarDate(value)).toBe(false);
    },
  );

  it('recusa valores que não são texto', () => {
    expect(isCalendarDate(20260929)).toBe(false);
    expect(isCalendarDate(null)).toBe(false);
  });
});
