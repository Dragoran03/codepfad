import { useEffect, useMemo, useState } from 'react';
import { GENERAL_LANGS, LANG_LABEL } from '../../content/types.ts';
import { parseSnippet } from '../../content/util.ts';
import { Editor } from '../components/Code.tsx';
import { api } from '../lib/api.ts';
import type { DisasmResult } from '../lib/api.ts';
import { useApp, useLesson } from '../state.tsx';

/** `<Uebersetzen name="…" />`: zeigt, was der echte Compiler aus einem Beispiel macht. */
export function Disasm({ name, opt: startOpt = 0 }: { name: string; opt?: 0 | 1 | 2 }) {
  const { code: lesson, id } = useLesson();
  const { lang } = useApp();
  const src = lesson.snippets?.[name]?.[lang];
  const initial = useMemo(() => (src ? parseSnippet(src).code + '\n' : ''), [src]);
  const [code, setCode] = useState(initial);
  const [opt, setOpt] = useState<0 | 1 | 2>(startOpt);
  const [result, setResult] = useState<DisasmResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCode(initial);
    setResult(null);
  }, [initial]);

  if (!GENERAL_LANGS.includes(lang)) return <p className="missing">Wähle oben eine Programmiersprache.</p>;
  if (!src) return <p className="missing">Beispiel „{name}" fehlt in Lektion {id}.</p>;

  const native = lang === 'c' || lang === 'cpp' || lang === 'rust';
  const go = async (o = opt) => {
    setBusy(true);
    setError(null);
    try {
      setResult(await api.disasm(lang, code, o));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="disasm">
      <div className="disasm-cols">
        <div className="disasm-col">
          <div className="code-lang">{LANG_LABEL[lang]} – dein Quelltext</div>
          <Editor value={code} onChange={setCode} lang={lang} onRun={() => go()} minHeight="180px" label="Quelltext zum Übersetzen" />
        </div>
        <div className="disasm-col">
          <div className="code-lang">{result ? result.kind : 'Übersetzung'}</div>
          {result?.ok && <pre className="out disasm-out">{result.output}</pre>}
          {result && !result.ok && <pre className="out err">{result.error}</pre>}
          {!result && <pre className="out empty">Klick auf „Übersetzen", um zu sehen, was {native ? 'der Prozessor' : lang === 'java' ? 'die JVM' : 'der Python-Interpreter'} am Ende ausführt.</pre>}
          {error && <div className="output-head bad standalone">{error}</div>}
        </div>
      </div>
      <div className="codeblock-bar">
        <button type="button" className="btn small primary" onClick={() => go()} disabled={busy}>
          {busy ? 'Übersetze …' : 'Übersetzen'}
        </button>
        {native && (
          <div className="opt-switch" role="radiogroup" aria-label="Optimierungsstufe">
            {([0, 1, 2] as const).map((o) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={opt === o}
                className={`btn ghost small ${opt === o ? 'on' : ''}`}
                onClick={() => {
                  setOpt(o);
                  if (result) void go(o);
                }}
              >
                {o === 0 ? 'ohne Optimierung' : o === 1 ? 'etwas' : 'stark optimiert'}
              </button>
            ))}
          </div>
        )}
        {!native && <span className="bar-note">{lang === 'java' ? 'javac optimiert kaum – das erledigt später der JIT-Compiler der JVM.' : 'Python übersetzt in Bytecode für seine virtuelle Maschine.'}</span>}
      </div>
    </div>
  );
}
