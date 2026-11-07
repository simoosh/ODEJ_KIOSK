import { describe, expect, it } from 'vitest';
import { formatDate, formatRange } from '../../src/lib/dates';

describe('dates', () => {
  it('formate en anglais', () => {
    expect(formatDate('2026-04-30', 'en')).toBe('30 Apr 2026');
  });
  it('formate en arabe avec des chiffres latins', () => {
    const text = formatDate('2026-04-30', 'ar');
    expect(text).toMatch(/30/);
    expect(text).toMatch(/2026/);
    expect(text).toMatch(/\p{Script=Arabic}/u);
  });
  it('ne décale pas la date selon le fuseau', () => {
    expect(formatDate('2026-01-01', 'en')).toBe('1 Jan 2026');
    expect(formatDate('2026-12-31', 'en')).toBe('31 Dec 2026');
  });
  it('rend une chaîne vide pour une date illisible', () => {
    expect(formatDate(null, 'en')).toBe('');
    expect(formatDate('demain', 'en')).toBe('');
  });
  it('compose une période, ou une seule date', () => {
    expect(formatRange('2026-04-30', '2026-12-31', 'en')).toBe('30 Apr 2026 – 31 Dec 2026');
    expect(formatRange('2026-04-30', null, 'en')).toBe('30 Apr 2026');
    expect(formatRange(null, null, 'en')).toBe('');
  });
});
