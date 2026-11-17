// Eigenständiger Server: liefert die gebaute App aus `dist/` und die API.
// Nutzung: `npm run build && npm start`. Zum Entwickeln genügt `npm run dev`.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { handleApi } from './api.ts';

const DIST = path.resolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT ?? 4317);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname.startsWith('/api/')) return handleApi(req, res);

  const rel = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(DIST, rel);
  if (!file.startsWith(DIST) || !path.extname(file)) file = path.join(DIST, 'index.html');
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Nicht gefunden. Wurde `npm run build` ausgeführt?');
  }
});

// Nur lokal erreichbar – der Server führt Code aus.
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Codepfad läuft auf http://localhost:${PORT}`);
});
