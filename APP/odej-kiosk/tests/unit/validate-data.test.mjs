import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../../scripts/validate-data.mjs', import.meta.url));
const realData = fileURLToPath(new URL('../../public/data/odej-bejaia.json', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'validate-data-'));

function run(args = []) {
  const { status, stderr } = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  return { status, stderr };
}

function runOn(mutate) {
  const data = JSON.parse(readFileSync(realData, 'utf8'));
  mutate(data);
  const file = join(dir, 'data.json');
  writeFileSync(file, JSON.stringify(data));
  return run([file]);
}

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('validate-data', () => {
  it('accepte les données du dépôt', () => {
    expect(run().status).toBe(0);
  });

  it('refuse un JSON mal formé', () => {
    const file = join(dir, 'broken.json');
    writeFileSync(file, '{ "meta": ');
    expect(run([file]).status).toBe(1);
  });

  it('refuse un champ obligatoire manquant', () => {
    const { status, stderr } = runOn((d) => delete d.establishments[0].name);
    expect(status).toBe(1);
    expect(stderr).toContain('name');
  });

  it("refuse des coordonnées hors de l'emprise", () => {
    const { status, stderr } = runOn((d) => (d.establishments[0].location.lat = 40));
    expect(status).toBe(1);
    expect(stderr).toContain('/establishments/0/location/lat');
  });

  it('refuse un id en double', () => {
    const { status, stderr } = runOn((d) => (d.establishments[1].id = d.establishments[0].id));
    expect(status).toBe(1);
    expect(stderr).toContain('duplicate establishment id');
  });

  it('refuse une catégorie inconnue', () => {
    const { status, stderr } = runOn((d) => (d.establishments[0].category = 'nope'));
    expect(status).toBe(1);
    expect(stderr).toContain('unknown category');
  });

  it('refuse un lieu inconnu', () => {
    const { status, stderr } = runOn((d) => (d.establishments[0].placeId = 'nope'));
    expect(status).toBe(1);
    expect(stderr).toContain('unknown place');
  });

  it('refuse un bloc media dans le fichier de données', () => {
    const { status, stderr } = runOn((d) => (d.establishments[0].media = { cover: null, gallery: [] }));
    expect(status).toBe(1);
    expect(stderr).toContain('media belongs in');
  });
});

describe('validate-data : media.json', () => {
  const data = join(dir, 'with-media.json');
  writeFileSync(data, readFileSync(realData));

  function runOnMedia(id, media) {
    const mediaDir = mkdtempSync(join(dir, 'media-'));
    mkdirSync(join(mediaDir, id));
    writeFileSync(join(mediaDir, id, 'media.json'), typeof media === 'string' ? media : JSON.stringify(media));
    return run([data, mediaDir]);
  }

  it('accepte un media.json valide', () => {
    const media = { cover: null, gallery: [{ src: 'odej-002/gallery/gallery-01.webp', kind: 'image' }] };
    expect(runOnMedia('odej-002', media).status).toBe(0);
  });

  it('refuse un media.json mal formé', () => {
    expect(runOnMedia('odej-002', '{ "cover": ').status).toBe(1);
  });

  it('refuse un chemin avec le préfixe media/', () => {
    const media = { cover: null, gallery: [{ src: 'media/odej-002/gallery/gallery-01.webp' }] };
    expect(runOnMedia('odej-002', media).status).toBe(1);
  });

  it("refuse un chemin vers le dossier d'un autre établissement", () => {
    const { status, stderr } = runOnMedia('odej-002', { cover: { src: 'odej-003/cover.webp' }, gallery: [] });
    expect(status).toBe(1);
    expect(stderr).toContain('outside this folder');
  });

  it('refuse un dossier sans établissement', () => {
    const { status, stderr } = runOnMedia('odej-999', { cover: null, gallery: [] });
    expect(status).toBe(1);
    expect(stderr).toContain('no establishment');
  });
});
