// Läuft als eigener Prozess: führt SQL-Skripte gegen frische In-Memory-Datenbanken aus.
// Eingabe (stdin, JSON): { setup: string, scripts: string[] }
// Ausgabe (stdout, JSON): ScriptResult[]

import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const MAX_ROWS = 200;

interface StatementResult {
  sql: string;
  columns: string[];
  rows: unknown[][];
  changes: number | null;
  truncated: boolean;
}
interface ScriptResult {
  statements: StatementResult[];
  error: string | null;
}

/** Trennt ein Skript an Semikolons, die nicht in Zeichenketten oder Kommentaren stehen. */
function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let cur = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    const two = sql.slice(i, i + 2);
    if (two === '--') {
      const end = sql.indexOf('\n', i);
      const stop = end === -1 ? sql.length : end;
      cur += sql.slice(i, stop);
      i = stop;
    } else if (two === '/*') {
      const end = sql.indexOf('*/', i + 2);
      const stop = end === -1 ? sql.length : end + 2;
      cur += sql.slice(i, stop);
      i = stop;
    } else if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === ch) {
          if (sql[j + 1] === ch) j += 2;
          else break;
        } else j++;
      }
      cur += sql.slice(i, j + 1);
      i = j + 1;
    } else if (ch === ';') {
      out.push(cur);
      cur = '';
      i++;
    } else {
      cur += ch;
      i++;
    }
  }
  out.push(cur);
  return out
    .map((s) => s.trim())
    .filter((s) => s.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim().length > 0);
}

function cell(v: unknown): unknown {
  if (typeof v === 'bigint') return Number(v);
  if (v instanceof Uint8Array) return `<BLOB ${v.length} Bytes>`;
  return v;
}

function runScript(setup: string, script: string): ScriptResult {
  const statements: StatementResult[] = [];
  let db: DatabaseSync | null = null;
  try {
    db = new DatabaseSync(':memory:');
    db.exec(setup);
    for (const sql of splitStatements(script)) {
      const stmt = db.prepare(sql);
      const columns = stmt.columns().map((c) => String(c.name));
      if (columns.length > 0) {
        stmt.setReturnArrays(true);
        const all = stmt.all() as unknown as unknown[][];
        statements.push({
          sql,
          columns,
          rows: all.slice(0, MAX_ROWS).map((r) => r.map(cell)),
          changes: null,
          truncated: all.length > MAX_ROWS,
        });
      } else {
        const info = stmt.run();
        statements.push({ sql, columns: [], rows: [], changes: Number(info.changes), truncated: false });
      }
    }
    return { statements, error: null };
  } catch (err) {
    return { statements, error: err instanceof Error ? err.message : String(err) };
  } finally {
    try {
      db?.close();
    } catch {
      /* egal */
    }
  }
}

const input = JSON.parse(readFileSync(0, 'utf8')) as { setup: string; scripts: string[] };
const results = input.scripts.map((s) => runScript(input.setup, s));
process.stdout.write(JSON.stringify(results));
