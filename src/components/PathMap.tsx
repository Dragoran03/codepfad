import { CHAPTERS } from '../../content/curriculum.ts';
import type { Chapter } from '../../content/curriculum.ts';
import { LANG_LABEL, TRACKS, trackInfo } from '../../content/types.ts';
import type { Lang } from '../../content/types.ts';
import { langsOf, lessonExists, lessonProgress, lessonsOf, trackProgress } from '../lib/content.ts';
import { routeHref, useApp } from '../state.tsx';
import { useSwitchLang } from './Header.tsx';

const STEP_Y = 116;
const AMPLITUDE = 120;
const NODE = 64;

/** Seitlicher Versatz des n-ten Knotens: der Weg schlängelt sich. */
function offsetX(globalIndex: number): number {
  return Math.round(Math.sin(globalIndex * 0.95) * AMPLITUDE);
}

function Trail({ chapter, startIndex, nextId }: { chapter: Chapter; startIndex: number; nextId: string | null }) {
  const { lang, solved } = useApp();
  const langs = langsOf(chapter.track);
  const points = chapter.lessons.map((_, i) => ({ x: offsetX(startIndex + i), y: i * STEP_Y + NODE / 2 }));
  const height = chapter.lessons.length * STEP_Y - (STEP_Y - NODE);
  let d = '';
  points.forEach((p, i) => {
    if (i === 0) d += `M ${p.x} ${p.y}`;
    else {
      const q = points[i - 1];
      const my = (q.y + p.y) / 2;
      d += ` C ${q.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
    }
  });

  return (
    <div className="trail" style={{ height }}>
      <svg className="trail-line" viewBox={`-400 0 800 ${height}`} preserveAspectRatio="xMidYMin meet" aria-hidden="true" style={{ height }}>
        <path d={d} />
      </svg>
      {chapter.lessons.map((lesson, i) => {
        const p = lessonProgress(lesson.id, lang, solved);
        const exists = lessonExists(lesson.id);
        const x = points[i].x;
        // Beschriftung auf die Seite legen, von der der Weg wegführt.
        const around = [points[i - 1]?.x, points[i + 1]?.x].filter((v): v is number => v !== undefined);
        const avg = around.length ? around.reduce((a, b) => a + b, 0) / around.length : 0;
        const side = avg > x || (avg === x && x > 0) ? 'left' : 'right';
        const isNext = lesson.id === nextId;
        const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
        return (
          <a
            key={lesson.id}
            className={`stop ${side} ${p.complete ? 'complete' : ''} ${isNext ? 'next' : ''} ${exists ? '' : 'soon'}`}
            style={{ top: i * STEP_Y, ['--x' as string]: `${x}px` }}
            href={exists ? routeHref({ page: 'lesson', id: lesson.id }) : undefined}
            aria-disabled={!exists}
          >
            <span className="stop-node" style={{ ['--pct' as string]: `${pct}%` }}>
              <span className="stop-inner">{p.complete ? '✓' : startIndex + i + 1}</span>
            </span>
            <span className="stop-text">
              {isNext && <span className="stop-next">Hier geht es weiter</span>}
              <span className="stop-title">{lesson.title}</span>
              <span className="stop-summary">{lesson.summary}</span>
              <span className="stop-meta">
                {p.total > 0 && (
                  <span>
                    {p.done}/{p.total} Aufgaben
                  </span>
                )}
                {langs.length > 1 && (
                  <span className="stop-langs" aria-label="In diesen Sprachen abgeschlossen">
                    {langs.map((l) => (
                      <span
                        key={l}
                        data-lang={l}
                        className={`mini-dot ${lessonProgress(lesson.id, l, solved).complete ? 'on' : ''}`}
                        title={`${LANG_LABEL[l]}: ${lessonProgress(lesson.id, l, solved).complete ? 'abgeschlossen' : 'offen'}`}
                      />
                    ))}
                  </span>
                )}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

function LangProgress() {
  const { lang, solved, track } = useApp();
  const switchLang = useSwitchLang();
  return (
    <div className="lang-progress">
      {langsOf(track).map((l: Lang) => {
        const p = trackProgress(track, l, solved);
        const pct = p.total ? (p.done / p.total) * 100 : 0;
        return (
          <button key={l} type="button" data-lang={l} className={`lp-row ${l === lang ? 'active' : ''}`} onClick={() => switchLang(l)}>
            <span className="lp-name">{LANG_LABEL[l]}</span>
            <span className="lp-bar">
              <span style={{ width: `${pct}%` }} />
            </span>
            <span className="lp-num">
              {p.done}/{p.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TrackTabs() {
  const { track, setTrack, solved, lang } = useApp();
  return (
    <nav className="track-tabs" aria-label="Lernpfade">
      {TRACKS.map((t) => {
        const lessons = lessonsOf(t.id);
        const p = trackProgress(t.id, t.langs.includes(lang) ? lang : t.langs[0], solved);
        return (
          <button
            key={t.id}
            type="button"
            className={`track-tab ${t.id === track ? 'active' : ''}`}
            aria-pressed={t.id === track}
            onClick={() => setTrack(t.id)}
          >
            <span className="track-name">{t.short}</span>
            <span className="track-meta">
              {lessons.length} Lektionen{p.total > 0 ? ` · ${Math.round((p.done / p.total) * 100)} %` : ''}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function PathMap() {
  const { lang, solved, resetProgress, track } = useApp();
  const info = trackInfo(track);
  const chapters = CHAPTERS.filter((c) => c.track === track);
  const lessons = lessonsOf(track);
  const next = lessons.find((l) => lessonExists(l.meta.id) && !lessonProgress(l.meta.id, lang, solved).complete);
  const total = trackProgress(track, lang, solved);
  const multi = info.langs.length > 1;
  let counter = 0;

  return (
    <main className="path-page">
      <TrackTabs />
      <section className="hero">
        <div className="hero-text">
          <p className="kicker">Pfad: {info.label}</p>
          <h1>
            {multi ? (
              <>
                {info.label} <span className="accent-text">in {LANG_LABEL[lang]}</span>
              </>
            ) : (
              <span className="accent-text">{info.label}</span>
            )}
          </h1>
          <p className="lead">{info.intro}</p>
          {next ? (
            <a className="btn primary big" href={routeHref({ page: 'lesson', id: next.meta.id })}>
              {total.done === 0 ? 'Loslegen' : 'Weitermachen'}: {next.meta.title}
            </a>
          ) : (
            <p className="lead">
              <strong>Alle Lektionen dieses Pfads abgeschlossen.</strong>
              {multi ? ' Probier denselben Pfad in einer anderen Sprache.' : ''}
            </p>
          )}
        </div>
        <div className="hero-side">
          <h2>{multi ? 'Fortschritt je Sprache' : 'Fortschritt'}</h2>
          <LangProgress />
          <p className="hint-line">
            {multi ? 'Gelöste Programmieraufgaben zählen pro Sprache. ' : ''}Tasten 1–7 wechseln die Sprache.
          </p>
        </div>
      </section>

      {chapters.map((chapter, ci) => {
        const start = counter;
        counter += chapter.lessons.length;
        return (
          <section key={chapter.id} className="chapter">
            <header className="chapter-head">
              <span className="chapter-num">Kapitel {ci + 1}</span>
              <h2>{chapter.title}</h2>
              <p>{chapter.summary}</p>
            </header>
            <Trail chapter={chapter} startIndex={start} nextId={next?.meta.id ?? null} />
          </section>
        );
      })}

      <footer className="path-footer">
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            if (confirm('Wirklich den gesamten Fortschritt in allen Sprachen löschen?')) resetProgress();
          }}
        >
          Fortschritt zurücksetzen
        </button>
      </footer>
    </main>
  );
}
