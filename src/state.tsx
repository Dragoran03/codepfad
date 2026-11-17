import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ALL_LANGS, TRACKS } from '../content/types.ts';
import type { Lang, LessonCode, Track } from '../content/types.ts';
import { langFor } from './lib/content.ts';
import { api } from './lib/api.ts';

export function loadLocal<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

export function saveLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher voll oder gesperrt – nicht schlimm */
  }
}

export type Theme = 'system' | 'light' | 'dark';

export type Route = { page: 'path' } | { page: 'lesson'; id: string } | { page: 'playground' };

function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'lektion' && parts[1]) return { page: 'lesson', id: decodeURIComponent(parts[1]) };
  if (parts[0] === 'spielwiese') return { page: 'playground' };
  return { page: 'path' };
}

export function routeHref(route: Route): string {
  if (route.page === 'lesson') return `#/lektion/${route.id}`;
  if (route.page === 'playground') return '#/spielwiese';
  return '#/';
}

interface AppState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Gewählter Lernpfad. */
  track: Track;
  setTrack: (track: Track) => void;
  /** Zuletzt gewählte Sprache des allgemeinen Pfads (alles außer SQL). */
  generalLang: Lang;
  theme: Theme;
  setTheme: (t: Theme) => void;
  solved: Record<string, number>;
  markSolved: (key: string) => void;
  resetProgress: () => void;
  route: Route;
  navigate: (route: Route) => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('AppProvider fehlt');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const l = loadLocal<Lang>('cp:lang', 'python');
    return ALL_LANGS.includes(l) ? l : 'python';
  });
  const [generalLang, setGeneralLang] = useState<Lang>(() => loadLocal<Lang>('cp:generalLang', 'python'));
  const [track, setTrackState] = useState<Track>(() => {
    const t = loadLocal<Track>('cp:track', 'general');
    return TRACKS.some((x) => x.id === t) ? t : 'general';
  });
  const [theme, setThemeState] = useState<Theme>(() => loadLocal<Theme>('cp:theme', 'system'));
  const [solved, setSolved] = useState<Record<string, number>>(() => loadLocal('cp:solved', {}));
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const loaded = useRef(false);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    saveLocal('cp:lang', l);
    if (l !== 'sql' && l !== 'bash') {
      setGeneralLang(l);
      saveLocal('cp:generalLang', l);
    }
    // Passt die Sprache nicht zum Pfad, wechselt der Pfad mit.
    setTrackState((t) => {
      const fits = TRACKS.find((x) => x.id === t)!.langs.includes(l);
      const next: Track = fits ? t : l === 'sql' ? 'sql' : l === 'bash' ? 'tools' : 'general';
      saveLocal('cp:track', next);
      return next;
    });
  }, []);

  const setTrack = useCallback(
    (t: Track) => {
      setTrackState(t);
      saveLocal('cp:track', t);
      const l = langFor(t, lang, generalLang);
      if (l !== lang) {
        setLangState(l);
        saveLocal('cp:lang', l);
      }
    },
    [lang, generalLang],
  );

  useEffect(() => {
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    saveLocal('cp:theme', t);
    if (t === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }, []);

  // Fortschritt liegt auf dem Server (data/progress.json); localStorage ist nur die Sicherung.
  useEffect(() => {
    api
      .getProgress()
      .then((p) => {
        loaded.current = true;
        setSolved((local) => {
          const merged = { ...local, ...(p.solved ?? {}) };
          saveLocal('cp:solved', merged);
          if (Object.keys(merged).length !== Object.keys(p.solved ?? {}).length) {
            void api.putProgress({ solved: merged }).catch(() => {});
          }
          return merged;
        });
      })
      .catch(() => {
        loaded.current = true;
      });
  }, []);

  const markSolved = useCallback((key: string) => {
    setSolved((prev) => {
      if (key in prev) return prev;
      const next = { ...prev, [key]: Date.now() };
      saveLocal('cp:solved', next);
      void api.putProgress({ solved: next }).catch(() => {});
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setSolved({});
    saveLocal('cp:solved', {});
    void api.putProgress({ solved: {} }).catch(() => {});
  }, []);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((r: Route) => {
    location.hash = routeHref(r);
  }, []);

  const value = useMemo<AppState>(
    () => ({ lang, setLang, track, setTrack, generalLang, theme, setTheme, solved, markSolved, resetProgress, route, navigate }),
    [lang, setLang, track, setTrack, generalLang, theme, setTheme, solved, markSolved, resetProgress, route, navigate],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ---------- Kontext einer geöffneten Lektion ----------

export interface LessonState {
  id: string;
  code: LessonCode;
}

export const LessonContext = createContext<LessonState | null>(null);

export function useLesson(): LessonState {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error('Diese Komponente funktioniert nur innerhalb einer Lektion');
  return ctx;
}
