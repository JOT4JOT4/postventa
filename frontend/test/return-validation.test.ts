import { describe, expect, it, vi } from 'vitest';
import { isReturnDate, today } from '../src/returns/return-validation';

describe('HU-06: fechas de devolución', () => {
  it.each(['2026-02-29', '2026-04-31', '2026-13-01', '0000-01-01', '', '14-11-2026',
    '2026-11-14T00:00:00Z'])('rechaza fecha inválida %s', value => {
    expect(isReturnDate(value)).toBe(false);
  });
  it.each(['2024-02-29', '2026-11-14'])('acepta fecha calendario %s', value => {
    expect(isReturnDate(value)).toBe(true);
  });
  it('usa el día local del equipo para el valor inicial', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 10, 14, 22, 30));
      expect(today()).toBe('2026-11-14');
    } finally { vi.useRealTimers(); }
  });
});
