import { describe, expect, it } from 'vitest';
import { fragmentAt, fragments, irisAt, irisOrigin, PHASES, TITLES } from '../../src/wordmark/timeline';

describe("titre animé de l'accueil", () => {
  const ar = fragments(TITLES.ar);
  const en = fragments(TITLES.en);

  it('a les couleurs demandées : arabe vert puis dernier mot rouge, anglais ODEJ du vert au blanc, of neutre, Béjaia du blanc au rouge', () => {
    expect(TITLES.ar.words.map((w) => w.fill)).toEqual(['green', 'green', 'green', 'red']);
    expect(TITLES.en.words.map((w) => [w.text, w.fill])).toEqual([
      ['O', 'green'],
      ['DEJ', 'green'],
      ['of', 'neutral'],
      ['Béjaia', 'red'],
    ]);
  });

  it('est complet au début et à la fin du cycle, effacé au début du tracé', () => {
    const at = (t: number) => ar.map((f, i) => fragmentAt(f, i, ar.length, t));
    expect(at(0).every((s) => s.draw === 1 && s.fill === 1)).toBe(true);
    expect(at(PHASES.assemble).every((s) => s.draw === 0 && s.fill === 0)).toBe(true);
    expect(at(PHASES.irisEnd).every((s) => s.draw === 1 && s.fill === 1)).toBe(true);
  });

  it('se dessine dans le sens de lecture : de droite à gauche en arabe, de gauche à droite en anglais', () => {
    const first = (list: typeof ar) => list.reduce((a, b) => (b.delay < a.delay ? b : a));
    const last = (list: typeof ar) => list.reduce((a, b) => (b.delay > a.delay ? b : a));
    expect(first(ar).cx).toBeGreaterThan(last(ar).cx);
    expect(first(en).cx).toBeLessThan(last(en).cx);
  });

  it('ouvre son cercle depuis le bout de la lecture, et seulement à la fin', () => {
    expect(irisOrigin(TITLES.ar)[0]).toBeLessThan((TITLES.ar.box[0] + TITLES.ar.box[2]) / 2);
    expect(irisOrigin(TITLES.en)[0]).toBeGreaterThan((TITLES.en.box[0] + TITLES.en.box[2]) / 2);
    expect(irisAt(PHASES.assemble)).toBe(0);
    expect(irisAt(PHASES.irisEnd)).toBe(1);
  });
});
