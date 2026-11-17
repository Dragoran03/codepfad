import type { Lang, TestCase } from '../../content/types.ts';

export interface RunResult {
  phase: 'compile' | 'run';
  ok: boolean;
  compileOutput: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  truncated: boolean;
  ms: number;
}

export interface TestOutcome {
  name: string;
  stdin: string;
  expected: string;
  actual: string;
  stderr: string;
  passed: boolean;
  timedOut: boolean;
  exitCode: number | null;
  signal: string | null;
}

export interface CheckResult {
  compileOk: boolean;
  compileOutput: string;
  results: TestOutcome[];
  passed: boolean;
}

export interface StatementResult {
  sql: string;
  columns: string[];
  rows: (string | number | null)[][];
  changes: number | null;
  truncated: boolean;
}

export interface SqlResult {
  statements: StatementResult[];
  error: string | null;
}

export interface SqlCheckResult {
  passed: boolean;
  message: string;
  error: string | null;
  user: SqlResult;
  actual: StatementResult | null;
  expected: StatementResult | null;
}

export interface GitCommit {
  hash: string;
  parents: string[];
  subject: string;
  refs: string[];
}

export interface ShellResult {
  ok: boolean;
  output: string;
  exitCode: number | null;
  timedOut: boolean;
  truncated: boolean;
  setupError: string | null;
  tree: string[];
  git: { repo: string; head: string | null; branch: string | null; commits: GitCommit[]; status: { path: string; index: string; worktree: string }[] } | null;
  error?: string;
}

export interface ShellCheckResult {
  passed: boolean;
  message: string;
  user: ShellResult;
  actual: string;
  expected: string;
}

export interface DisasmResult {
  ok: boolean;
  kind: string;
  output: string;
  error: string;
}

export interface Progress {
  solved: Record<string, number>;
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Der lokale Server antwortet nicht. Läuft `npm run dev` noch?');
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Fehler ${res.status}`);
  return data;
}

export const api = {
  run: (language: Lang, code: string, stdin = '') => request<RunResult>('POST', '/api/run', { language, code, stdin }),
  check: (language: Lang, code: string, tests: TestCase[]) =>
    request<CheckResult>('POST', '/api/check', { language, code, tests }),
  sql: (setup: string, code: string) => request<SqlResult>('POST', '/api/sql', { setup, code }),
  sqlCheck: (body: { setup: string; code: string; solution: string; ordered?: boolean; check?: string }) =>
    request<SqlCheckResult>('POST', '/api/sql-check', body),
  shell: (setup: string, code: string) => request<ShellResult>('POST', '/api/shell', { setup, code }),
  shellCheck: (body: { setup: string; code: string; solution: string; check: string }) =>
    request<ShellCheckResult>('POST', '/api/shell-check', body),
  disasm: (language: Lang, code: string, opt: 0 | 1 | 2) => request<DisasmResult>('POST', '/api/disasm', { language, code, opt }),
  getProgress: () => request<Progress>('GET', '/api/progress'),
  putProgress: (p: Progress) => request<{ ok: boolean }>('PUT', '/api/progress', p),
  toolchains: () => request<Record<string, string | null>>('GET', '/api/toolchains'),
};
