// Hilfsfunktionen für Inhalte – laufen im Browser und in Node.

import type { Lang, Step } from './types.ts';

const TAG_RE = /[ \t]*(?:\/\/|#|--)@([\w,-]+)[ \t]*$/;
const MARK_RE = /^\s*(?:\/\/|#|--)\s*:(solution|starter|end)\s*$/;

export interface ParsedSnippet {
  /** Code ohne Schritt-Markierungen. */
  code: string;
  /** Tag → Zeilennummern (1-basiert). */
  tags: Record<string, number[]>;
}

/** Entfernt `//@tag`-Markierungen und merkt sich, welche Zeile zu welchem Schritt gehört. */
export function parseSnippet(src: string): ParsedSnippet {
  const lines = trimBlock(src).split('\n');
  const tags: Record<string, number[]> = {};
  const out = lines.map((line, i) => {
    const m = line.match(TAG_RE);
    if (!m) return line;
    for (const t of m[1].split(',')) (tags[t] ??= []).push(i + 1);
    return line.replace(TAG_RE, '');
  });
  return { code: out.join('\n'), tags };
}

/** Zerlegt Aufgabencode in Startcode und Musterlösung. */
export function splitExercise(src: string): { starter: string; solution: string } {
  const starter: string[] = [];
  const solution: string[] = [];
  let mode: 'both' | 'solution' | 'starter' = 'both';
  for (const line of trimBlock(src).split('\n')) {
    const m = line.match(MARK_RE);
    if (m) {
      mode = m[1] === 'end' ? 'both' : (m[1] as 'solution' | 'starter');
      continue;
    }
    if (mode !== 'starter') solution.push(line);
    if (mode !== 'solution') starter.push(line);
  }
  return { starter: starter.join('\n') + '\n', solution: solution.join('\n') + '\n' };
}

/** Entfernt Leerzeilen am Anfang/Ende und gemeinsame Einrückung. */
export function trimBlock(src: string): string {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indent = Math.min(
    ...lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)![0].length),
  );
  return lines.map((l) => l.slice(Number.isFinite(indent) ? indent : 0)).join('\n');
}

/** Vergleichsform für Programmausgaben: Zeilenenden und abschließende Leerzeichen sind egal. */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '')
    .replace(/^\n+/, '');
}

/** Wählt aus einem Wert, der je Sprache verschieden sein darf, den passenden aus. */
export function perLang<T extends string>(value: T | Partial<Record<Lang, T>>, lang: Lang): T | undefined {
  return typeof value === 'string' ? value : value[lang];
}

/** Sammelt Schritte einer Animation und führt dabei die bisherige Programmausgabe mit. */
export class Tracer {
  steps: Step[] = [];
  private output = '';

  /** Fügt der simulierten Programmausgabe eine Zeile hinzu. */
  print(line: string | number): void {
    this.output += `${line}\n`;
  }

  step(tag: string | undefined, note: string, extra: Partial<Step> = {}): void {
    this.steps.push({ tag, note, out: this.output, ...extra });
  }
}

export function trace(fn: (t: Tracer) => void): Step[] {
  const t = new Tracer();
  fn(t);
  return t.steps;
}
