import { useState } from 'react';

interface Curve {
  id: string;
  label: string;
  example: string;
  f: (n: number) => number;
}

const CURVES: Curve[] = [
  { id: 'c1', label: 'O(1)', example: 'Array-Zugriff per Index', f: () => 1 },
  { id: 'c2', label: 'O(log n)', example: 'Binäre Suche', f: (n) => Math.max(1, Math.log2(n)) },
  { id: 'c3', label: 'O(n)', example: 'Lineare Suche', f: (n) => n },
  { id: 'c4', label: 'O(n log n)', example: 'Merge Sort', f: (n) => n * Math.max(1, Math.log2(n)) },
  { id: 'c5', label: 'O(n²)', example: 'Bubble Sort', f: (n) => n * n },
];

const W = 560;
const H = 300;
const PAD = { l: 44, r: 84, t: 14, b: 34 };
const N_MAX = 64;
const Y_MAX = 600;

const x = (n: number) => PAD.l + ((n - 1) / (N_MAX - 1)) * (W - PAD.l - PAD.r);
const y = (v: number) => H - PAD.b - (Math.min(v, Y_MAX) / Y_MAX) * (H - PAD.t - PAD.b);

function pathOf(c: Curve): string {
  let d = '';
  for (let n = 1; n <= N_MAX; n++) {
    const v = c.f(n);
    if (v > Y_MAX) {
      // bis zum oberen Rand zeichnen und abbrechen
      const prev = c.f(n - 1);
      const t = (Y_MAX - prev) / (v - prev);
      d += ` L ${x(n - 1 + t).toFixed(1)} ${y(Y_MAX).toFixed(1)}`;
      break;
    }
    d += `${n === 1 ? 'M' : ' L'} ${x(n).toFixed(1)} ${y(v).toFixed(1)}`;
  }
  return d;
}

function labelY(c: Curve): number {
  return y(c.f(N_MAX));
}

const fmtSteps = (v: number) => Math.round(v).toLocaleString('de-DE');

/** Interaktive Wachstumskurven: Wie viele Schritte braucht ein Verfahren bei n Elementen? */
export function BigO() {
  const [n, setN] = useState(16);
  const [big, setBig] = useState(1000);
  return (
    <figure className="bigo">
      <div className="bigo-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Wachstum der Schrittzahl für verschiedene Laufzeitklassen">
          {[0, 200, 400, 600].map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="grid" />
              <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" className="tick">
                {v}
              </text>
            </g>
          ))}
          {[1, 16, 32, 48, 64].map((v) => (
            <text key={v} x={x(v)} y={H - PAD.b + 18} textAnchor="middle" className="tick">
              {v}
            </text>
          ))}
          <text x={(PAD.l + W - PAD.r) / 2} y={H - 2} textAnchor="middle" className="axis-label">
            Anzahl Elemente n
          </text>
          <line x1={x(n)} x2={x(n)} y1={PAD.t} y2={H - PAD.b} className="cursor" />
          {CURVES.map((c) => (
            <g key={c.id} className={`curve ${c.id}`}>
              <path d={pathOf(c)} />
              {c.f(n) <= Y_MAX && <circle cx={x(n)} cy={y(c.f(n))} r={4.5} />}
              <text x={W - PAD.r + 8} y={c.f(N_MAX) > Y_MAX ? PAD.t + 10 + (c.id === 'c5' ? 0 : 16) : labelY(c) + 4}>
                {c.label}
              </text>
            </g>
          ))}
        </svg>
        <label className="param wide">
          <span>
            n = <strong>{n}</strong> Elemente
          </span>
          <input type="range" min={1} max={N_MAX} value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
      </div>
      <div className="bigo-table">
        <table className="data compact">
          <thead>
            <tr>
              <th>Klasse</th>
              <th>Beispiel</th>
              <th className="num">Schritte bei n = {n}</th>
              <th className="num">
                bei n ={' '}
                <select value={big} onChange={(e) => setBig(Number(e.target.value))} aria-label="Großes n">
                  <option value={1000}>1.000</option>
                  <option value={1000000}>1 Mio.</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            {CURVES.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className={`swatch ${c.id}`} />
                  {c.label}
                </td>
                <td>{c.example}</td>
                <td className="num">{fmtSteps(c.f(n))}</td>
                <td className="num">{fmtSteps(c.f(big))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <figcaption>
          Bei kleinen Datenmengen liegen alle Verfahren nah beieinander. Schiebe n nach rechts und vergleiche die letzte Spalte:
          Erst bei vielen Elementen entscheidet die Klasse über Millisekunden oder Stunden.
        </figcaption>
      </div>
    </figure>
  );
}
