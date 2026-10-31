import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
});
