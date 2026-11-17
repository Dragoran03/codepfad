import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { LANG_LABEL } from '../../content/types.ts';
import type { Lang, Scene, Snippet, Step } from '../../content/types.ts';
import { parseSnippet } from '../../content/util.ts';
import { CodeView } from '../components/Code.tsx';
import { fmt } from '../lib/fmt.tsx';
import { useApp, useLesson } from '../state.tsx';
import { StepViews } from './views.tsx';

const SPEEDS = [0.5, 1, 2];

function Player({ scene, snippet, lang }: { scene: Scene; snippet?: Snippet; lang: Lang }) {
  const [params, setParams] = useState<Record<string, number>>(() =>
    Object.fromEntries((scene.params ?? []).map((p) => [p.name, p.value])),
  );
  const steps = useMemo<Step[]>(() => {
    try {
      const s = scene.build(params, lang);
      return s.length > 0 ? s : [{ note: 'Für diese Sprache gibt es hier keine Schritte.' }];
    } catch (err) {
      return [{ note: `Die Animation konnte nicht berechnet werden: ${String(err)}` }];
    }
  }, [scene, params, lang]);

  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const i = Math.min(pos, steps.length - 1);
  const step = steps[i];
  const last = steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (i >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setPos(i + 1), 1400 / speed);
    return () => clearTimeout(t);
  }, [playing, i, last, speed]);

  const parsed = useMemo(() => {
    const src = snippet?.[lang];
    return src ? parseSnippet(src) : null;
  }, [snippet, lang]);
  const hl = step.tag && parsed ? (parsed.tags[step.tag] ?? []) : [];
  const showOutput = steps.some((s) => s.out);

  const go = (n: number) => {
    setPlaying(false);
    setPos(Math.max(0, Math.min(last, n)));
  };
  const toggle = () => {
    if (i >= last) {
      setPos(0);
      setPlaying(true);
    } else setPlaying((p) => !p);
  };
  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') go(i + 1);
    else if (e.key === 'ArrowLeft') go(i - 1);
    else if (e.key === ' ') toggle();
    else return;
    e.preventDefault();
  };

  return (
    <figure className="player" tabIndex={0} onKeyDown={onKey} aria-label={scene.title ?? 'Animation'}>
      <header className="player-head">
        <span className="player-kicker">Schritt für Schritt</span>
        {scene.title && <span className="player-title">{scene.title}</span>}
        {(scene.params ?? []).map((p) => (
          <label key={p.name} className="param">
            <span>
              {p.label} = <strong>{params[p.name]}</strong>
            </span>
            <input
              type="range"
              min={p.min}
              max={p.max}
              value={params[p.name]}
              onChange={(e) => {
                setParams((old) => ({ ...old, [p.name]: Number(e.target.value) }));
                setPos(0);
                setPlaying(false);
              }}
            />
          </label>
        ))}
      </header>

      <div className={`player-body ${parsed ? '' : 'no-code'}`}>
        {parsed && (
          <div className="player-code">
            <div className="code-lang">{LANG_LABEL[lang]}</div>
            <CodeView code={parsed.code} lang={lang} hl={hl} />
          </div>
        )}
        <div className="player-stage">
          <StepViews step={step} prev={i > 0 ? steps[i - 1] : undefined} />
          {showOutput && (
            <div className="stage-output">
              <div className="mem-title">Ausgabe</div>
              <pre className="out">{step.out || ' '}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="player-note" aria-live="polite">
        {fmt(step.note)}
      </div>

      <footer className="player-controls">
        <button type="button" className="icon-btn" onClick={() => go(0)} disabled={i === 0} aria-label="Zum Anfang" title="Zum Anfang">
          ⏮
        </button>
        <button type="button" className="icon-btn" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Schritt zurück" title="Schritt zurück (←)">
          ◀
        </button>
        <button type="button" className="btn primary play" onClick={toggle}>
          {playing ? 'Pause' : i >= last ? 'Nochmal' : 'Abspielen'}
        </button>
        <button type="button" className="icon-btn" onClick={() => go(i + 1)} disabled={i >= last} aria-label="Schritt vor" title="Schritt vor (→)">
          ▶
        </button>
        <input
          className="scrub"
          type="range"
          min={0}
          max={last}
          value={i}
          onChange={(e) => go(Number(e.target.value))}
          aria-label="Schritt auswählen"
        />
        <span className="step-count">
          {i + 1} / {steps.length}
        </span>
        <button
          type="button"
          className="btn ghost small"
          onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
          title="Abspieltempo"
        >
          {speed}×
        </button>
      </footer>
    </figure>
  );
}

/** `<Szene name="…" />` in einer Lektion. */
export function ScenePlayer({ name }: { name: string }) {
  const { code, id } = useLesson();
  const { lang } = useApp();
  const scene = code.scenes?.[name];
  if (!scene) return <p className="missing">Animation „{name}" fehlt in Lektion {id}.</p>;
  const snippet = scene.code ? code.snippets?.[scene.code] : undefined;
  return <Player key={name} scene={scene} snippet={snippet} lang={lang} />;
}
