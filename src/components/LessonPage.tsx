import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { LANG_LABEL } from '../../content/types.ts';
import { findLesson, langsOf, lessonCode, lessonProgress, lessonsOf, loadLesson } from '../lib/content.ts';
import { LessonContext, routeHref, useApp } from '../state.tsx';
import { BigO } from '../viz/BigO.tsx';
import { BitLab } from '../viz/BitLab.tsx';
import { ScenePlayer } from '../viz/Player.tsx';
import { RaceLab } from '../viz/RaceLab.tsx';
import { RegexLab } from '../viz/RegexLab.tsx';
import { CompilerLab } from '../viz/CompilerLab.tsx';
import { Disasm } from '../viz/Disasm.tsx';
import { SubnetCalc } from '../viz/SubnetCalc.tsx';
import { ExerciseById, Schema } from './Exercise.tsx';
import { Callout, CodeBlock, Only } from './LessonParts.tsx';

type Mdx = ComponentType<{ components?: Record<string, unknown> }>;

function TableWrap(props: { children?: ReactNode }) {
  return (
    <div className="table-wrap">
      <table className="data prose-table" {...props} />
    </div>
  );
}

/** Diese Namen stehen in jeder Lektion (lesson.mdx) ohne Import zur Verfügung. */
const MDX_COMPONENTS = {
  Code: CodeBlock,
  Szene: ScenePlayer,
  Aufgabe: ExerciseById,
  Nur: Only,
  Merke: Callout,
  BigO,
  BitLab,
  RaceLab,
  RegexLab,
  CompilerLab,
  SubnetCalc,
  Uebersetzen: Disasm,
  Datensatz: Schema,
  table: TableWrap,
};

export function LessonPage({ id }: { id: string }) {
  const { lang, solved, track: currentTrack, setTrack } = useApp();
  const ref = findLesson(id);
  const lessonTrack = ref?.chapter.track;

  // Eine Lektion öffnet ihren Pfad und – falls nötig – eine passende Sprache.
  useEffect(() => {
    if (lessonTrack && lessonTrack !== currentTrack) setTrack(lessonTrack);
  }, [lessonTrack, currentTrack, setTrack]);
  const [Content, setContent] = useState<Mdx | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setContent(null);
    setFailed(false);
    const p = loadLesson(id);
    if (!p) {
      setFailed(true);
      return;
    }
    let alive = true;
    p.then((m) => alive && setContent(() => m.default)).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [id]);

  const ctx = useMemo(() => ({ id, code: lessonCode(id) }), [id]);

  if (!ref || failed) {
    return (
      <main className="lesson-page">
        <h1>Lektion nicht gefunden</h1>
        <p>
          Diese Lektion gibt es (noch) nicht. <a href={routeHref({ page: 'path' })}>Zurück zum Lernpfad</a>
        </p>
      </main>
    );
  }

  const track = ref.chapter.track;
  const wrongTrack = !langsOf(track).includes(lang);
  const all = lessonsOf(track);
  const prev = all[ref.index - 1];
  const next = all[ref.index + 1];
  const progress = lessonProgress(id, lang, solved);

  return (
    <main className="lesson-page">
      <nav className="crumbs" aria-label="Brotkrumen">
        <a href={routeHref({ page: 'path' })}>Lernpfad</a>
        <span aria-hidden="true">›</span>
        <span>{ref.chapter.title}</span>
      </nav>
      <header className="lesson-head">
        <p className="kicker">
          Lektion {ref.index + 1} von {all.length} · {LANG_LABEL[lang]}
        </p>
        <h1>{ref.meta.title}</h1>
        <p className="lead">{ref.meta.summary}</p>
      </header>

      {wrongTrack ? (
        <p className="missing">Diese Lektion gehört zu einem anderen Pfad. Wähle oben eine passende Sprache.</p>
      ) : (
        <LessonContext.Provider value={ctx}>
          <article className="prose">{Content ? <Content components={MDX_COMPONENTS} /> : <p className="loading">Lade Lektion …</p>}</article>
        </LessonContext.Provider>
      )}

      <footer className="lesson-foot">
        {progress.total > 0 && (
          <div className={`lesson-status ${progress.complete ? 'complete' : ''}`}>
            {progress.complete
              ? `✓ Lektion in ${LANG_LABEL[lang]} abgeschlossen`
              : `${progress.done} von ${progress.total} Aufgaben in ${LANG_LABEL[lang]} gelöst`}
          </div>
        )}
        <div className="lesson-nav">
          {prev ? (
            <a className="btn" href={routeHref({ page: 'lesson', id: prev.meta.id })}>
              ← {prev.meta.title}
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a className={`btn ${progress.complete ? 'primary' : ''}`} href={routeHref({ page: 'lesson', id: next.meta.id })}>
              {next.meta.title} →
            </a>
          ) : (
            <a className="btn primary" href={routeHref({ page: 'path' })}>
              Zum Lernpfad
            </a>
          )}
        </div>
      </footer>
    </main>
  );
}
