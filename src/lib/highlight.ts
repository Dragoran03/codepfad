import { cpp, cppLanguage } from '@codemirror/lang-cpp';
import { java, javaLanguage } from '@codemirror/lang-java';
import { python, pythonLanguage } from '@codemirror/lang-python';
import { rust, rustLanguage } from '@codemirror/lang-rust';
import { SQLite, sql } from '@codemirror/lang-sql';
import { StreamLanguage } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import type { Extension } from '@codemirror/state';
import { classHighlighter, highlightCode } from '@lezer/highlight';
import type { Parser } from '@lezer/common';
import type { Lang } from '../../content/types.ts';

const shellLanguage = StreamLanguage.define(shell);

const PARSERS: Record<Lang, Parser> = {
  python: pythonLanguage.parser,
  java: javaLanguage.parser,
  c: cppLanguage.parser,
  cpp: cppLanguage.parser,
  rust: rustLanguage.parser,
  sql: SQLite.language.parser,
  bash: shellLanguage.parser,
};

/** CodeMirror-Spracherweiterung für den Editor. */
export function cmLanguage(lang: Lang): Extension {
  switch (lang) {
    case 'python':
      return python();
    case 'java':
      return java();
    case 'c':
    case 'cpp':
      return cpp();
    case 'rust':
      return rust();
    case 'sql':
      return sql({ dialect: SQLite, upperCaseKeywords: true });
    case 'bash':
      return shellLanguage;
  }
}

export interface Token {
  text: string;
  cls: string;
}

const cache = new Map<string, Token[][]>();

/** Zerlegt Code in eingefärbte Zeilen (für statische Codeblöcke). */
export function highlightLines(code: string, lang: Lang): Token[][] {
  const key = `${lang}\u0000${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const lines: Token[][] = [[]];
  try {
    const tree = PARSERS[lang].parse(code);
    highlightCode(
      code,
      tree,
      classHighlighter,
      (text, cls) => lines[lines.length - 1].push({ text, cls }),
      () => lines.push([]),
    );
  } catch {
    return code.split('\n').map((text) => [{ text, cls: '' }]);
  }
  cache.set(key, lines);
  return lines;
}
