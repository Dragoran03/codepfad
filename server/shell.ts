// Terminal-Übungen: Bash-Befehle in einem Wegwerf-Ordner ausführen.
//
// Weil hier auch Befehle wie `rm` geübt werden, läuft jede Shell in einer macOS-Sandbox
// (sandbox-exec), die Schreibzugriffe nur innerhalb des Übungsordners erlaubt und das
// Netzwerk sperrt. Ohne Sandbox werden Terminal-Übungen verweigert.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MAX_OUTPUT, spawnCapture } from './runner.ts';

const SANDBOX = '/usr/bin/sandbox-exec';
const SHELL_TIMEOUT_MS = 10_000;
const MAX_TREE = 300;

export function shellAvailable(): boolean {
  return process.platform === 'darwin' && existsSync(SANDBOX);
}

/** /usr/bin/git ist auf macOS nur ein Weiterleiter, der außerhalb des Ordners schreibt. */
let gitDir: string | null | undefined;
function realGitDir(): string | null {
  if (gitDir !== undefined) return gitDir;
  try {
    gitDir = path.dirname(execFileSync('xcrun', ['-f', 'git'], { encoding: 'utf8' }).trim());
  } catch {
    gitDir = null;
  }
  return gitDir;
}

interface Workspace {
  root: string;
  ws: string;
  home: string;
  profile: string;
  env: NodeJS.ProcessEnv;
}

const GITCONFIG = `[user]
\tname = Lernende Person
\temail = du@codepfad.local
[init]
\tdefaultBranch = main
[core]
\tpager = cat
\teditor = true
[color]
\tui = never
[advice]
\tdetachedHead = false
\tskippedCherryPicks = false
[pull]
\trebase = false
[merge]
\tconflictStyle = merge
`;

async function createWorkspace(): Promise<Workspace> {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'codepfad-sh-')));
  const ws = path.join(root, 'uebung');
  const home = path.join(root, 'home');
  const tmp = path.join(root, 'tmp');
  await Promise.all([mkdir(ws), mkdir(home), mkdir(tmp)]);
  await writeFile(path.join(home, '.gitconfig'), GITCONFIG, 'utf8');
  const profile = path.join(root, 'sandbox.sb');
  await writeFile(
    profile,
    `(version 1)
(allow default)
(deny network*)
(deny file-write*)
(allow file-write* (subpath "${root}") (literal "/dev/null") (literal "/dev/zero") (regex #"^/dev/tty") (regex #"^/dev/fd/"))
`,
    'utf8',
  );
  const git = realGitDir();
  const date = '2024-05-01T10:00:00+02:00';
  const env: NodeJS.ProcessEnv = {
    PATH: [git, '/usr/local/bin', '/opt/homebrew/bin', process.env.PATH].filter(Boolean).join(':'),
    HOME: home,
    TMPDIR: tmp,
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8',
    TERM: 'dumb',
    NO_COLOR: '1',
    PAGER: 'cat',
    GIT_PAGER: 'cat',
    EDITOR: 'true',
    GIT_EDITOR: 'true',
    GIT_MERGE_AUTOEDIT: 'no',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: path.join(home, '.gitconfig'),
    GIT_AUTHOR_DATE: date,
    GIT_COMMITTER_DATE: date,
    PYTHONDONTWRITEBYTECODE: '1',
  };
  return { root, ws, home, profile, env };
}

async function sh(w: Workspace, script: string, timeoutMs = SHELL_TIMEOUT_MS) {
  const file = path.join(w.root, `skript-${Math.random().toString(36).slice(2)}.sh`);
  // Fehlermeldungen in denselben Strom wie die Ausgabe, damit die Reihenfolge stimmt.
  await writeFile(file, `exec 2>&1\n${script}\n`, 'utf8');
  const r = await spawnCapture([SANDBOX, '-f', w.profile, '/bin/bash', file], { cwd: w.ws, timeoutMs, env: w.env });
  // Den langen, zufälligen Pfad des Wegwerf-Ordners kürzen (auch in /var/… statt /private/var/… geschrieben).
  const kurz = (t: string) => t.split(w.root).join('…').split(w.root.replace(/^\/private/, '')).join('…');
  return { ...r, stdout: kurz(r.stdout), stderr: kurz(r.stderr) };
}

/** Alle Dateien und Ordner im Übungsordner (ohne das Innere von .git). */
async function listTree(dir: string, prefix = ''): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    if (out.length >= MAX_TREE) break;
    const rel = prefix + e.name;
    if (e.isDirectory()) {
      out.push(`${rel}/`);
      if (e.name !== '.git') out.push(...(await listTree(path.join(dir, e.name), `${rel}/`)));
    } else {
      out.push(rel);
    }
  }
  return out.slice(0, MAX_TREE);
}

export interface GitCommit {
  hash: string;
  parents: string[];
  subject: string;
  refs: string[];
}

export interface GitInfo {
  /** Ordner des Repositorys relativ zum Übungsordner ("." oder z. B. "projekt"). */
  repo: string;
  head: string | null;
  branch: string | null;
  commits: GitCommit[];
  status: { path: string; index: string; worktree: string }[];
}

async function findRepo(ws: string): Promise<string | null> {
  if (existsSync(path.join(ws, '.git'))) return '.';
  try {
    for (const e of await readdir(ws, { withFileTypes: true })) {
      if (e.isDirectory() && existsSync(path.join(ws, e.name, '.git'))) return e.name;
    }
  } catch {
    /* egal */
  }
  return null;
}

async function gitInfo(w: Workspace): Promise<GitInfo | null> {
  const repo = await findRepo(w.ws);
  if (!repo) return null;
  const q = (s: string) => `'${s.replace(/'/g, "'\\''")}'`;
  const r = await sh(
    w,
    `cd ${q(repo)} || exit 0
echo "@@HEAD $(git rev-parse --short HEAD 2>/dev/null)"
echo "@@BRANCH $(git symbolic-ref --short -q HEAD)"
git log --all --topo-order --format='@@C %h%x1f%p%x1f%s%x1f%D' -n 60 2>/dev/null
git status --porcelain=v1 2>/dev/null | sed 's/^/@@S /'`,
    5_000,
  );
  const info: GitInfo = { repo, head: null, branch: null, commits: [], status: [] };
  for (const line of r.stdout.split('\n')) {
    if (line.startsWith('@@HEAD ')) info.head = line.slice(7).trim() || null;
    else if (line.startsWith('@@BRANCH ')) info.branch = line.slice(9).trim() || null;
    else if (line.startsWith('@@C ')) {
      const [hash, parents, subject, refs] = line.slice(4).split('\x1f');
      info.commits.push({
        hash,
        parents: parents ? parents.split(' ').filter(Boolean) : [],
        subject,
        refs: refs ? refs.split(', ').map((x) => x.trim()).filter(Boolean) : [],
      });
    } else if (line.startsWith('@@S ')) {
      const rest = line.slice(4);
      info.status.push({ index: rest[0], worktree: rest[1], path: rest.slice(3) });
    }
  }
  return info;
}

export interface ShellResult {
  ok: boolean;
  output: string;
  exitCode: number | null;
  timedOut: boolean;
  truncated: boolean;
  setupError: string | null;
  tree: string[];
  git: GitInfo | null;
  error?: string;
}

async function session<T>(fn: (w: Workspace) => Promise<T>): Promise<T> {
  const w = await createWorkspace();
  try {
    return await fn(w);
  } finally {
    await rm(w.root, { recursive: true, force: true }).catch(() => {});
  }
}

async function runIn(w: Workspace, setup: string, code: string): Promise<ShellResult> {
  if (setup.trim()) {
    const s = await sh(w, `set -e\n${setup}`);
    if (s.exitCode !== 0 || s.timedOut) {
      return { ok: false, output: '', exitCode: s.exitCode, timedOut: s.timedOut, truncated: false, setupError: s.stdout + s.stderr, tree: [], git: null };
    }
  }
  const r = await sh(w, code);
  const [tree, git] = await Promise.all([listTree(w.ws), gitInfo(w)]);
  return {
    ok: !r.timedOut && !r.truncated && r.exitCode === 0,
    output: (r.stdout + r.stderr).slice(0, MAX_OUTPUT),
    exitCode: r.exitCode,
    timedOut: r.timedOut,
    truncated: r.truncated,
    setupError: null,
    tree,
    git,
  };
}

const UNAVAILABLE: ShellResult = {
  ok: false,
  output: '',
  exitCode: null,
  timedOut: false,
  truncated: false,
  setupError: null,
  tree: [],
  git: null,
  error: 'Terminal-Übungen brauchen die Sandbox von macOS (sandbox-exec). Auf diesem System ist sie nicht verfügbar.',
};

export async function runShell(setup: string, code: string): Promise<ShellResult> {
  if (!shellAvailable()) return UNAVAILABLE;
  return session((w) => runIn(w, setup, code));
}

export interface ShellCheckResult {
  passed: boolean;
  message: string;
  user: ShellResult;
  actual: string;
  expected: string;
}

function normalize(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .trim();
}

export async function checkShell(input: { setup: string; code: string; solution: string; check: string }): Promise<ShellCheckResult> {
  if (!shellAvailable()) return { passed: false, message: UNAVAILABLE.error!, user: UNAVAILABLE, actual: '', expected: '' };
  const probe = async (code: string) =>
    session(async (w) => {
      const result = await runIn(w, input.setup, code);
      const c = result.setupError ? null : await sh(w, input.check, 5_000);
      return { result, check: c ? c.stdout + c.stderr : '' };
    });
  const [user, ref] = await Promise.all([probe(input.code), probe(input.solution)]);
  if (user.result.setupError) {
    return { passed: false, message: `Die Vorbereitung der Übung ist fehlgeschlagen: ${user.result.setupError}`, user: user.result, actual: '', expected: '' };
  }
  const passed = normalize(user.check) === normalize(ref.check);
  return {
    passed,
    message: passed ? 'Richtig! Der Übungsordner sieht genau so aus wie erwartet.' : 'Noch nicht ganz – vergleiche den Zustand unten mit dem erwarteten.',
    user: user.result,
    actual: user.check,
    expected: ref.check,
  };
}
