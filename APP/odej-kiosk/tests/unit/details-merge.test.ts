import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EstablishmentDetail } from '../../src/components/EstablishmentDetail';
import { buildIndexes, withDetails, withMedia } from '../../src/data/model';
import { I18nProvider } from '../../src/i18n/I18n';
import type { DetailsIndex, Establishment, KioskData, Locale } from '../../src/types';

const est = (id: string, extra: Partial<Establishment> = {}): Establishment => ({
  id,
  name: { ar: `اسم ${id}`, en: `Name ${id}` },
  category: 'youth-centre',
  placeId: 'adekar',
  location: { lat: 36.7, lng: 5 },
  ...extra,
});

const base = (list: Establishment[]) =>
  ({
    wilaya: { name: { ar: 'بجاية', en: 'Bejaia' } },
    categories: [
      {
        id: 'youth-centre',
        label: { ar: 'دار الشباب', en: 'Youth centre' },
        color: '#1f6e3e',
        icon: 'house',
        defaultActivities: ['sport'],
      },
    ],
    activities: [{ id: 'sport', label: { ar: 'رياضة', en: 'Sport' } }],
    places: [{ id: 'adekar', name: { ar: 'أدكار', en: 'Adekar' }, kind: 'commune' }],
    establishments: list,
  }) as unknown as KioskData;

const details: DetailsIndex = {
  'odej-001': {
    phone: '034 31 23 40',
    email: 'mj@odejbejaia-dz.com',
    address: 'بلدية أدكار',
    description: 'نص الوصف بالعربية',
    foundedYear: 1998,
    capacity: 120,
    accessible: true,
    programme: [{ title: 'نادي الايروبيك', from: '2026-04-30', to: '2026-12-31', theme: 'الرياضة' }],
  },
};

describe('withDetails', () => {
  it('ajoute le contact, la description, les faits et le programme', () => {
    const [e] = withDetails(base([est('odej-001')]), details).establishments;
    expect(e.contact).toMatchObject({ phone: '034 31 23 40', email: 'mj@odejbejaia-dz.com', address: 'بلدية أدكار' });
    expect(e.description).toEqual({ ar: 'نص الوصف بالعربية', en: null });
    expect(e.facts).toMatchObject({ foundedYear: 1998, capacity: 120, accessible: true });
    expect(e.programme).toHaveLength(1);
  });

  it('garde la description des données, relue et traduite', () => {
    const own = { ar: 'وصف مراجع', en: 'Reviewed text' };
    const [e] = withDetails(base([est('odej-001', { description: own })]), details).establishments;
    expect(e.description).toEqual(own);
  });

  it("laisse le contact des données quand l'info.json n'a pas la valeur", () => {
    const only: DetailsIndex = { 'odej-001': { email: 'new@odejbejaia-dz.com' } };
    const [e] = withDetails(
      base([est('odej-001', { contact: { phone: '000', facebook: 'https://fb.example/x' } })]),
      only,
    ).establishments;
    expect(e.contact).toMatchObject({ phone: '000', email: 'new@odejbejaia-dz.com', facebook: 'https://fb.example/x' });
  });

  it('ne touche ni aux horaires ni à un établissement sans entrée', () => {
    const hours = { ar: 'مفتوح', en: 'Open' };
    const list = [est('odej-001', { openingHours: hours }), est('odej-002')];
    const [a, b] = withDetails(base(list), details).establishments;
    expect(a.openingHours).toEqual(hours);
    expect(b).toBe(list[1]);
  });
});

describe('fiche : ordre des blocs', () => {
  const render = (locale: Locale, list: Establishment[]) => {
    const data = withDetails(
      withMedia(base(list), {
        'odej-001': {
          cover: { src: 'odej-001/cover.webp', kind: 'image' },
          gallery: [{ src: 'odej-001/gallery/g1.webp', kind: 'image' }],
        },
      }),
      details,
    );
    const idx = buildIndexes(data);
    const noop = () => undefined;
    return renderToStaticMarkup(
      createElement(I18nProvider, {
        locale,
        children: createElement(EstablishmentDetail, {
          data,
          idx,
          est: data.establishments[0],
          orbiting: false,
          onBack: noop,
          onSelect: noop,
          onShow: noop,
          onOrbit: noop,
        }),
      }),
    );
  };

  it("suit l'ordre : nom, image, description, autres images, contact, détails", () => {
    const html = render('en', [est('odej-001'), est('odej-002')]);
    const at = (needle: string) => {
      const i = html.indexOf(needle);
      expect(i, needle).toBeGreaterThan(-1);
      return i;
    };
    const order = [
      at('class="display detail-name"'),
      at('class="photo '),
      at('class="detail-desc'),
      at('class="carousel"'),
      at('>Contact<'),
      at('>About the establishment<'),
      at('>Programme of activities<'),
      at('>Coordinates<'),
    ];
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('montre le texte arabe du programme dans les deux langues, avec les dates traduites', () => {
    for (const locale of ['ar', 'en'] as const) {
      const html = render(locale, [est('odej-001'), est('odej-002')]);
      expect(html).toContain('نادي الايروبيك');
      expect(html).toMatch(/2026/);
    }
    expect(render('en', [est('odej-001'), est('odej-002')])).toContain('30 Apr 2026 – 31 Dec 2026');
  });

  it("affiche les activités du type quand il n'y a pas de programme", () => {
    const data = base([est('odej-002')]);
    const idx = buildIndexes(data);
    const noop = () => undefined;
    const html = renderToStaticMarkup(
      createElement(I18nProvider, {
        locale: 'en',
        children: createElement(EstablishmentDetail, {
          data,
          idx,
          est: data.establishments[0],
          orbiting: false,
          onBack: noop,
          onSelect: noop,
          onShow: noop,
          onOrbit: noop,
        }),
      }),
    );
    expect(html).toContain('>Activities<');
    expect(html).not.toContain('Programme of activities');
  });
});
