import { useEffect, useState } from 'react';
import { DATASETS } from '../../content/datasets.ts';
import { LANG_LABEL } from '../../content/types.ts';
import type { Lang } from '../../content/types.ts';
import { api } from '../lib/api.ts';
import type { RunResult, ShellResult, SqlResult } from '../lib/api.ts';
import { loadLocal, saveLocal, useApp } from '../state.tsx';
import { Editor, RunOutput, ShellOutput, SqlOutput } from './Code.tsx';
import { Schema } from './Exercise.tsx';

const TEMPLATES: Record<Lang, string> = {
  python: `name = "Welt"
for i in range(3):
    print(f"Hallo {name}, Runde {i + 1}")
`,
  java: `public class Main {
    public static void main(String[] args) {
        String name = "Welt";
        for (int i = 0; i < 3; i++) {
            System.out.println("Hallo " + name + ", Runde " + (i + 1));
        }
    }
}
`,
  c: `#include <stdio.h>

int main(void) {
    const char *name = "Welt";
    for (int i = 0; i < 3; i++) {
        printf("Hallo %s, Runde %d\\n", name, i + 1);
    }
    return 0;
}
`,
  cpp: `#include <iostream>
#include <string>

int main() {
    std::string name = "Welt";
    for (int i = 0; i < 3; i++) {
        std::cout << "Hallo " << name << ", Runde " << i + 1 << "\\n";
    }
    return 0;
}
`,
  rust: `fn main() {
    let name = "Welt";
    for i in 0..3 {
        println!("Hallo {}, Runde {}", name, i + 1);
    }
}
`,
  sql: `SELECT name, stadt
FROM kunden
ORDER BY name;
`,
  bash: `# Du bist in einem leeren Übungsordner. Nichts hier kann deinem Rechner schaden.
echo "Hallo aus dem Terminal"
mkdir projekt
echo "print('hi')" > projekt/main.py
ls -R
`,
};

function Pad({ lang }: { lang: Lang }) {
  const [code, setCodeState] = useState(() => loadLocal(`cp:playground:${lang}`, TEMPLATES[lang]));
  const [stdin, setStdinState] = useState(() => loadLocal('cp:playground:stdin', ''));
  const [dataset, setDataset] = useState('laden');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [shellResult, setShellResult] = useState<ShellResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tools, setTools] = useState<Record<string, string | null> | null>(null);

  useEffect(() => {
    void api
      .toolchains()
      .then(setTools)
      .catch(() => {});
  }, []);

  const setCode = (v: string) => {
    setCodeState(v);
    saveLocal(`cp:playground:${lang}`, v);
  };
  const setStdin = (v: string) => {
    setStdinState(v);
    saveLocal('cp:playground:stdin', v);
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      if (lang === 'sql') setSqlResult(await api.sql(DATASETS[dataset].setup, code));
      else if (lang === 'bash') setShellResult(await api.shell('', code));
      else setResult(await api.run(lang, code, stdin));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const missing = tools && lang !== 'sql' && lang !== 'bash' && tools[lang] === null;

  return (
    <div className="playground">
      <div className="pg-main">
        <Editor value={code} onChange={setCode} lang={lang} onRun={run} minHeight="360px" label="Spielwiese: Code-Editor" />
        <div className="toolbar">
          <button type="button" className="btn primary" onClick={run} disabled={busy} title="Strg/⌘ + Enter">
            {busy ? 'Läuft …' : '▶ Ausführen'}
          </button>
          {lang === 'sql' && (
            <label className="compare">
              <span>Datensatz</span>
              <select value={dataset} onChange={(e) => setDataset(e.target.value)}>
                {Object.entries(DATASETS).map(([id, ds]) => (
                  <option key={id} value={id}>
                    {ds.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="toolbar-space" />
          <button
            type="button"
            className="btn ghost small"
            onClick={() => {
              setCode(TEMPLATES[lang]);
              setResult(null);
              setSqlResult(null);
              setShellResult(null);
            }}
          >
            Vorlage wiederherstellen
          </button>
        </div>
        {lang === 'sql' && <Schema key={dataset} dataset={dataset} />}
      </div>
      <div className="pg-side">
        {lang !== 'sql' && lang !== 'bash' && (
          <label className="stdin">
            <span>Eingabe (stdin)</span>
            <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={4} spellCheck={false} placeholder="Was das Programm einlesen soll" />
          </label>
        )}
        <div className="mem-title">Ergebnis</div>
        {missing && <div className="output-head bad standalone">Für {LANG_LABEL[lang]} wurde auf diesem Rechner kein Compiler gefunden.</div>}
        {error && <div className="output-head bad standalone">{error}</div>}
        {result && lang !== 'sql' && lang !== 'bash' && <RunOutput result={result} lang={lang} />}
        {shellResult && lang === 'bash' && <ShellOutput result={shellResult} />}
        {sqlResult && lang === 'sql' && <SqlOutput result={sqlResult} />}
        {!result && !sqlResult && !shellResult && !error && <pre className="out empty">Noch nichts ausgeführt.</pre>}
        {lang === 'bash' && <p className="hint-line">Jede Ausführung beginnt in einem leeren, abgeschotteten Übungsordner ohne Netzwerkzugang.</p>}
        {tools && tools[lang] && <p className="hint-line">Ausgeführt mit: {tools[lang]}</p>}
        {tools && (lang === 'c' || lang === 'cpp') && (
          <p className="hint-line">
            Laufzeitprüfung: {tools.sanitizer === 'address+undefined' ? 'Address- und UndefinedBehavior-Sanitizer' : 'UndefinedBehavior-Sanitizer'}
          </p>
        )}
      </div>
    </div>
  );
}

export function Playground() {
  const { lang } = useApp();
  return (
    <main className="playground-page">
      <header className="lesson-head">
        <p className="kicker">Spielwiese · {LANG_LABEL[lang]}</p>
        <h1>Einfach ausprobieren</h1>
        <p className="lead">
          Schreibe beliebigen Code und führe ihn aus. Dein Entwurf bleibt je Sprache gespeichert – wechsle oben die Sprache, um
          dasselbe in einer anderen zu versuchen.
        </p>
      </header>
      <Pad key={lang} lang={lang} />
    </main>
  );
}
