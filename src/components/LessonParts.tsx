import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DATASETS } from '../../content/datasets.ts';
import { GENERAL_LANGS, LANG_LABEL } from '../../content/types.ts';
import type { Lang } from '../../content/types.ts';
import { parseSnippet } from '../../content/util.ts';
import { api } from '../lib/api.ts';
import type { RunResult, ShellResult, SqlResult } from '../lib/api.ts';
import { saveLocal, useApp, useLesson } from '../state.tsx';
import { CodeView, RunOutput, ShellOutput, SqlOutput } from './Code.tsx';

/** `<Code name="…" />`: Beispiel in der gewählten Sprache, ausführbar und mit anderen Sprachen vergleichbar. */
export function CodeBlock({ name, run = true }: { name: string; run?: boolean }) {
  const { code, id } = useLesson();
  const stdin = code.stdin?.[name] ?? '';
  const { lang, navigate } = useApp();
  const snippet = code.snippets?.[name];
  const [other, setOther] = useState<Lang | ''>('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [shellResult, setShellResult] = useState<ShellResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(null);
    setSqlResult(null);
    setShellResult(null);
    setError(null);
  }, [lang, name]);

  const src = snippet?.[lang];
  const parsed = useMemo(() => (src ? parseSnippet(src) : null), [src]);
  const otherSrc = other && other !== lang ? snippet?.[other] : undefined;
  const otherParsed = useMemo(() => (otherSrc ? parseSnippet(otherSrc) : null), [otherSrc]);

  if (!snippet) return <p className="missing">Codebeispiel „{name}" fehlt in Lektion {id}.</p>;
  if (!parsed) {
    return <p className="missing">Für {LANG_LABEL[lang]} gibt es an dieser Stelle kein Beispiel.</p>;
  }

  const runnable = run && !code.fragments?.includes(name);
  const canCompare = GENERAL_LANGS.includes(lang) && GENERAL_LANGS.filter((l) => l !== lang && snippet[l]).length > 0;

  const doRun = async () => {
    setBusy(true);
    setError(null);
    try {
      if (lang === 'sql') setSqlResult(await api.sql(DATASETS[code.dataset ?? 'laden']?.setup ?? '', parsed.code));
      else if (lang === 'bash') setShellResult(await api.shell(code.shellSetup ?? '', parsed.code));
      else setResult(await api.run(lang, parsed.code, stdin));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="codeblock">
      <div className={`codeblock-cols ${otherParsed ? 'two' : ''}`}>
        <div className="codeblock-col">
          <div className="code-lang">{LANG_LABEL[lang]}</div>
          <CodeView code={parsed.code} lang={lang} />
        </div>
        {otherParsed && other && (
          <div className="codeblock-col other" data-lang={other}>
            <div className="code-lang">{LANG_LABEL[other]}</div>
            <CodeView code={otherParsed.code} lang={other} />
          </div>
        )}
      </div>
      <div className="codeblock-bar">
        {runnable && (
          <button type="button" className="btn small" onClick={doRun} disabled={busy}>
            {busy ? 'Läuft …' : '▶ Ausführen'}
          </button>
        )}
        {runnable && stdin && (
          <span className="bar-note">
            Eingabe: <code>{stdin.trim().replace(/\n/g, ' ⏎ ')}</code>
          </span>
        )}
        <span className="toolbar-space" />
        {canCompare && (
          <label className="compare">
            <span>Vergleichen mit</span>
            <select value={other} onChange={(e) => setOther(e.target.value as Lang | '')}>
              <option value="">–</option>
              {GENERAL_LANGS.filter((l) => l !== lang && snippet[l]).map((l) => (
                <option key={l} value={l}>
                  {LANG_LABEL[l]}
                </option>
              ))}
            </select>
          </label>
        )}
        {runnable && (
          <button
            type="button"
            className="btn ghost small"
            onClick={() => {
              saveLocal(`cp:playground:${lang}`, (lang === 'bash' && code.shellSetup ? `# Vorbereitung aus der Lektion\n${code.shellSetup.trim()}\n\n# Beispiel\n` : '') + parsed.code + '\n');
              if (stdin) saveLocal('cp:playground:stdin', stdin);
              navigate({ page: 'playground' });
            }}
          >
            In der Spielwiese bearbeiten
          </button>
        )}
      </div>
      {error && <div className="output-head bad standalone">{error}</div>}
      {result && <RunOutput result={result} lang={lang} />}
      {sqlResult && <SqlOutput result={sqlResult} />}
      {shellResult && <ShellOutput result={shellResult} />}
    </div>
  );
}

function parseLangs(list?: string): Lang[] {
  return (list ?? '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((l) => (l === 'c++' ? 'cpp' : l) as Lang);
}

/** `<Nur lang="rust,c">…</Nur>`: Abschnitt, der nur für bestimmte Sprachen gilt. */
export function Only({ lang: only, nicht, children }: { lang?: string; nicht?: string; children: ReactNode }) {
  const { lang } = useApp();
  const include = parseLangs(only);
  const exclude = parseLangs(nicht);
  if (include.length > 0 && !include.includes(lang)) return null;
  if (exclude.includes(lang)) return null;
  return (
    <aside className="only">
      <div className="only-tag">In {LANG_LABEL[lang]}</div>
      <div className="only-body">{children}</div>
    </aside>
  );
}

/** `<Merke>…</Merke>`: hervorgehobener Kernsatz. */
export function Callout({ titel = 'Merke', children }: { titel?: string; children: ReactNode }) {
  return (
    <aside className="callout">
      <div className="callout-title">{titel}</div>
      <div className="callout-body">{children}</div>
    </aside>
  );
}
