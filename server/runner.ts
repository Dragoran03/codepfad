// Führt Code mit den lokal installierten Toolchains aus.
// Achtung: keine Sandbox – der Code läuft mit den Rechten des angemeldeten Benutzers.

import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export type RunLang = 'python' | 'java' | 'c' | 'cpp' | 'rust';

interface LangSpec {
  file: string;
  compile?: string[];
  run: string[];
}

// Platzhalter, wird in prepare() durch die tatsächlich nutzbaren Sanitizer-Flags ersetzt.
const SANITIZE = '<sanitize>';

export const SPECS: Record<RunLang, LangSpec> = {
  python: { file: 'main.py', run: ['python3', 'main.py'] },
  java: {
    file: 'Main.java',
    compile: ['javac', '-J-Duser.language=en', '-J-Duser.country=US', '-encoding', 'UTF-8', '-d', '.', 'Main.java'],
    run: [
      'java',
      '-XX:TieredStopAtLevel=1',
      '-Dfile.encoding=UTF-8',
      '-Dstdout.encoding=UTF-8',
      '-Dstderr.encoding=UTF-8',
      '-Duser.language=en',
      '-Duser.country=US',
      '-cp',
      '.',
      'Main',
    ],
  },
  c: {
    file: 'main.c',
    compile: ['clang', '-std=c17', '-Wall', '-Wextra', '-g', SANITIZE, '-o', 'main', 'main.c'],
    run: ['./main'],
  },
  cpp: {
    file: 'main.cpp',
    compile: ['clang++', '-std=c++20', '-Wall', '-Wextra', '-g', SANITIZE, '-o', 'main', 'main.cpp'],
    run: ['./main'],
  },
  rust: {
    file: 'main.rs',
    compile: ['rustc', '--edition', '2024', '-o', 'main', 'main.rs'],
    run: ['./main'],
  },
};

export const COMPILE_TIMEOUT_MS = 30_000;
export const RUN_TIMEOUT_MS = 5_000;
export const MAX_OUTPUT = 100_000;
const MAX_PARALLEL = 4;

export interface ProcResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  truncated: boolean;
  ms: number;
  /** Programm konnte gar nicht gestartet werden (z. B. Compiler nicht installiert). */
  spawnError?: string;
}

// --- einfache Warteschlange, damit nicht beliebig viele Compiler gleichzeitig laufen ---
let active = 0;
const waiting: (() => void)[] = [];
async function acquire(): Promise<void> {
  if (active < MAX_PARALLEL) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
}
function release(): void {
  const next = waiting.shift();
  if (next) next();
  else active--;
}

const ENV: NodeJS.ProcessEnv = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  LANG: 'en_US.UTF-8',
  LC_ALL: 'en_US.UTF-8',
  PYTHONIOENCODING: 'utf-8',
  PYTHONDONTWRITEBYTECODE: '1',
  RUST_BACKTRACE: '0',
  RUSTUP_HOME: process.env.RUSTUP_HOME,
  CARGO_HOME: process.env.CARGO_HOME,
  JAVA_HOME: process.env.JAVA_HOME,
  TMPDIR: process.env.TMPDIR,
};

export async function spawnCapture(
  cmd: string[],
  opts: { cwd: string; stdin?: string; timeoutMs: number; env?: NodeJS.ProcessEnv },
): Promise<ProcResult> {
  await acquire();
  const started = performance.now();
  try {
    return await new Promise<ProcResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      let size = 0;
      let timedOut = false;
      let truncated = false;
      let done = false;

      const child = spawn(cmd[0], cmd.slice(1), { cwd: opts.cwd, env: opts.env ?? ENV, detached: true });

      const killGroup = () => {
        try {
          if (child.pid) process.kill(-child.pid, 'SIGKILL');
        } catch {
          child.kill('SIGKILL');
        }
      };
      const timer = setTimeout(() => {
        timedOut = true;
        killGroup();
      }, opts.timeoutMs);

      const finish = (r: Partial<ProcResult>) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode: null,
          signal: null,
          timedOut,
          truncated,
          ms: Math.round(performance.now() - started),
          ...r,
        });
      };

      const collect = (which: 'out' | 'err') => (chunk: Buffer) => {
        if (truncated) return;
        size += chunk.length;
        if (size > MAX_OUTPUT) {
          truncated = true;
          killGroup();
          return;
        }
        if (which === 'out') stdout += chunk.toString('utf8');
        else stderr += chunk.toString('utf8');
      };
      child.stdout.on('data', collect('out'));
      child.stderr.on('data', collect('err'));
      child.on('error', (err) => finish({ spawnError: err.message }));
      child.on('close', (code, signal) => finish({ exitCode: code, signal }));
      child.stdin.on('error', () => {});
      child.stdin.end(opts.stdin ?? '');
    });
  } finally {
    release();
  }
}

export interface Prepared {
  lang: RunLang;
  dir: string;
  compile: ProcResult | null;
  ok: boolean;
}

const UBSAN = ['-fsanitize=undefined', '-fno-sanitize-recover=undefined'];
const ASAN = ['-fsanitize=address,undefined', '-fno-sanitize-recover=undefined', '-fno-omit-frame-pointer'];
let sanitizeFlags: Promise<string[]> | null = null;

/**
 * AddressSanitizer findet Speicherfehler (z. B. Zugriff nach free), hängt aber bei manchen
 * Kombinationen aus Xcode- und macOS-Version schon beim Programmstart. Deshalb einmalig testen
 * und sonst nur den UndefinedBehaviorSanitizer verwenden.
 */
export function detectSanitizers(): Promise<string[]> {
  sanitizeFlags ??= (async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'codepfad-probe-'));
    try {
      await writeFile(path.join(dir, 'p.c'), 'int main(void) { return 0; }\n', 'utf8');
      const c = await spawnCapture(['clang', ...ASAN, '-o', 'p', 'p.c'], { cwd: dir, timeoutMs: COMPILE_TIMEOUT_MS });
      if (c.spawnError || c.exitCode !== 0) return UBSAN;
      const r = await spawnCapture(['./p'], { cwd: dir, timeoutMs: 3_000 });
      return !r.timedOut && r.exitCode === 0 ? ASAN : UBSAN;
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  })();
  return sanitizeFlags;
}

async function expandSanitize(cmd: string[]): Promise<string[]> {
  const flags = await detectSanitizers();
  return cmd.flatMap((a) => (a === SANITIZE ? flags : [a]));
}

/** Legt ein Arbeitsverzeichnis an, schreibt die Quelldatei und kompiliert, falls nötig. */
export async function prepare(lang: RunLang, code: string): Promise<Prepared> {
  const spec = SPECS[lang];
  if (!spec) throw new Error(`Unbekannte Sprache: ${lang}`);
  const dir = await mkdtemp(path.join(tmpdir(), 'codepfad-'));
  await writeFile(path.join(dir, spec.file), code, 'utf8');
  if (!spec.compile) return { lang, dir, compile: null, ok: true };
  const cmd = spec.compile.includes(SANITIZE)
    ? await expandSanitize(spec.compile)
    : spec.compile;
  const compile = await spawnCapture(cmd, { cwd: dir, timeoutMs: COMPILE_TIMEOUT_MS });
  const ok = !compile.spawnError && !compile.timedOut && compile.exitCode === 0;
  return { lang, dir, compile, ok };
}

export function execute(prep: Prepared, stdin = '', timeoutMs = RUN_TIMEOUT_MS): Promise<ProcResult> {
  return spawnCapture(SPECS[prep.lang].run, { cwd: prep.dir, stdin, timeoutMs });
}

export async function cleanup(prep: Prepared): Promise<void> {
  await rm(prep.dir, { recursive: true, force: true }).catch(() => {});
}

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

function compileFailure(prep: Prepared): RunResult {
  const c = prep.compile!;
  return {
    phase: 'compile',
    ok: false,
    compileOutput: c.spawnError
      ? `Der Compiler konnte nicht gestartet werden: ${c.spawnError}`
      : c.timedOut
        ? 'Das Kompilieren hat zu lange gedauert und wurde abgebrochen.'
        : c.stderr + c.stdout,
    stdout: '',
    stderr: '',
    exitCode: c.exitCode,
    signal: c.signal,
    timedOut: c.timedOut,
    truncated: false,
    ms: c.ms,
  };
}

function toRunResult(prep: Prepared, r: ProcResult): RunResult {
  return {
    phase: 'run',
    ok: !r.spawnError && !r.timedOut && !r.truncated && r.exitCode === 0,
    compileOutput: prep.compile ? prep.compile.stderr : '',
    stdout: r.stdout,
    stderr: r.spawnError ? `Das Programm konnte nicht gestartet werden: ${r.spawnError}` : r.stderr,
    exitCode: r.exitCode,
    signal: r.signal,
    timedOut: r.timedOut,
    truncated: r.truncated,
    ms: r.ms,
  };
}

export async function runOnce(lang: RunLang, code: string, stdin = ''): Promise<RunResult> {
  const prep = await prepare(lang, code);
  try {
    if (!prep.ok) return compileFailure(prep);
    return toRunResult(prep, await execute(prep, stdin));
  } finally {
    await cleanup(prep);
  }
}

export interface TestInput {
  name?: string;
  stdin?: string;
  expected: string;
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

function normalize(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '')
    .replace(/^\n+/, '');
}

/** Kompiliert einmal und lässt dann jeden Testfall einzeln laufen. */
export async function check(lang: RunLang, code: string, tests: TestInput[]): Promise<CheckResult> {
  const prep = await prepare(lang, code);
  try {
    if (!prep.ok) {
      return { compileOk: false, compileOutput: compileFailure(prep).compileOutput, results: [], passed: false };
    }
    const results = await Promise.all(
      tests.map(async (t, i): Promise<TestOutcome> => {
        const r = await execute(prep, t.stdin ?? '');
        const clean = !r.timedOut && !r.truncated && !r.spawnError && r.exitCode === 0;
        return {
          name: t.name ?? `Test ${i + 1}`,
          stdin: t.stdin ?? '',
          expected: t.expected,
          actual: r.stdout,
          stderr: r.spawnError ?? r.stderr,
          passed: clean && normalize(r.stdout) === normalize(t.expected),
          timedOut: r.timedOut,
          exitCode: r.exitCode,
          signal: r.signal,
        };
      }),
    );
    return {
      compileOk: true,
      compileOutput: prep.compile ? prep.compile.stderr : '',
      results,
      passed: results.length > 0 && results.every((r) => r.passed),
    };
  } finally {
    await cleanup(prep);
  }
}

/** Welche Toolchains sind vorhanden? */
export async function toolchains(): Promise<Record<string, string | null>> {
  const probes: Record<string, string[]> = {
    python: ['python3', '--version'],
    java: ['javac', '-version'],
    c: ['clang', '--version'],
    cpp: ['clang++', '--version'],
    rust: ['rustc', '--version'],
  };
  const out: Record<string, string | null> = {};
  await Promise.all(
    Object.entries(probes).map(async ([lang, cmd]) => {
      const r = await spawnCapture(cmd, { cwd: tmpdir(), timeoutMs: 10_000 });
      out[lang] = r.spawnError || r.exitCode !== 0 ? null : (r.stdout + r.stderr).split('\n')[0].trim();
    }),
  );
  out.sql = `SQLite (node:sqlite, Node ${process.versions.node})`;
  out.sanitizer = (await detectSanitizers()).includes(ASAN[0]) ? 'address+undefined' : 'undefined';
  return out;
}

// ---------- Was macht der Compiler daraus? ----------

export interface DisasmResult {
  ok: boolean;
  kind: string;
  output: string;
  error: string;
}

/** Assembler-Ausgabe von clang/rustc lesbar machen: Direktiven und Hilfsmarken entfernen. */
export function tidyAsm(asm: string): string {
  const out: string[] = [];
  for (const raw of asm.split('\n')) {
    const line = raw.replace(/\s*;.*$/, '').replace(/\s*\/\/.*$/, '').replace(/\s+$/, '');
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('.') && !t.endsWith(':')) continue; // Direktiven wie .globl, .p2align
    if (/^(L|l)(func_end|tmp|loh|set|_)/i.test(t) && t.endsWith(':')) continue;
    if (/^Lloh\d+:/.test(t)) continue;
    out.push(line.replace(/^\t/, '    ').replace(/\t/g, ' '));
  }
  return out.join('\n');
}

export async function disassemble(lang: RunLang, code: string, opt: 0 | 1 | 2): Promise<DisasmResult> {
  const dir = await mkdtemp(path.join(tmpdir(), 'codepfad-asm-'));
  try {
    await writeFile(path.join(dir, SPECS[lang].file), code, 'utf8');
    const run = (cmd: string[], stdin?: string) => spawnCapture(cmd, { cwd: dir, timeoutMs: COMPILE_TIMEOUT_MS, stdin });
    const fail = (kind: string, r: ProcResult): DisasmResult => ({
      ok: false,
      kind,
      output: '',
      error: r.spawnError ?? (r.timedOut ? 'Zeitüberschreitung' : r.stderr + r.stdout),
    });
    const O = `-O${opt}`;
    switch (lang) {
      case 'python': {
        const r = await run(['python3', '-c', "import dis; dis.dis(compile(open('main.py', encoding='utf-8').read(), 'main.py', 'exec'))"]);
        if (r.exitCode !== 0) return fail('Python-Bytecode', r);
        return { ok: true, kind: 'Python-Bytecode (dis)', output: r.stdout.replace(/ at 0x[0-9a-f]+/g, ''), error: '' };
      }
      case 'java': {
        const c = await run(SPECS.java.compile!);
        if (c.exitCode !== 0) return fail('Java-Bytecode', c);
        const r = await run(['javap', '-J-Duser.language=en', '-c', '-p', 'Main']);
        if (r.exitCode !== 0) return fail('Java-Bytecode', r);
        return { ok: true, kind: 'JVM-Bytecode (javap -c)', output: r.stdout, error: '' };
      }
      case 'c':
      case 'cpp': {
        const cc = lang === 'c' ? ['clang', '-std=c17'] : ['clang++', '-std=c++20'];
        const r = await run([...cc, O, '-S', '-fno-asynchronous-unwind-tables', '-fno-stack-protector', '-o', '-', SPECS[lang].file]);
        if (r.exitCode !== 0) return fail('Assembler', r);
        let asm = tidyAsm(r.stdout);
        if (lang === 'cpp') {
          const d = await run(['c++filt', '-_'], asm);
          if (d.exitCode === 0 && d.stdout.trim()) asm = d.stdout.trimEnd();
        }
        return { ok: true, kind: `Assembler (${process.arch}, clang ${O})`, output: asm, error: '' };
      }
      case 'rust': {
        const r = await run(['rustc', '--edition', '2024', '--crate-type', 'lib', '-C', `opt-level=${opt}`, '--emit', 'asm', '-o', 'main.s', 'main.rs']);
        if (r.exitCode !== 0) return fail('Assembler', r);
        const asm = await readFile(path.join(dir, 'main.s'), 'utf8');
        return { ok: true, kind: `Assembler (${process.arch}, rustc opt-level=${opt})`, output: tidyAsm(asm), error: '' };
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
