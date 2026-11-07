import { describe, expect, it } from 'vitest';
import { buildDetail, idOfFolder, parseDate, parseProgramme } from '../../scripts/details-lib.mjs';

describe('parseDate', () => {
  it('lit une date en arabe', () => {
    expect(parseDate('30 أبريل 2026')).toBe('2026-04-30');
    expect(parseDate(' 01 أكتوبر 2025 ')).toBe('2025-10-01');
    expect(parseDate('5 يوليو 2027')).toBe('2027-07-05');
  });
  it("accepte les noms de mois d'Algérie", () => {
    expect(parseDate('12 جانفي 2026')).toBe('2026-01-12');
    expect(parseDate('3 جوان 2026')).toBe('2026-06-03');
  });
  it('rend null quand le format est inconnu', () => {
    expect(parseDate('bientôt')).toBeNull();
    expect(parseDate('30 شهر 2026')).toBeNull();
    expect(parseDate('45 أبريل 2026')).toBeNull();
    expect(parseDate(undefined)).toBeNull();
  });
});

describe('parseProgramme', () => {
  it('sépare les dates et le thème', () => {
    expect(
      parseProgramme({ title: 'نادي الايروبيك', dates: '04 نوفمبر 2025 — 30 يونيو 2027 · الرياضة الترفيهية' }),
    ).toEqual({
      title: 'نادي الايروبيك',
      from: '2025-11-04',
      to: '2027-06-30',
      theme: 'الرياضة الترفيهية',
    });
  });
  it('garde le titre quand les dates manquent', () => {
    expect(parseProgramme({ title: 'نادي', dates: null })).toEqual({
      title: 'نادي',
      from: null,
      to: null,
      theme: null,
    });
  });
  it('ignore une activité sans titre', () => {
    expect(parseProgramme({ title: '  ', dates: '01 أكتوبر 2025' })).toBeNull();
  });
});

describe('buildDetail', () => {
  const full = {
    phone: '034 31 23 40',
    email: 'csptazmalt@odejbejaia-dz.com',
    address: 'بلدية تازمالت بجاية',
    description: 'المركب الرياضي الجواري مؤسسة شبابية',
    foundedYear: 1998,
    capacity: 120,
    accessible: true,
    activities: [{ title: 'نادي', dates: '30 أبريل 2026 — 31 ديسمبر 2026 · برنامج' }],
  };

  it("garde ce que dit l'info.json", () => {
    expect(buildDetail(full)).toEqual({
      phone: '034 31 23 40',
      email: 'csptazmalt@odejbejaia-dz.com',
      address: 'بلدية تازمالت بجاية',
      description: 'المركب الرياضي الجواري مؤسسة شبابية',
      foundedYear: 1998,
      capacity: 120,
      accessible: true,
      programme: [{ title: 'نادي', from: '2026-04-30', to: '2026-12-31', theme: 'برنامج' }],
    });
  });
  it("omet ce qui est absent plutôt que de l'inventer", () => {
    expect(buildDetail({ phone: null, email: 'a@b.dz', activities: [] })).toEqual({ email: 'a@b.dz' });
  });
  it('ne tient pas « pas accessible » pour un fait', () => {
    expect(buildDetail({ phone: '1', accessible: null })).toEqual({ phone: '1' });
    expect(buildDetail({ phone: '1', accessible: false })).toEqual({ phone: '1' });
  });
  it("écarte une description qui n'est pas en arabe", () => {
    expect(buildDetail({ phone: '1', description: 'Sports et loisirs' })).toEqual({ phone: '1' });
  });
  it('écarte une adresse qui est un lien ou un mot de page', () => {
    expect(buildDetail({ phone: '1', address: 'Coordonnées' })).toEqual({ phone: '1' });
    expect(buildDetail({ phone: '1', address: 'https://www.google.com/maps/x' })).toEqual({ phone: '1' });
  });
  it('rend null sans rien à afficher', () => {
    expect(buildDetail({ phone: null, email: null, activities: [] })).toBeNull();
  });
});

describe('idOfFolder', () => {
  it("donne l'id depuis le nom du dossier", () => {
    expect(idOfFolder('017-الشهيد عبد الرحمان فارس أقبو')).toBe('odej-017');
    expect(idOfFolder('notes')).toBeNull();
  });
});
