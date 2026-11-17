// HTTP-API. Wird im Entwicklungsmodus als Vite-Middleware eingehängt und von server/index.ts
// für den eigenständigen Betrieb genutzt.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { check, disassemble, runOnce, SPECS, toolchains } from './runner.ts';
import type { RunLang, TestInput } from './runner.ts';
import { checkShell, runShell } from './shell.ts';
import { checkSql, runSql } from './sql.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const MAX_BODY = 1_000_000;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Der Server führt beliebigen Code aus. Damit keine fremde Webseite das ausnutzen kann,
 * nehmen wir nur Anfragen an, die von unserer eigenen Seite auf localhost stammen.
 */
export function isAllowed(req: IncomingMessage): boolean {
  const host = req.headers.host ?? '';
  const hostname = host.replace(/:\d+$/, '');
  if (!LOCAL_HOSTS.has(hostname)) return false;
  const origin = req.headers.origin;
  if (origin !== undefined) {
    try {
      if (new URL(origin).host !== host) return false;
    } catch {
      return false;
    }
  }
  const site = req.headers['sec-fetch-site'];
  if (typeof site === 'string' && site !== 'same-origin' && site !== 'none') return false;
  if (req.method !== 'GET') {
    const type = req.headers['content-type'] ?? '';
    if (!type.toLowerCase().startsWith('application/json')) return false;
  }
  return true;
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(text);
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new HttpError(413, 'Anfrage zu groß');
    chunks.push(chunk as Buffer);
  }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new HttpError(400, 'Ungültiges JSON');
  }
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function str(v: unknown, name: string, max = 200_000): string {
  if (typeof v !== 'string') throw new HttpError(400, `Feld "${name}" fehlt`);
  if (v.length > max) throw new HttpError(413, `Feld "${name}" ist zu lang`);
  return v;
}

function lang(v: unknown): RunLang {
  if (typeof v !== 'string' || !Object.hasOwn(SPECS, v)) throw new HttpError(400, 'Unbekannte Sprache');
  return v as RunLang;
}

function tests(v: unknown): TestInput[] {
  if (!Array.isArray(v) || v.length === 0 || v.length > 30) throw new HttpError(400, 'Feld "tests" fehlt');
  return v.map((t: Record<string, unknown>) => ({
    name: typeof t.name === 'string' ? t.name : undefined,
    stdin: typeof t.stdin === 'string' ? t.stdin : '',
    expected: str(t.expected, 'expected'),
  }));
}

async function loadProgress(): Promise<unknown> {
  try {
    return JSON.parse(await readFile(PROGRESS_FILE, 'utf8'));
  } catch {
    return { solved: {} };
  }
}

async function saveProgress(data: unknown): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${PROGRESS_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(tmp, PROGRESS_FILE);
}

let toolchainCache: Promise<Record<string, string | null>> | null = null;

/** Bearbeitet /api/*-Anfragen. */
export async function handleApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (!isAllowed(req)) throw new HttpError(403, 'Anfrage abgelehnt');
    const url = new URL(req.url ?? '/', 'http://localhost');
    const route = `${req.method} ${url.pathname}`;

    switch (route) {
      case 'GET /api/toolchains':
        toolchainCache ??= toolchains();
        return send(res, 200, await toolchainCache);

      case 'GET /api/progress':
        return send(res, 200, await loadProgress());

      case 'PUT /api/progress': {
        const body = await readJson(req);
        await saveProgress(body);
        return send(res, 200, { ok: true });
      }

      case 'POST /api/run': {
        const body = await readJson(req);
        const stdin = typeof body.stdin === 'string' ? body.stdin : '';
        return send(res, 200, await runOnce(lang(body.language), str(body.code, 'code'), stdin));
      }

      case 'POST /api/check': {
        const body = await readJson(req);
        return send(res, 200, await check(lang(body.language), str(body.code, 'code'), tests(body.tests)));
      }

      case 'POST /api/sql': {
        const body = await readJson(req);
        return send(res, 200, await runSql(str(body.setup, 'setup'), str(body.code, 'code')));
      }

      case 'POST /api/sql-check': {
        const body = await readJson(req);
        return send(
          res,
          200,
          await checkSql({
            setup: str(body.setup, 'setup'),
            code: str(body.code, 'code'),
            solution: str(body.solution, 'solution'),
            ordered: body.ordered === true,
            check: typeof body.check === 'string' ? body.check : undefined,
          }),
        );
      }

      case 'POST /api/disasm': {
        const body = await readJson(req);
        const opt = body.opt === 2 ? 2 : body.opt === 1 ? 1 : 0;
        return send(res, 200, await disassemble(lang(body.language), str(body.code, 'code', 50_000), opt));
      }

      case 'POST /api/shell': {
        const body = await readJson(req);
        const setup = typeof body.setup === 'string' ? str(body.setup, 'setup') : '';
        return send(res, 200, await runShell(setup, str(body.code, 'code', 50_000)));
      }

      case 'POST /api/shell-check': {
        const body = await readJson(req);
        return send(
          res,
          200,
          await checkShell({
            setup: typeof body.setup === 'string' ? str(body.setup, 'setup') : '',
            code: str(body.code, 'code', 50_000),
            solution: str(body.solution, 'solution', 50_000),
            check: str(body.check, 'check', 50_000),
          }),
        );
      }

      default:
        throw new HttpError(404, 'Unbekannte Route');
    }
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message });
    console.error('[api]', err);
    return send(res, 500, { error: 'Interner Fehler' });
  }
}
