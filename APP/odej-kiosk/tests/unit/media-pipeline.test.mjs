import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isFaststart } from '../../../../tools/media/pipeline/lib/mp4.mjs';
import {
  budgetWarnings,
  fileErrors,
  LIMITS,
  MIB,
  photoErrors,
  publishRefusals,
  rangeErrors,
  rangeWarnings,
  referenceErrors,
  videoErrors,
} from '../../../../tools/media/pipeline/lib/rules.mjs';

const dir = mkdtempSync(join(tmpdir(), 'media-pipeline-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const VIDEO = { width: 720, codec: 'h264', pixelFormat: 'yuv420p', audioCodec: 'aac', faststart: true };

function atom(type, payload = 8) {
  const buffer = Buffer.alloc(8 + payload);
  buffer.writeUInt32BE(8 + payload, 0);
  buffer.write(type, 4, 'latin1');
  return buffer;
}

function mp4(name, ...types) {
  const file = join(dir, name);
  writeFileSync(file, Buffer.concat(types.map((type) => atom(type))));
  return file;
}

describe('limites dures', () => {
  it('refuse un fichier de 26 Mio et accepte 24 Mio', () => {
    expect(fileErrors('odej-003/videos/video-06.mp4', 26 * MIB)).toHaveLength(1);
    expect(fileErrors('odej-003/videos/video-06.mp4', 24 * MIB)).toEqual([]);
  });

  it('refuse une extension hors liste et un nom non sûr', () => {
    expect(fileErrors('odej-001/gallery/a.jpg', 10)[0]).toContain('only webp and mp4');
    expect(fileErrors('odej-001/gallery/Photo 1.webp', 10)[0]).toContain('file names');
  });

  it('refuse une photo plus large que 1600 px', () => {
    expect(photoErrors('a.webp', 1601)).toHaveLength(1);
    expect(photoErrors('a.webp', 1600)).toEqual([]);
  });

  it('refuse une vidéo hors format', () => {
    expect(videoErrors('v.mp4', VIDEO)).toEqual([]);
    expect(videoErrors('v.mp4', { ...VIDEO, width: 1080 })[0]).toContain('720');
    expect(videoErrors('v.mp4', { ...VIDEO, codec: 'hevc' })[0]).toContain('h264');
    expect(videoErrors('v.mp4', { ...VIDEO, pixelFormat: 'yuv444p' })[0]).toContain('yuv420p');
    expect(videoErrors('v.mp4', { ...VIDEO, audioCodec: 'mp3' })[0]).toContain('aac');
    expect(videoErrors('v.mp4', { ...VIDEO, faststart: false })[0]).toContain('faststart');
  });

  it('accepte une vidéo muette', () => {
    expect(videoErrors('v.mp4', { ...VIDEO, audioCodec: null })).toEqual([]);
  });
});

describe('faststart', () => {
  it('détecte moov avant mdat', () => {
    expect(isFaststart(mp4('good.mp4', 'ftyp', 'moov', 'mdat'))).toBe(true);
  });

  it('refuse mdat avant moov', () => {
    expect(isFaststart(mp4('bad.mp4', 'ftyp', 'mdat', 'moov'))).toBe(false);
  });

  it('refuse un fichier sans moov', () => {
    expect(isFaststart(mp4('empty.mp4', 'ftyp', 'free'))).toBe(false);
  });

  it('lit un atome de taille 64 bits', () => {
    const large = Buffer.alloc(32);
    large.writeUInt32BE(1, 0);
    large.write('free', 4, 'latin1');
    large.writeBigUInt64BE(32n, 8);
    const file = join(dir, 'large.mp4');
    writeFileSync(file, Buffer.concat([large, atom('moov'), atom('mdat')]));
    expect(isFaststart(file)).toBe(true);
  });
});

describe('références de media.json', () => {
  it('signale une référence absente et un fichier sans référence', () => {
    const errors = referenceErrors(['a/one.webp', 'a/extra.webp'], ['a/one.webp', 'a/two.webp']);
    expect(errors).toEqual(['a/two.webp: referenced but missing', 'a/extra.webp: not referenced by media.json']);
  });
});

describe('plafonds par établissement', () => {
  it('avertit avec le dépassement', () => {
    const warnings = budgetWarnings('odej-021', { photos: 30, videos: 4, bytes: 60 * MIB });
    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toContain('30 photos');
  });

  it('exempte odej-003', () => {
    expect(budgetWarnings('odej-003', { photos: 35, videos: 6, bytes: 98 * MIB })).toEqual([]);
  });
});

describe('publication', () => {
  it('refuse un fichier trop lourd ou trop de fichiers', () => {
    expect(publishRefusals([{ path: 'a.mp4', bytes: 26 * MIB }])).toHaveLength(1);
    expect(publishRefusals(Array.from({ length: LIMITS.totalFiles + 1 }, (_, i) => ({ path: `${i}`, bytes: 1 })))).toHaveLength(1);
    expect(publishRefusals([{ path: 'a.mp4', bytes: MIB }])).toEqual([]);
  });
});

describe('requête Range sur une vidéo', () => {
  it('accepte 206 sans avertissement', () => {
    expect(rangeErrors('v.mp4', 206)).toEqual([]);
    expect(rangeWarnings('v.mp4', 206)).toEqual([]);
  });

  it('avertit sur un 200 complet, sans erreur', () => {
    expect(rangeErrors('v.mp4', 200)).toEqual([]);
    expect(rangeWarnings('v.mp4', 200)).toEqual(['v.mp4: Range 200 with the full file, expected 206']);
  });

  it('refuse toute autre réponse', () => {
    for (const status of [204, 404, 416, 500]) {
      expect(rangeErrors('v.mp4', status)).toEqual([`v.mp4: Range ${status}, expected 206`]);
      expect(rangeWarnings('v.mp4', status)).toEqual([]);
    }
  });
});

describe('prune-media', () => {
  const script = fileURLToPath(new URL('../../scripts/prune-media.mjs', import.meta.url));

  function fixture(name) {
    const media = join(dir, name);
    mkdirSync(join(media, 'odej-001', 'gallery'), { recursive: true });
    writeFileSync(join(media, 'index.json'), '{}');
    writeFileSync(join(media, 'odej-001', 'gallery', 'a.webp'), 'x');
    return media;
  }

  it('ne garde que index.json', () => {
    const media = fixture('prune');
    expect(spawnSync(process.execPath, [script, media]).status).toBe(0);
    expect(existsSync(join(media, 'index.json'))).toBe(true);
    expect(existsSync(join(media, 'odej-001'))).toBe(false);
  });

  it('ne touche à rien avec KIOSK_PACK=1', () => {
    const media = fixture('pack');
    spawnSync(process.execPath, [script, media], { env: { ...process.env, KIOSK_PACK: '1' } });
    expect(existsSync(join(media, 'odej-001', 'gallery', 'a.webp'))).toBe(true);
  });
});

describe('serveur de la borne', () => {
  const PORT = 4199;
  const url = `http://127.0.0.1:${PORT}`;
  const script = fileURLToPath(new URL('../../../../tools/media/pipeline/kiosk/serve.mjs', import.meta.url));
  let server;

  beforeAll(async () => {
    const root = join(dir, 'site avec espace');
    mkdirSync(root);
    writeFileSync(join(root, 'index.html'), '<title>borne</title>');
    writeFileSync(join(root, 'video.mp4'), Buffer.from('0123456789'));
    writeFileSync(join(dir, 'secret.txt'), 'hors du site');
    server = spawn(process.execPath, [script, root], { env: { ...process.env, PORT: String(PORT) } });
    await new Promise((ready) => server.stdout.once('data', ready));
  });

  afterAll(() => server?.kill());

  it('sert index.html à la racine', async () => {
    const response = await fetch(`${url}/`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('borne');
  });

  it('donne le bon Content-Type et annonce les Range', async () => {
    const response = await fetch(`${url}/video.mp4`, { method: 'HEAD' });
    expect(response.headers.get('content-type')).toBe('video/mp4');
    expect(response.headers.get('accept-ranges')).toBe('bytes');
    expect(response.headers.get('content-length')).toBe('10');
  });

  it('répond 206 à une requête Range', async () => {
    const response = await fetch(`${url}/video.mp4`, { headers: { Range: 'bytes=2-4' } });
    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toBe('bytes 2-4/10');
    expect(await response.text()).toBe('234');
  });

  it('gère les intervalles ouverts', async () => {
    const tail = await fetch(`${url}/video.mp4`, { headers: { Range: 'bytes=-3' } });
    expect(await tail.text()).toBe('789');
    const open = await fetch(`${url}/video.mp4`, { headers: { Range: 'bytes=7-' } });
    expect(await open.text()).toBe('789');
  });

  it('répond 416 à un intervalle hors du fichier', async () => {
    const response = await fetch(`${url}/video.mp4`, { headers: { Range: 'bytes=50-60' } });
    expect(response.status).toBe(416);
  });

  it('répond 404 à un fichier absent et refuse de sortir du dossier', async () => {
    expect((await fetch(`${url}/absent.mp4`)).status).toBe(404);
    expect((await fetch(`${url}/%2e%2e/secret.txt`)).status).toBe(404);
  });
});
