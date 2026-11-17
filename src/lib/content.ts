import type { ComponentType } from 'react';
import { CHAPTERS } from '../../content/curriculum.ts';
import type { Chapter, LessonMeta } from '../../content/curriculum.ts';
import type { Exercise, Lang, LessonCode, Track } from '../../content/types.ts';
import { trackInfo } from '../../content/types.ts';

type MdxModule = { default: ComponentType<{ components?: Record<string, unknown> }> };

const codeModules = import.meta.glob<{ default: LessonCode }>('/content/lessons/*/code.ts', { eager: true });
const mdxModules = import.meta.glob<MdxModule>('/content/lessons/*/lesson.mdx');

const EMPTY: LessonCode = {};

export function lessonCode(id: string): LessonCode {
  return codeModules[`/content/lessons/${id}/code.ts`]?.default ?? EMPTY;
}

export function lessonExists(id: string): boolean {
  return `/content/lessons/${id}/lesson.mdx` in mdxModules;
}

export function loadLesson(id: string): Promise<MdxModule> | null {
  const loader = mdxModules[`/content/lessons/${id}/lesson.mdx`];
  return loader ? loader() : null;
}

export interface LessonRef {
  meta: LessonMeta;
  chapter: Chapter;
  /** Position innerhalb des Pfads (0-basiert). */
  index: number;
}

const ORDER: Record<Track, LessonRef[]> = { general: [], sql: [], tools: [], maschine: [], netz: [] };
for (const chapter of CHAPTERS) {
  for (const meta of chapter.lessons) {
    ORDER[chapter.track].push({ meta, chapter, index: ORDER[chapter.track].length });
  }
}

export function lessonsOf(track: Track): LessonRef[] {
  return ORDER[track];
}

export function findLesson(id: string): LessonRef | undefined {
  for (const list of Object.values(ORDER)) {
    const hit = list.find((l) => l.meta.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function langsOf(track: Track): Lang[] {
  return trackInfo(track).langs;
}

/** Passt die Sprache zum Pfad? Sonst: die passende Sprache für diesen Pfad. */
export function langFor(track: Track, current: Lang, generalLang: Lang): Lang {
  const langs = langsOf(track);
  if (langs.includes(current)) return current;
  return langs.includes(generalLang) ? generalLang : langs[0];
}

/** Schlüssel, unter dem eine gelöste Aufgabe gespeichert wird. */
export function solvedKey(lessonId: string, ex: Exercise, lang: Lang): string {
  return ex.kind === 'code' || ex.kind === 'sql' ? `${lessonId}/${ex.id}@${lang}` : `${lessonId}/${ex.id}`;
}

export interface LessonProgress {
  done: number;
  total: number;
  complete: boolean;
}

export function lessonProgress(lessonId: string, lang: Lang, solved: Record<string, number>): LessonProgress {
  const exercises = lessonCode(lessonId).exercises ?? [];
  const done = exercises.filter((ex) => solvedKey(lessonId, ex, lang) in solved).length;
  return { done, total: exercises.length, complete: exercises.length > 0 && done === exercises.length };
}

export function trackProgress(track: Track, lang: Lang, solved: Record<string, number>): LessonProgress {
  let done = 0;
  let total = 0;
  for (const l of lessonsOf(track)) {
    const p = lessonProgress(l.meta.id, lang, solved);
    done += p.done;
    total += p.total;
  }
  return { done, total, complete: total > 0 && done === total };
}
