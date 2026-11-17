import { useState } from 'react';

const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];

function charOf(n: number): string {
  if (n === 32) return 'Leerzeichen';
  if (n > 32 && n < 127) return String.fromCharCode(n);
  return '(kein druckbares Zeichen)';
}

/** Acht Schalter = ein Byte. Zeigt denselben Speicherinhalt als Zahl, Hex-Wert und Zeichen. */
export function BitLab() {
  const [value, setValue] = useState(65);
  const [wrapped, setWrapped] = useState<string | null>(null);
  const bits = WEIGHTS.map((w) => (value & w) !== 0);
  const signed = value >= 128 ? value - 256 : value;
  const hex = value.toString(16).toUpperCase().padStart(2, '0');
  const sum = WEIGHTS.filter((_, i) => bits[i]).join(' + ') || '0';

  const step = (d: number) => {
    const next = (value + d + 256) % 256;
    setWrapped(
      value + d > 255
        ? 'Überlauf: 255 + 1 passt nicht mehr in 8 Bit. Die neunte Stelle fällt weg, übrig bleibt 0 – wie ein Kilometerzähler, der umspringt.'
        : value + d < 0
          ? 'Unterlauf: 0 − 1 springt auf den größten Wert, 255.'
          : null,
    );
    setValue(next);
  };

  return (
    <figure className="bitlab">
      <header className="player-head">
        <span className="player-kicker">Zum Ausprobieren</span>
        <span className="player-title">Ein Byte, drei Lesarten</span>
        <button type="button" className="btn small" onClick={() => step(-1)}>
          − 1
        </button>
        <button type="button" className="btn small" onClick={() => step(1)}>
          + 1
        </button>
      </header>
      <div className="bitlab-body">
        <div className="bits" role="group" aria-label="Acht Bits">
          {WEIGHTS.map((w, i) => (
            <button
              key={w}
              type="button"
              className={`bit ${bits[i] ? 'on' : ''}`}
              aria-pressed={bits[i]}
              aria-label={`Bit mit Wert ${w}`}
              onClick={() => {
                setValue(value ^ w);
                setWrapped(null);
              }}
            >
              <span className="bit-value">{bits[i] ? 1 : 0}</span>
              <span className="bit-weight">{w}</span>
            </button>
          ))}
        </div>
        <dl className="bit-readout">
          <div>
            <dt>Als Zahl ohne Vorzeichen</dt>
            <dd>
              {value} <span className="bit-sum">= {sum}</span>
            </dd>
          </div>
          <div>
            <dt>Als Zahl mit Vorzeichen</dt>
            <dd>{signed}</dd>
          </div>
          <div>
            <dt>Hexadezimal</dt>
            <dd>0x{hex}</dd>
          </div>
          <div>
            <dt>Als Zeichen (ASCII)</dt>
            <dd>{charOf(value)}</dd>
          </div>
        </dl>
      </div>
      <div className="player-note" aria-live="polite">
        {wrapped ??
          'Klick auf die Schalter. Jede Stelle ist doppelt so viel wert wie die rechts daneben. Dieselben acht Bits bedeuten je nach Datentyp etwas anderes – der Speicher selbst weiß nicht, was er enthält.'}
      </div>
    </figure>
  );
}
