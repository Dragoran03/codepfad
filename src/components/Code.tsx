import { indentUnit, syntaxHighlighting } from '@codemirror/language';
import { Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useMemo, useRef } from 'react';
import type { Lang } from '../../content/types.ts';
import type { RunResult, ShellResult, SqlResult, StatementResult } from '../lib/api.ts';
import { explain } from '../lib/explain.ts';
import { fmt } from '../lib/fmt.tsx';
import { cmLanguage, highlightLines } from '../lib/highlight.ts';
import { routeHref } from '../state.tsx';
import { FileTree } from '../viz/FileTree.tsx';
import { GitGraph } from '../viz/GitGraph.tsx';

// ---------- statischer, eingefärbter Code ----------

export function CodeView({ code, lang, hl, numbers = true }: { code: string; lang: Lang; hl?: number[]; numbers?: boolean }) {
  const lines = useMemo(() => highlightLines(code, lang), [code, lang]);
  const ref = useRef<HTMLPreElement>(null);
  const first = hl?.[0];

  // Hervorgehobene Zeile in den sichtbaren Bereich holen (nur innerhalb des Codeblocks scrollen).
  useEffect(() => {
    const pre = ref.current;
    if (!pre || first === undefined) return;
    const el = pre.querySelector<HTMLElement>(`[data-line="${first}"]`);
    if (!el) return;
    const top = el.offsetTop;
    if (top < pre.scrollTop + 8 || top + el.offsetHeight > pre.scrollTop + pre.clientHeight - 8) {
      pre.scrollTo({ top: Math.max(0, top - pre.clientHeight / 2), behavior: 'smooth' });
    }
  }, [first, code]);

  return (
    <pre className="code" ref={ref}>
      <code>
        {lines.map((tokens, i) => (
          <span key={i} data-line={i + 1} className={hl?.includes(i + 1) ? 'ln hl' : 'ln'}>
            {numbers && <span className="no">{i + 1}</span>}
            <span className="src">
              {tokens.length === 0
                ? '\n'
                : tokens.map((t, j) =>
                    t.cls ? (
                      <span key={j} className={t.cls}>
                        {t.text}
                      </span>
                    ) : (
                      t.text
                    ),
                  )}
              {tokens.length > 0 && '\n'}
            </span>
          </span>
        ))}
      </code>
    </pre>
  );
}

// ---------- Editor ----------

const editorTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: 'var(--ink)', fontSize: '14px' },
  '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.6' },
  '.cm-content': { caretColor: 'var(--accent)', padding: '12px 0' },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--faint)', border: 'none', paddingLeft: '6px', paddingRight: '6px' },
  '.cm-activeLine': { backgroundColor: 'var(--line-soft)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--ink)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--select)',
  },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'var(--accent-soft)',
    outline: '1px solid var(--accent-line)',
  },
  '.cm-tooltip': { backgroundColor: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: 'var(--accent)', color: 'var(--on-accent)' },
});

export function Editor({
  value,
  onChange,
  lang,
  onRun,
  minHeight = '180px',
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: Lang;
  onRun?: () => void;
  minHeight?: string;
  label: string;
}) {
  const runRef = useRef(onRun);
  runRef.current = onRun;
  const extensions = useMemo(
    () => [
      cmLanguage(lang),
      syntaxHighlighting(classHighlighter),
      editorTheme,
      indentUnit.of('    '),
      EditorView.contentAttributes.of({ 'aria-label': label }),
      Prec.highest(
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              runRef.current?.();
              return true;
            },
          },
        ]),
      ),
    ],
    [lang, label],
  );
  return (
    <div className="editor">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme="none"
        minHeight={minHeight}
        maxHeight="520px"
        basicSetup={{ foldGutter: false, highlightSelectionMatches: false, searchKeymap: false, tabSize: 4 }}
      />
    </div>
  );
}

// ---------- Ausgaben ----------

export function Explanations({ lang, text }: { lang: Lang; text: string }) {
  const found = useMemo(() => explain(lang, text), [lang, text]);
  if (found.length === 0) return null;
  return (
    <div className="explain">
      {found.map((e) => (
        <div key={e.title} className="explain-item">
          <strong>Was heißt das? {e.title}</strong>
          <p>{fmt(e.text)}</p>
          {e.lesson && <a href={routeHref({ page: 'lesson', id: e.lesson })}>Zur passenden Lektion</a>}
        </div>
      ))}
    </div>
  );
}

function statusLine(r: RunResult): string {
  if (r.timedOut) return 'Abgebrochen: Das Programm lief länger als 5 Sekunden (Endlosschleife?).';
  if (r.truncated) return 'Abgebrochen: Das Programm hat zu viel ausgegeben.';
  if (r.signal) return `Abgestürzt (Signal ${r.signal}) nach ${r.ms} ms.`;
  if (r.exitCode !== 0) return `Beendet mit Fehlercode ${r.exitCode} nach ${r.ms} ms.`;
  return `Fertig nach ${r.ms} ms.`;
}

export function RunOutput({ result, lang }: { result: RunResult; lang: Lang }) {
  if (result.phase === 'compile') {
    return (
      <div className="output" role="status">
        <div className="output-head bad">Fehler beim Kompilieren – das Programm wurde nicht gestartet</div>
        <pre className="out err">{result.compileOutput}</pre>
        <Explanations lang={lang} text={result.compileOutput} />
      </div>
    );
  }
  return (
    <div className="output" role="status">
      <div className={`output-head ${result.ok ? 'good' : 'bad'}`}>{statusLine(result)}</div>
      {result.stdout ? <pre className="out">{result.stdout}</pre> : <pre className="out empty">(keine Ausgabe)</pre>}
      {result.stderr && <pre className="out err">{result.stderr}</pre>}
      {!result.ok && <Explanations lang={lang} text={result.stderr} />}
      {result.ok && result.compileOutput.trim() && (
        <details className="warnings">
          <summary>Hinweise des Compilers</summary>
          <pre className="out warn">{result.compileOutput}</pre>
        </details>
      )}
    </div>
  );
}

function cellText(v: string | number | null): string {
  if (v === null) return 'NULL';
  if (typeof v === 'number' && !Number.isInteger(v)) return String(Math.round(v * 100) / 100);
  return String(v);
}

export function ResultTable({ result, caption }: { result: StatementResult; caption?: string }) {
  return (
    <div className="table-wrap">
      <table className="data">
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {result.columns.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td key={j} className={v === null ? 'null' : typeof v === 'number' ? 'num' : undefined}>
                  {cellText(v)}
                </td>
              ))}
            </tr>
          ))}
          {result.rows.length === 0 && (
            <tr>
              <td colSpan={Math.max(1, result.columns.length)} className="null">
                (keine Zeilen)
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {result.truncated && <p className="hint-line">Nur die ersten 200 Zeilen werden angezeigt.</p>}
    </div>
  );
}

export function SqlOutput({ result }: { result: SqlResult }) {
  return (
    <div className="output" role="status">
      {result.statements.map((s, i) =>
        s.columns.length > 0 ? (
          <ResultTable key={i} result={s} caption={`${s.rows.length} Zeile${s.rows.length === 1 ? '' : 'n'}`} />
        ) : (
          <div key={i} className="output-head good">
            Ausgeführt{s.changes ? ` – ${s.changes} Zeile${s.changes === 1 ? '' : 'n'} geändert` : ''}:{' '}
            <code>{s.sql.split('\n')[0].slice(0, 60)}</code>
          </div>
        ),
      )}
      {result.error && (
        <>
          <div className="output-head bad">Fehler</div>
          <pre className="out err">{result.error}</pre>
          <Explanations lang="sql" text={result.error} />
        </>
      )}
      {!result.error && result.statements.length === 0 && <pre className="out empty">(keine Anweisung)</pre>}
    </div>
  );
}

// ---------- Terminal ----------

function shellStatus(r: ShellResult): { cls: string; text: string } {
  if (r.error) return { cls: 'bad', text: r.error };
  if (r.setupError) return { cls: 'bad', text: 'Die Vorbereitung des Übungsordners ist fehlgeschlagen.' };
  if (r.timedOut) return { cls: 'bad', text: 'Abgebrochen: Die Befehle liefen länger als 10 Sekunden.' };
  if (r.truncated) return { cls: 'bad', text: 'Abgebrochen: zu viel Ausgabe.' };
  if (r.exitCode !== 0) return { cls: 'warn', text: `Der letzte Befehl endete mit dem Exit-Code ${r.exitCode} (ungleich 0 heißt: Fehler).` };
  return { cls: 'good', text: 'Fertig – Exit-Code 0.' };
}

export function ShellOutput({ result, showState = true }: { result: ShellResult; showState?: boolean }) {
  const st = shellStatus(result);
  return (
    <div className="output" role="status">
      <div className={`output-head ${st.cls}`}>{st.text}</div>
      {result.setupError && <pre className="out err">{result.setupError}</pre>}
      {!result.error && !result.setupError && (
        <pre className="out terminal">{result.output || '(keine Ausgabe)'}</pre>
      )}
      {!result.ok && result.output && <Explanations lang="bash" text={result.output} />}
      {showState && !result.error && !result.setupError && (
        <div className="shell-state">
          <div>
            <div className="mem-title">Übungsordner danach</div>
            <FileTree paths={result.tree} />
          </div>
          {result.git && (
            <div>
              <div className="mem-title">
                Git-Repository {result.git.repo === '.' ? '' : `in ${result.git.repo}/`}
                {result.git.branch ? ` · aktueller Branch: ${result.git.branch}` : result.git.head ? ' · losgelöster HEAD' : ''}
              </div>
              <GitGraph commits={result.git.commits} />
              {result.git.status.length > 0 && (
                <div className="git-status">
                  {result.git.status.map((s) => (
                    <span key={s.path} className="git-st">
                      <code>
                        {s.index}
                        {s.worktree}
                      </code>{' '}
                      {s.path}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
