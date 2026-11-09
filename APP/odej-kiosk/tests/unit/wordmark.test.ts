import { describe, expect, it } from 'vitest';
import { fragmentAt, fragments, irisAt, irisOrigin, PHASES, TITLES } from '../../src/wordmark/timeline';

describe("titre animé de l'accueil", () => {
  const ar = fragments(TITLES.ar);
  const en = fragments(TITLES.en);

  it('a les couleurs demandées : arabe vert puis dernier mot rouge, anglais O rouge, DEJ vert, of neutre, Béjaia drapeau', () => {
    expect(TITLES.ar.words.map((w) => w.fill)).toEqual(['green', 'green', 'red']);
    expect(TITLES.en.words.map((w) => [w.text, w.fill])).toEqual([
      ['O', 'red'],
      ['DEJ', 'green'],
      ['of', 'neutral'],
      ['Béjaia', 'flag'],
    ]);
  });

  it('est complet au début et à la fin du cycle, vide au début de la reconstruction', () => {
    const at = (t: number) => ar.map((f, i) => fragmentAt(f, i, ar.length, t));
    expect(at(0).every((s) => s.opacity === 1 && s.transform === '')).toBe(true);
    expect(at(PHASES.assemble).every((s) => s.opacity === 0)).toBe(true);
    expect(at(PHASES.irisEnd).every((s) => s.opacity === 1 && s.transform === '')).toBe(true);
  });

  it('se reconstruit dans le sens de lecture : de droite à gauche en arabe, de gauche à droite en anglais', () => {
    const first = (list: typeof ar) => list.reduce((a, b) => (b.delay < a.delay ? b : a));
    const last = (list: typeof ar) => list.reduce((a, b) => (b.delay > a.delay ? b : a));
    expect(first(ar).pivot[0]).toBeGreaterThan(last(ar).pivot[0]);
    expect(first(en).pivot[0]).toBeLessThan(last(en).pivot[0]);
  });

  it('ouvre son cercle depuis le bout de la lecture, et seulement à la fin', () => {
    expect(irisOrigin(TITLES.ar)[0]).toBeLessThan((TITLES.ar.box[0] + TITLES.ar.box[2]) / 2);
    expect(irisOrigin(TITLES.en)[0]).toBeGreaterThan((TITLES.en.box[0] + TITLES.en.box[2]) / 2);
    expect(irisAt(PHASES.assemble)).toBe(0);
    expect(irisAt(PHASES.irisEnd)).toBe(1);
  });
});
