import { useEffect } from 'react';
import { ALL_LANGS, LANG_LABEL } from '../../content/types.ts';
import type { Lang } from '../../content/types.ts';
import { findLesson, langsOf } from '../lib/content.ts';
import { routeHref, useApp } from '../state.tsx';
import type { Theme } from '../state.tsx';

const THEME_NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const THEME_LABEL: Record<Theme, string> = { system: 'Automatisch', light: 'Hell', dark: 'Dunkel' };

/** Wechselt die Sprache; passt die Seite an, wenn die offene Lektion nicht zum neuen Pfad gehört. */
export function useSwitchLang(): (l: Lang) => void {
  const { setLang, route, navigate } = useApp();
  return (l: Lang) => {
    setLang(l);
    if (route.page === 'lesson') {
      const lesson = findLesson(route.id);
      if (lesson && !langsOf(lesson.chapter.track).includes(l)) navigate({ page: 'path' });
    }
  };
}

export function LanguageSwitcher() {
  const { lang } = useApp();
  const switchLang = useSwitchLang();

  // Tastenkürzel 1–6, solange nicht gerade getippt wird.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.closest('.cm-editor'))) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= ALL_LANGS.length) switchLang(ALL_LANGS[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="lang-switch" role="radiogroup" aria-label="Programmiersprache">
      {ALL_LANGS.map((l, i) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={l === lang}
          data-lang={l}
          className={`lang-pill ${l === lang ? 'active' : ''} ${l === 'sql' || l === 'bash' ? 'sep' : ''}`}
          onClick={() => switchLang(l)}
          title={`${LANG_LABEL[l]} (Taste ${i + 1})`}
        >
          <span className="lang-dot" />
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}

export function Header() {
  const { route, theme, setTheme } = useApp();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="logo" href={routeHref({ page: 'path' })} aria-label="Codepfad – zum Lernpfad">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <rect width="32" height="32" rx="9" fill="var(--ink)" />
            <path d="M8 23c6.5 0 2-14 8-14s1.500 14 8 14" fill="none" stroke="var(--accent-bright)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>Codepfad</span>
        </a>
        <nav className="site-nav" aria-label="Hauptnavigation">
          <a href={routeHref({ page: 'path' })} aria-current={route.page !== 'playground' ? 'page' : undefined}>
            Lernpfad
          </a>
          <a href={routeHref({ page: 'playground' })} aria-current={route.page === 'playground' ? 'page' : undefined}>
            Spielwiese
          </a>
        </nav>
        <LanguageSwitcher />
        <button type="button" className="btn ghost small theme-toggle" onClick={() => setTheme(THEME_NEXT[theme])} title="Farbschema wechseln">
          {THEME_LABEL[theme]}
        </button>
      </div>
    </header>
  );
}
