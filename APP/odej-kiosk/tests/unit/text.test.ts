import { describe, expect, it } from 'vitest';
import { matchScore, normalize } from '../../src/lib/text';

describe('normalize', () => {
  it('unifie les formes de alef, ta marbuta, alef maqsura et hamza', () => {
    expect(normalize('أقبو')).toBe('اقبو');
    expect(normalize('إآٱ')).toBe('ااا');
    expect(normalize('مدرسة')).toBe('مدرسه');
    expect(normalize('مصطفى')).toBe('مصطفي');
    expect(normalize('مؤسسة')).toBe('موسسه');
    expect(normalize('رئيس')).toBe('رييس');
  });

  it('retire le tashkeel et le tatweel', () => {
    expect(normalize('بَجَايَة')).toBe('بجايه');
    expect(normalize('بـجـاية')).toBe('بجايه');
  });

  it('retire les accents latins et met en minuscules', () => {
    expect(normalize('Béjaïa')).toBe('bejaia');
  });

  it('retire apostrophes et tirets, réduit les espaces', () => {
    expect(normalize("  Aït   R'zine ")).toBe('ait rzine');
    expect(normalize('Sidi-Aïch')).toBe('sidiaich');
  });
});

describe('matchScore', () => {
  it('renvoie 3 quand le texte commence par la recherche', () => {
    expect(matchScore('أقبو', 'اقبو')).toBe(3);
  });

  it('renvoie 2 quand un mot commence par la recherche', () => {
    expect(matchScore('دار الشباب أقبو', 'اقبو')).toBe(2);
  });

  it("ignore l'article ال en début de mot", () => {
    expect(matchScore('دار الشباب', 'شباب')).toBe(2);
  });

  it('renvoie 1 quand le texte contient la recherche', () => {
    expect(matchScore('Bejaia', 'jai')).toBe(1);
  });

  it('renvoie 0 sans correspondance ou avec une recherche vide', () => {
    expect(matchScore('Bejaia', 'akbou')).toBe(0);
    expect(matchScore('Bejaia', '')).toBe(0);
  });
});
