import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DATASETS } from '../../content/datasets.ts';
import { LANG_LABEL } from '../../content/types.ts';
import type { CodeExercise, Exercise, Lang, PredictExercise, QuizExercise, ShellExercise, SqlExercise } from '../../content/types.ts';
import { normalizeOutput, parseSnippet, perLang, splitExercise, trimBlock } from '../../content/util.ts';
import { api } from '../lib/api.ts';
import type { CheckResult, RunResult, ShellCheckResult, ShellResult, SqlCheckResult, SqlResult, TestOutcome } from '../lib/api.ts';
import { solvedKey } from '../lib/content.ts';
import { fmt } from '../lib/fmt.tsx';
import { loadLocal, saveLocal, useApp, useLesson } from '../state.tsx';
import { CodeView, Editor, Explanations, ResultTable, RunOutput, ShellOutput, SqlOutput } from './Code.tsx';

function Shell({
  number,
  title,
  kind,
  solved,
  children,
}: {
  number: number;
  title: string;
  kind: string;
  solved: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`exercise ${solved ? 'solved' : ''}`} aria-label={`Aufgabe ${number}: ${title}`}>
      <header className="exercise-head">
        <span className="exercise-kicker">
          Aufgabe {number} · {kind}
        </span>
        <h3>{title}</h3>
        <span className={`badge ${solved ? 'good' : ''}`}>{solved ? '✓ Gelöst' : 'Offen'}</span>
      </header>
      {children}
    </section>
  );
}

function useDraft(key: string, initial: string): [string, (v: string) => void, () => void] {
  const [value, setValue] = useState(() => loadLocal<string>(`cp:draft:${key}`, initial));
  const set = (v: string) => {
    setValue(v);
    saveLocal(`cp:draft:${key}`, v);
  };
  const reset = () => {
    setValue(initial);
    try {
      localStorage.removeItem(`cp:draft:${key}`);
    } catch {
      /* egal */
    }
  };
  return [value, set, reset];
}

function Hints({ hints, solution, lang, onUse }: { hints: string[]; solution: string; lang: Lang; onUse: () => void }) {
  const [shown, setShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  return (
    <div className="hints">
      {hints.slice(0, shown).map((h, i) => (
        <div key={i} className="hint">
          <strong>Tipp {i + 1}</strong>
          <p>{fmt(h)}</p>
        </div>
      ))}
      {showSolution && (
        <div className="hint solution">
          <strong>Musterlösung</strong>
          <CodeView code={solution.trimEnd()} lang={lang} />
          <button type="button" className="btn ghost small" onClick={onUse}>
            In den Editor übernehmen
          </button>
        </div>
      )}
      <div className="hint-actions">
        {shown < hints.length && (
          <button type="button" className="btn ghost small" onClick={() => setShown(shown + 1)}>
            {shown === 0 ? 'Tipp anzeigen' : 'Noch ein Tipp'}
          </button>
        )}
        {shown >= hints.length && !showSolution && (
          <button type="button" className="btn ghost small" onClick={() => setShowSolution(true)}>
            Musterlösung ansehen
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Programmieraufgabe ----------

function TestRow({ t, open }: { t: TestOutcome; open: boolean }) {
  return (
    <details className={`test ${t.passed ? 'pass' : 'fail'}`} open={open}>
      <summary>
        <span className="test-mark">{t.passed ? '✓' : '✗'}</span>
        {t.name}
        {t.timedOut && <span className="test-note">Zeitlimit überschritten</span>}
        {!t.timedOut && !t.passed && t.exitCode !== 0 && <span className="test-note">Programm abgestürzt</span>}
      </summary>
      <div className="test-body">
        {t.stdin && (
          <div>
            <div className="mem-title">Eingabe</div>
            <pre className="out">{t.stdin.length > 400 ? `${t.stdin.slice(0, 400)} …` : t.stdin}</pre>
          </div>
        )}
        <div className="test-compare">
          <div>
            <div className="mem-title">Erwartet</div>
            <pre className="out">{t.expected}</pre>
          </div>
          <div>
            <div className="mem-title">Deine Ausgabe</div>
            <pre className={`out ${t.passed ? '' : 'diff'}`}>{t.actual || '(keine Ausgabe)'}</pre>
          </div>
        </div>
        {t.stderr && (
          <div>
            <div className="mem-title">Fehlermeldung</div>
            <pre className="out err">{t.stderr}</pre>
          </div>
        )}
      </div>
    </details>
  );
}

function CodePanel({ ex, number, lessonId, lang }: { ex: CodeExercise; number: number; lessonId: string; lang: Lang }) {
  const { solved, markSolved } = useApp();
  const key = solvedKey(lessonId, ex, lang);
  const src = ex.code[lang];
  const { starter, solution } = useMemo(() => splitExercise(src ?? ''), [src]);
  const [code, setCode, resetCode] = useDraft(key, starter);
  const [stdin, setStdin] = useState(ex.tests[0]?.stdin ?? '');
  const [busy, setBusy] = useState<'run' | 'check' | null>(null);
  const [run, setRun] = useState<RunResult | null>(null);
  const [checked, setChecked] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const usesInput = ex.tests.some((t) => t.stdin);

  if (!src) {
    return (
      <Shell number={number} title={ex.title} kind="Programmieren" solved={false}>
        <p className="missing">Diese Aufgabe gibt es für {LANG_LABEL[lang]} nicht.</p>
      </Shell>
    );
  }

  const doRun = async () => {
    setBusy('run');
    setError(null);
    setChecked(null);
    try {
      setRun(await api.run(lang, code, stdin));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const doCheck = async () => {
    setBusy('check');
    setError(null);
    setRun(null);
    try {
      const r = await api.check(lang, code, ex.tests);
      setChecked(r);
      if (r.passed) markSolved(key);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const firstFail = checked?.results.findIndex((r) => !r.passed) ?? -1;
  const passedCount = checked?.results.filter((r) => r.passed).length ?? 0;

  return (
    <Shell number={number} title={ex.title} kind={`Programmieren in ${LANG_LABEL[lang]}`} solved={key in solved}>
      <div className="prompt">{fmt(ex.prompt)}</div>
      <Editor value={code} onChange={setCode} lang={lang} onRun={doCheck} minHeight="220px" label={`Code-Editor: ${ex.title}`} />
      {usesInput && (
        <label className="stdin">
          <span>Eingabe für „Ausführen"</span>
          <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={Math.min(4, stdin.split('\n').length)} spellCheck={false} />
        </label>
      )}
      <div className="toolbar">
        <button type="button" className="btn" onClick={doRun} disabled={busy !== null}>
          {busy === 'run' ? 'Läuft …' : '▶ Ausführen'}
        </button>
        <button type="button" className="btn primary" onClick={doCheck} disabled={busy !== null} title="Strg/⌘ + Enter">
          {busy === 'check' ? 'Prüfe …' : '✓ Prüfen'}
        </button>
        <span className="toolbar-space" />
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            resetCode();
            setRun(null);
            setChecked(null);
          }}
        >
          Zurücksetzen
        </button>
      </div>

      {error && <div className="output-head bad standalone">{error}</div>}
      {run && <RunOutput result={run} lang={lang} />}
      {checked && !checked.compileOk && (
        <div className="output" role="status">
          <div className="output-head bad">Fehler beim Kompilieren – die Tests konnten nicht laufen</div>
          <pre className="out err">{checked.compileOutput}</pre>
          <Explanations lang={lang} text={checked.compileOutput} />
        </div>
      )}
      {checked && checked.compileOk && (
        <div className="output" role="status">
          <div className={`output-head ${checked.passed ? 'good' : 'bad'}`}>
            {checked.passed
              ? `Geschafft! Alle ${checked.results.length} Tests bestanden.`
              : `${passedCount} von ${checked.results.length} Tests bestanden.`}
          </div>
          <div className="tests">
            {checked.results.map((t, i) => (
              <TestRow key={i} t={t} open={i === firstFail} />
            ))}
          </div>
          {firstFail >= 0 && <Explanations lang={lang} text={checked.results[firstFail].stderr} />}
        </div>
      )}
      <Hints hints={ex.hints ?? []} solution={solution} lang={lang} onUse={() => setCode(solution)} />
    </Shell>
  );
}

// ---------- Quiz ----------

function QuizPanel({ ex, number, lessonId }: { ex: QuizExercise; number: number; lessonId: string }) {
  const { solved, markSolved, lang } = useApp();
  const key = solvedKey(lessonId, ex, lang);
  const [choice, setChoice] = useState<number | null>(null);
  const right = choice === ex.correct;
  return (
    <Shell number={number} title={ex.title} kind="Verständnisfrage" solved={key in solved}>
      <div className="prompt">{fmt(ex.question)}</div>
      <div className="options" role="radiogroup" aria-label={ex.question}>
        {ex.options.map((opt, i) => {
          const state = choice === null ? '' : i === choice ? (right ? 'right' : 'wrong') : '';
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={choice === i}
              className={`option ${state}`}
              onClick={() => {
                setChoice(i);
                if (i === ex.correct) markSolved(key);
              }}
            >
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              <span>{fmt(opt)}</span>
            </button>
          );
        })}
      </div>
      {choice !== null && (
        <div className={`feedback ${right ? 'good' : 'bad'}`} role="status">
          <strong>{right ? 'Richtig.' : 'Noch nicht – probier eine andere Antwort.'}</strong>
          {right && <p>{fmt(ex.explain)}</p>}
        </div>
      )}
    </Shell>
  );
}

// ---------- Ausgabe vorhersagen ----------

function PredictPanel({ ex, number, lessonId, lang }: { ex: PredictExercise; number: number; lessonId: string; lang: Lang }) {
  const { solved, markSolved } = useApp();
  const { code } = useLesson();
  const key = solvedKey(lessonId, ex, lang);
  const [answer, setAnswer] = useState('');
  const [state, setState] = useState<'idle' | 'right' | 'wrong'>('idle');
  const [tries, setTries] = useState(0);
  const src = code.snippets?.[ex.code]?.[lang];
  const expected = perLang(ex.expected, lang) ?? '';
  const explainText = perLang(ex.explain, lang) ?? '';
  const lines = expected.trim().split('\n').length;

  const doCheck = () => {
    const ok = normalizeOutput(answer) === normalizeOutput(expected);
    setState(ok ? 'right' : 'wrong');
    setTries((t) => t + 1);
    if (ok) markSolved(key);
  };

  return (
    <Shell number={number} title={ex.title} kind="Ausgabe vorhersagen" solved={key in solved}>
      <div className="prompt">{fmt(ex.question ?? 'Lies den Code genau. Was gibt das Programm aus? Schreibe die Ausgabe exakt so auf, wie sie erscheint.')}</div>
      {src ? <CodeView code={parseSnippet(src).code} lang={lang} /> : <p className="missing">Kein Code für {LANG_LABEL[lang]}.</p>}
      <label className="stdin">
        <span>Deine Vorhersage</span>
        <textarea
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setState('idle');
          }}
          rows={Math.max(2, lines)}
          spellCheck={false}
          placeholder="Ausgabe hier eintippen"
        />
      </label>
      <div className="toolbar">
        <button type="button" className="btn primary" onClick={doCheck} disabled={!answer.trim()}>
          ✓ Prüfen
        </button>
      </div>
      {state === 'right' && (
        <div className="feedback good" role="status">
          <strong>Richtig.</strong>
          <p>{fmt(explainText)}</p>
        </div>
      )}
      {state === 'wrong' && (
        <div className="feedback bad" role="status">
          <strong>Das stimmt noch nicht.</strong>
          <p>Geh den Code Zeile für Zeile durch und notiere dir die Werte der Variablen.</p>
          {tries >= 2 && (
            <details>
              <summary>Auflösung zeigen</summary>
              <pre className="out">{expected}</pre>
              <p>{fmt(explainText)}</p>
            </details>
          )}
        </div>
      )}
    </Shell>
  );
}

// ---------- SQL ----------

/** Zeigt die Tabellen eines Datensatzes. */
export function Schema({ dataset }: { dataset: string }) {
  const ds = DATASETS[dataset];
  const [data, setData] = useState<SqlResult | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open || data || !ds || ds.tables.length === 0) return;
    void api
      .sql(ds.setup, ds.tables.map((t) => `SELECT * FROM ${t};`).join('\n'))
      .then(setData)
      .catch(() => {});
  }, [open, data, ds]);
  if (!ds || ds.tables.length === 0) return null;
  return (
    <details className="schema" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        Datensatz „{ds.title}" ansehen <span className="schema-tables">{ds.tables.join(' · ')}</span>
      </summary>
      <div className="schema-grid">
        {data
          ? data.statements.map((s, i) => <ResultTable key={i} result={s} caption={ds.tables[i]} />)
          : 'Lade Tabellen …'}
      </div>
    </details>
  );
}

function SqlPanel({ ex, number, lessonId }: { ex: SqlExercise; number: number; lessonId: string }) {
  const { solved, markSolved } = useApp();
  const { code: lessonCode } = useLesson();
  const key = solvedKey(lessonId, ex, 'sql');
  const dataset = ex.dataset ?? lessonCode.dataset ?? 'laden';
  const setup = DATASETS[dataset]?.setup ?? '';
  const starter = trimBlock(ex.starter ?? '-- Deine Abfrage\n') + '\n';
  const solution = trimBlock(ex.solution) + '\n';
  const [code, setCode, resetCode] = useDraft(key, starter);
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<SqlResult | null>(null);
  const [checked, setChecked] = useState<SqlCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doRun = async () => {
    setBusy(true);
    setError(null);
    setChecked(null);
    try {
      setRun(await api.sql(setup, code));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const doCheck = async () => {
    setBusy(true);
    setError(null);
    setRun(null);
    try {
      const r = await api.sqlCheck({ setup, code, solution, ordered: ex.ordered, check: ex.check });
      setChecked(r);
      if (r.passed) markSolved(key);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell number={number} title={ex.title} kind="SQL" solved={key in solved}>
      <div className="prompt">{fmt(ex.prompt)}</div>
      <Schema dataset={dataset} />
      <Editor value={code} onChange={setCode} lang="sql" onRun={doCheck} minHeight="120px" label={`SQL-Editor: ${ex.title}`} />
      <div className="toolbar">
        <button type="button" className="btn" onClick={doRun} disabled={busy}>
          ▶ Ausführen
        </button>
        <button type="button" className="btn primary" onClick={doCheck} disabled={busy} title="Strg/⌘ + Enter">
          ✓ Prüfen
        </button>
        <span className="toolbar-space" />
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            resetCode();
            setRun(null);
            setChecked(null);
          }}
        >
          Zurücksetzen
        </button>
      </div>
      {error && <div className="output-head bad standalone">{error}</div>}
      {run && <SqlOutput result={run} />}
      {checked && (
        <div className="output" role="status">
          <div className={`output-head ${checked.passed ? 'good' : 'bad'}`}>{checked.message}</div>
          {checked.error && (
            <>
              <pre className="out err">{checked.error}</pre>
              <Explanations lang="sql" text={checked.error} />
            </>
          )}
          {!checked.passed && !checked.error && (
            <div className="test-compare tables">
              {checked.actual && <ResultTable result={checked.actual} caption="Dein Ergebnis" />}
              {checked.expected && <ResultTable result={checked.expected} caption="Erwartetes Ergebnis" />}
            </div>
          )}
          {checked.passed && checked.actual && <ResultTable result={checked.actual} />}
        </div>
      )}
      <Hints hints={ex.hints ?? []} solution={solution} lang="sql" onUse={() => setCode(solution)} />
    </Shell>
  );
}

// ---------- Terminal ----------

function ShellPanel({ ex, number, lessonId }: { ex: ShellExercise; number: number; lessonId: string }) {
  const { solved, markSolved } = useApp();
  const { code: lessonCode } = useLesson();
  const key = solvedKey(lessonId, ex, 'bash');
  const setup = ex.setup ?? lessonCode.shellSetup ?? '';
  const starter = trimBlock(ex.starter ?? '# Deine Befehle\n') + '\n';
  const solution = trimBlock(ex.solution) + '\n';
  const [code, setCode, resetCode] = useDraft(key, starter);
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<ShellResult | null>(null);
  const [checked, setChecked] = useState<ShellCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [before, setBefore] = useState<ShellResult | null>(null);

  // Zeigt, wie der Übungsordner vor deinen Befehlen aussieht.
  useEffect(() => {
    let alive = true;
    void api
      .shell(setup, 'true')
      .then((r) => alive && setBefore(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [setup]);

  const doRun = async () => {
    setBusy(true);
    setError(null);
    setChecked(null);
    try {
      setRun(await api.shell(setup, code));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const doCheck = async () => {
    setBusy(true);
    setError(null);
    setRun(null);
    try {
      const r = await api.shellCheck({ setup, code, solution, check: ex.check });
      setChecked(r);
      if (r.passed) markSolved(key);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell number={number} title={ex.title} kind="Terminal" solved={key in solved}>
      <div className="prompt">{fmt(ex.prompt)}</div>
      {before && !before.error && (
        <details className="schema">
          <summary>
            Ausgangslage ansehen <span className="schema-tables">{before.tree.length} Einträge{before.git ? ' · Git-Repository' : ''}</span>
          </summary>
          <div className="schema-grid">
            <ShellOutput result={{ ...before, output: '' }} />
          </div>
        </details>
      )}
      <Editor value={code} onChange={setCode} lang="bash" onRun={doCheck} minHeight="140px" label={`Terminal-Befehle: ${ex.title}`} />
      <div className="toolbar">
        <button type="button" className="btn" onClick={doRun} disabled={busy}>
          {busy ? 'Läuft …' : '▶ Ausführen'}
        </button>
        <button type="button" className="btn primary" onClick={doCheck} disabled={busy} title="Strg/⌘ + Enter">
          ✓ Prüfen
        </button>
        <span className="toolbar-space" />
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            resetCode();
            setRun(null);
            setChecked(null);
          }}
        >
          Zurücksetzen
        </button>
      </div>
      <p className="hint-line">Jede Ausführung beginnt in einem frischen Übungsordner. Deine Befehle können nichts außerhalb davon verändern.</p>
      {error && <div className="output-head bad standalone">{error}</div>}
      {run && <ShellOutput result={run} />}
      {checked && (
        <>
          <div className={`output-head standalone ${checked.passed ? 'good' : 'bad'}`}>{checked.message}</div>
          {!checked.passed && (
            <div className="test-compare">
              <div>
                <div className="mem-title">Zustand nach deinen Befehlen</div>
                <pre className="out terminal">{checked.actual || '(leer)'}</pre>
              </div>
              <div>
                <div className="mem-title">Erwarteter Zustand</div>
                <pre className="out terminal">{checked.expected || '(leer)'}</pre>
              </div>
            </div>
          )}
          <ShellOutput result={checked.user} />
        </>
      )}
      <Hints hints={ex.hints ?? []} solution={solution} lang="bash" onUse={() => setCode(solution)} />
    </Shell>
  );
}

// ---------- Einstieg aus der Lektion ----------

/** `<Aufgabe id="…" />` in einer Lektion. */
export function ExerciseById({ id }: { id: string }) {
  const lesson = useLesson();
  const { lang } = useApp();
  const list: Exercise[] = lesson.code.exercises ?? [];
  const index = list.findIndex((e) => e.id === id);
  const ex = list[index];
  if (!ex) return <p className="missing">Aufgabe „{id}" fehlt in Lektion {lesson.id}.</p>;
  const number = index + 1;
  switch (ex.kind) {
    case 'code':
      return <CodePanel key={`${ex.id}@${lang}`} ex={ex} number={number} lessonId={lesson.id} lang={lang} />;
    case 'quiz':
      return <QuizPanel ex={ex} number={number} lessonId={lesson.id} />;
    case 'predict':
      return <PredictPanel key={`${ex.id}@${lang}`} ex={ex} number={number} lessonId={lesson.id} lang={lang} />;
    case 'sql':
      return <SqlPanel ex={ex} number={number} lessonId={lesson.id} />;
    case 'shell':
      return <ShellPanel ex={ex} number={number} lessonId={lesson.id} />;
  }
}
