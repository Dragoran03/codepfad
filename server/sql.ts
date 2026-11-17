// SQL-Ausführung und -Prüfung. Die eigentliche Arbeit macht sql-worker.ts in einem
// Kindprozess, damit eine Endlos-Abfrage den Server nicht blockiert.

import { spawn } from 'node:child_process';
import path from 'node:path';

const WORKER = path.resolve(process.cwd(), 'server/sql-worker.ts');
const SQL_TIMEOUT_MS = 5_000;

export interface StatementResult {
  sql: string;
  columns: string[];
  rows: unknown[][];
  changes: number | null;
  truncated: boolean;
}
export interface ScriptResult {
  statements: StatementResult[];
  error: string | null;
}

function runWorker(setup: string, scripts: string[]): Promise<ScriptResult[]> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--no-warnings', WORKER], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, SQL_TIMEOUT_MS);
    const fail = (message: string) => resolve(scripts.map(() => ({ statements: [], error: message })));
    child.stdout.on('data', (c: Buffer) => (out += c.toString('utf8')));
    child.stderr.on('data', (c: Buffer) => (err += c.toString('utf8')));
    child.on('error', (e) => {
      clearTimeout(timer);
      fail(`SQL-Prozess konnte nicht gestartet werden: ${e.message}`);
    });
    child.on('close', () => {
      clearTimeout(timer);
      if (timedOut) return fail('Die Abfrage hat zu lange gedauert und wurde abgebrochen.');
      try {
        resolve(JSON.parse(out) as ScriptResult[]);
      } catch {
        fail(`SQL-Prozess ist abgestürzt: ${err.trim().split('\n').pop() ?? 'unbekannter Fehler'}`);
      }
    });
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify({ setup, scripts }));
  });
}

export async function runSql(setup: string, code: string): Promise<ScriptResult> {
  const [r] = await runWorker(setup, [code]);
  return r;
}

export interface SqlCheckInput {
  setup: string;
  code: string;
  solution: string;
  ordered?: boolean;
  check?: string;
}

export interface SqlCheckResult {
  passed: boolean;
  message: string;
  error: string | null;
  user: ScriptResult;
  actual: StatementResult | null;
  expected: StatementResult | null;
}

function norm(v: unknown): string {
  if (v === null || v === undefined) return '\u0000NULL';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  return String(v);
}

function lastResultSet(r: ScriptResult): StatementResult | null {
  for (let i = r.statements.length - 1; i >= 0; i--) {
    if (r.statements[i].columns.length > 0) return r.statements[i];
  }
  return null;
}

export async function checkSql(input: SqlCheckInput): Promise<SqlCheckResult> {
  const suffix = input.check ? `\n;\n${input.check}` : '';
  const [user, ref] = await runWorker(input.setup, [input.code + suffix, input.solution + suffix]);
  const expected = lastResultSet(ref);
  const actual = lastResultSet(user);
  const base = { error: user.error, user, actual, expected };

  if (ref.error || !expected) {
    return { ...base, passed: false, message: `Die Musterlösung ist fehlerhaft: ${ref.error ?? 'kein Ergebnis'}` };
  }
  if (user.error) return { ...base, passed: false, message: 'Deine Anweisung enthält einen Fehler.' };
  if (!actual) return { ...base, passed: false, message: 'Deine Anweisung liefert keine Ergebnistabelle.' };

  if (actual.columns.length !== expected.columns.length) {
    return {
      ...base,
      passed: false,
      message: `Erwartet werden ${expected.columns.length} Spalte(n), dein Ergebnis hat ${actual.columns.length}.`,
    };
  }
  if (actual.rows.length !== expected.rows.length) {
    return {
      ...base,
      passed: false,
      message: `Erwartet werden ${expected.rows.length} Zeile(n), dein Ergebnis hat ${actual.rows.length}.`,
    };
  }
  const key = (row: unknown[]) => row.map(norm).join('\u0001');
  const a = actual.rows.map(key);
  const e = expected.rows.map(key);
  if (input.ordered) {
    const sameOrder = a.every((k, i) => k === e[i]);
    if (!sameOrder) {
      const sameSet = [...a].sort().join('\u0002') === [...e].sort().join('\u0002');
      return {
        ...base,
        passed: false,
        message: sameSet
          ? 'Die Zeilen stimmen, aber die Reihenfolge ist falsch.'
          : 'Der Inhalt der Zeilen weicht vom erwarteten Ergebnis ab.',
      };
    }
  } else if ([...a].sort().join('\u0002') !== [...e].sort().join('\u0002')) {
    return { ...base, passed: false, message: 'Der Inhalt der Zeilen weicht vom erwarteten Ergebnis ab.' };
  }
  return { ...base, passed: true, message: 'Richtig! Dein Ergebnis stimmt mit dem erwarteten überein.' };
}
