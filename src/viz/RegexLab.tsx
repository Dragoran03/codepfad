import { useMemo, useState } from 'react';

const BEISPIELE = [
  { label: 'Postleitzahl', muster: '\\b[0-9]{5}\\b' },
  { label: 'E-Mail (vereinfacht)', muster: '[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\\.[a-z]{2,}' },
  { label: 'Datum', muster: '([0-9]{4})-([0-9]{2})-([0-9]{2})' },
  { label: 'Wörter mit großem Anfang', muster: '\\b[A-ZÄÖÜ][a-zäöüß]+' },
];

const TEXT = `Mia Schulz, mia.schulz@example.org, 10115 Berlin, seit 2021-03-14
Ben Koch, ben@example.org, 20095 Hamburg, seit 2019-11-02
Clara Wolf, keine Mail, 80331 München, seit 2023-07-30
Telefon der Zentrale: 030 1234567`;

/** Reguläre Ausdrücke live ausprobieren. */
export function RegexLab() {
  const [muster, setMuster] = useState(BEISPIELE[0].muster);
  const [text, setText] = useState(TEXT);
  const [gross, setGross] = useState(true);

  const { teile, treffer, fehler } = useMemo(() => {
    try {
      const re = new RegExp(muster, gross ? 'gu' : 'giu');
      const found: { start: number; end: number; gruppen: string[] }[] = [];
      if (muster) {
        for (const m of text.matchAll(re)) {
          if (m[0].length === 0) continue;
          found.push({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, gruppen: m.slice(1).map((g) => g ?? '') });
          if (found.length > 200) break;
        }
      }
      const parts: { text: string; hit: number }[] = [];
      let pos = 0;
      found.forEach((f, i) => {
        if (f.start > pos) parts.push({ text: text.slice(pos, f.start), hit: -1 });
        parts.push({ text: text.slice(f.start, f.end), hit: i });
        pos = f.end;
      });
      parts.push({ text: text.slice(pos), hit: -1 });
      return { teile: parts, treffer: found, fehler: null as string | null };
    } catch (e) {
      return { teile: [{ text, hit: -1 }], treffer: [], fehler: (e as Error).message };
    }
  }, [muster, text, gross]);

  return (
    <figure className="regexlab">
      <header className="player-head">
        <span className="player-kicker">Zum Ausprobieren</span>
        <span className="player-title">Regex-Labor</span>
        <label className="check">
          <input type="checkbox" checked={!gross} onChange={(e) => setGross(!e.target.checked)} />
          Groß/klein egal
        </label>
      </header>
      <div className="regex-body">
        <label className="regex-pattern">
          <span>Muster</span>
          <input value={muster} onChange={(e) => setMuster(e.target.value)} spellCheck={false} aria-label="Regulärer Ausdruck" />
        </label>
        <div className="regex-presets">
          {BEISPIELE.map((b) => (
            <button key={b.label} type="button" className="btn ghost small" onClick={() => setMuster(b.muster)}>
              {b.label}
            </button>
          ))}
        </div>
        {fehler && <div className="output-head bad standalone">Ungültiges Muster: {fehler}</div>}
        <div className="regex-text" aria-live="polite">
          {teile.map((t, i) =>
            t.hit >= 0 ? (
              <mark key={i} className={`m${t.hit % 2}`}>
                {t.text}
              </mark>
            ) : (
              <span key={i}>{t.text}</span>
            ),
          )}
        </div>
        <details className="regex-edit">
          <summary>Text bearbeiten</summary>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} spellCheck={false} />
        </details>
        <div className="regex-summary">
          <strong>
            {treffer.length} {treffer.length === 1 ? 'Treffer' : 'Treffer'}
          </strong>
          {treffer.some((t) => t.gruppen.length > 0) && (
            <table className="data compact">
              <thead>
                <tr>
                  <th>Treffer</th>
                  {treffer[0].gruppen.map((_, i) => (
                    <th key={i}>Gruppe {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {treffer.slice(0, 10).map((t, i) => (
                  <tr key={i}>
                    <td>{text.slice(t.start, t.end)}</td>
                    {t.gruppen.map((g, j) => (
                      <td key={j}>{g}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </figure>
  );
}
