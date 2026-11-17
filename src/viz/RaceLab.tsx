import { useState } from 'react';

type Phase = 0 | 1 | 2 | 3; // 0: noch nichts, 1: gelesen, 2: gerechnet, 3: zurückgeschrieben

interface ThreadState {
  phase: Phase;
  reg: number | null;
}

const STEP_LABEL = ['Zähler lesen', '1 addieren', 'Ergebnis zurückschreiben'];

const START: { counter: number; a: ThreadState; b: ThreadState; log: string[] } = {
  counter: 0,
  a: { phase: 0, reg: null },
  b: { phase: 0, reg: null },
  log: [],
};

/** Zwei Threads erhöhen denselben Zähler. Du bestimmst, wer wann den nächsten Teilschritt macht. */
export function RaceLab() {
  const [s, setS] = useState(START);
  const [locked, setLocked] = useState(false);
  const [owner, setOwner] = useState<'a' | 'b' | null>(null);

  const advance = (who: 'a' | 'b') => {
    const t = s[who];
    if (t.phase === 3) return;
    const name = who === 'a' ? 'Thread A' : 'Thread B';
    let counter = s.counter;
    let reg = t.reg;
    let msg: string;
    if (t.phase === 0) {
      reg = counter;
      msg = `${name} liest den Zähler: ${counter}`;
      if (locked) setOwner(who);
    } else if (t.phase === 1) {
      reg = (reg ?? 0) + 1;
      msg = `${name} rechnet im eigenen Zwischenspeicher: ${reg}`;
    } else {
      counter = reg ?? 0;
      msg = `${name} schreibt ${counter} zurück`;
      if (locked) setOwner(null);
    }
    setS({ ...s, counter, [who]: { phase: (t.phase + 1) as Phase, reg }, log: [...s.log, msg] });
  };

  const reset = () => {
    setS(START);
    setOwner(null);
  };

  const done = s.a.phase === 3 && s.b.phase === 3;
  const blocked = (who: 'a' | 'b') => locked && owner !== null && owner !== who;

  const lane = (who: 'a' | 'b', label: string) => {
    const t = s[who];
    return (
      <div className={`race-lane ${blocked(who) ? 'blocked' : ''}`}>
        <div className="race-name">{label}</div>
        <ol className="race-steps">
          {STEP_LABEL.map((l, i) => (
            <li key={i} className={t.phase > i ? 'done' : t.phase === i ? 'next' : ''}>
              {l}
            </li>
          ))}
        </ol>
        <div className="race-reg">
          Zwischenspeicher: <strong>{t.reg ?? '–'}</strong>
        </div>
        <button type="button" className="btn small" onClick={() => advance(who)} disabled={t.phase === 3 || blocked(who)}>
          {t.phase === 3 ? 'Fertig' : blocked(who) ? 'Wartet auf die Sperre' : `Nächster Schritt: ${STEP_LABEL[t.phase]}`}
        </button>
      </div>
    );
  };

  return (
    <figure className="race">
      <header className="player-head">
        <span className="player-kicker">Zum Ausprobieren</span>
        <span className="player-title">Zwei Threads, ein Zähler</span>
        <label className="check">
          <input
            type="checkbox"
            checked={locked}
            onChange={(e) => {
              setLocked(e.target.checked);
              reset();
            }}
          />
          Mit Sperre (Mutex)
        </label>
      </header>
      <div className="race-body">
        {lane('a', 'Thread A')}
        <div className="race-shared">
          <div className="mem-title">Gemeinsamer Zähler</div>
          <div className={`race-counter ${done ? (s.counter === 2 ? 'good' : 'bad') : ''}`}>{s.counter}</div>
          {locked && <div className="race-lock">{owner ? `Gesperrt von Thread ${owner.toUpperCase()}` : 'Frei'}</div>}
        </div>
        {lane('b', 'Thread B')}
      </div>
      <div className="player-note" aria-live="polite">
        {!done && s.log.length === 0 && (
          <>
            Beide Threads wollen den Zähler um 1 erhöhen – am Ende sollte also 2 herauskommen. „Zähler erhöhen" besteht aber aus
            drei Teilschritten. Versuche, die Schritte so zu mischen, dass am Ende nur 1 dasteht.
          </>
        )}
        {!done && s.log.length > 0 && s.log[s.log.length - 1]}
        {done && s.counter === 2 && !locked && (
          <>Ergebnis 2 – diesmal ging es gut, weil ein Thread fertig war, bevor der andere gelesen hat. Setze zurück und lass beide lesen, bevor einer schreibt.</>
        )}
        {done && s.counter === 2 && locked && (
          <>Ergebnis 2 – und zwar immer. Die Sperre erlaubt nur einem Thread, die drei Schritte am Stück auszuführen. Der andere muss warten.</>
        )}
        {done && s.counter !== 2 && (
          <>
            <strong>Ergebnis {s.counter} statt 2.</strong> Beide haben den alten Wert 0 gelesen, beide haben 1 zurückgeschrieben – eine
            Erhöhung ist verloren gegangen. Das ist eine Race Condition. Schalte oben die Sperre ein und versuche es noch einmal.
          </>
        )}
      </div>
      <footer className="player-controls">
        <button type="button" className="btn ghost small" onClick={reset}>
          Zurücksetzen
        </button>
      </footer>
    </figure>
  );
}
