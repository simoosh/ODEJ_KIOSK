// Serveur statique de la borne, sans dépendance. Gère les requêtes Range pour les vidéos.
// Usage : node serve.mjs [dossier] (par défaut app/ à côté de ce fichier). Port : PORT, 4173 par défaut.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT ?? 4173);
const root = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('./app', import.meta.url));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pbf': 'application/x-protobuf',
};

/** Fichier demandé, ou null s'il n'existe pas ou sort du dossier servi. */
function locate(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const file = normalize(join(root, decoded.endsWith('/') ? `${decoded}index.html` : decoded));
  if (file !== root && !file.startsWith(root + sep)) return null;
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

/** { start, end } pour bytes=a-b, bytes=a- et bytes=-n ; null si l'intervalle est invalide. */
function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (match[1] === '' && match[2] === '')) return null;
  const start = match[1] === '' ? Math.max(size - Number(match[2]), 0) : Number(match[1]);
  const end = match[1] === '' || match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  return start <= end && start < size ? { start, end } : null;
}

createServer((req, res) => {
  const file = locate(new URL(req.url, 'http://localhost').pathname);
  if (!file) {
    res.writeHead(404).end();
    return;
  }
  const { size } = statSync(file);
  const headers = {
    'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
  };

  let range = null;
  if (req.headers.range) {
    range = parseRange(req.headers.range, size);
    if (!range) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
      return;
    }
    headers['Content-Range'] = `bytes ${range.start}-${range.end}/${size}`;
  }
  headers['Content-Length'] = range ? range.end - range.start + 1 : size;
  res.writeHead(range ? 206 : 200, headers);

  if (req.method === 'HEAD') res.end();
  else createReadStream(file, range ?? {}).pipe(res);
}).listen(PORT, HOST, () => console.log(`Borne ODEJ : http://${HOST}:${PORT}/`));
