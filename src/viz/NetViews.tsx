import type { ReactNode } from 'react';
import type { LayersView, SeqView, TopoView } from '../../content/types.ts';

// ---------- Sequenzdiagramm ----------

export function Sequence({ view }: { view: SeqView }) {
  const n = view.actors.length;
  const colW = 170;
  const rowH = 46;
  const top = 44;
  const width = Math.max(1, n) * colW;
  const height = top + view.msgs.length * rowH + 16;
  const cx = (i: number) => i * colW + colW / 2;
  const hi = view.hi ?? view.msgs.length - 1;
  return (
    <div className="array-scroll">
      <svg className="seq" viewBox={`0 0 ${width} ${height}`} style={{ width: Math.min(width, 720), maxWidth: '100%' }} role="img" aria-label="Sequenzdiagramm">
        <defs>
          <marker id="seq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1 L 9 5 L 0 9 z" className="seq-head" />
          </marker>
          <marker id="seq-arrow-hi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1 L 9 5 L 0 9 z" className="seq-head hi" />
          </marker>
        </defs>
        {view.actors.map((a, i) => (
          <g key={a}>
            <line x1={cx(i)} x2={cx(i)} y1={top - 6} y2={height - 6} className="seq-life" />
            <rect x={cx(i) - 66} y={4} width={132} height={28} rx={8} className="seq-actor" />
            <text x={cx(i)} y={23} textAnchor="middle" className="seq-actor-text">
              {a}
            </text>
          </g>
        ))}
        {view.msgs.map((m, k) => {
          const y = top + k * rowH + 26;
          const x1 = cx(m.from);
          const x2raw = cx(m.to);
          const dir = Math.sign(x2raw - x1) || 1;
          const x2 = m.lost ? x1 + (x2raw - x1) * 0.6 : x2raw - dir * 4;
          const isHi = k === hi;
          const mid = (x1 + x2raw) / 2;
          return (
            <g key={k} className={`seq-msg ${isHi ? 'hi' : ''} ${m.tone !== undefined ? `t${m.tone % 5}` : ''}`}>
              <line x1={x1 + dir * 4} x2={x2} y1={y} y2={y} className={m.lost ? 'lost' : ''} markerEnd={m.lost ? undefined : `url(#${isHi ? 'seq-arrow-hi' : 'seq-arrow'})`} />
              {m.lost && (
                <text x={x2 + dir * 6} y={y + 5} textAnchor="middle" className="seq-x">
                  ✕
                </text>
              )}
              <text x={mid} y={y - 8} textAnchor="middle" className="seq-label">
                {m.label}
              </text>
              {m.sub && (
                <text x={mid} y={y + 15} textAnchor="middle" className="seq-sub">
                  {m.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------- Kapselung ----------

export function Layers({ view }: { view: LayersView }) {
  const render = (i: number): ReactNode => {
    if (i >= view.layers.length) {
      return view.payload !== undefined ? <div className="layer-payload">{view.payload}</div> : null;
    }
    const l = view.layers[i];
    return (
      <div className={`layer t${(l.tone ?? i) % 5} ${view.hi === i ? 'hi' : ''}`}>
        <div className="layer-head">
          <span className="layer-label">{l.label}</span>
          {l.sub && <span className="layer-sub">{l.sub}</span>}
        </div>
        <div className="layer-inner">{render(i + 1)}</div>
      </div>
    );
  };
  return <div className="layers">{render(0)}</div>;
}

// ---------- Topologie ----------

const ICON: Record<string, string> = {
  pc: '▭',
  server: '▤',
  switch: '⇄',
  router: '✣',
  cloud: '☁',
  device: '◉',
  bus: '',
};

export function Topology({ view }: { view: TopoView }) {
  const W = view.width ?? 640;
  const H = view.height ?? 280;
  const byId = new Map(view.nodes.map((n) => [n.id, n]));
  const point = (id: string, other?: string) => {
    const n = byId.get(id);
    if (!n) return { x: 0, y: 0 };
    if (n.kind === 'bus' && other) {
      // An einem Bus dockt die Leitung senkrecht über bzw. unter dem anderen Knoten an.
      const o = byId.get(other);
      const half = (n.w ?? 400) / 2;
      return { x: Math.max(n.x - half, Math.min(n.x + half, o?.x ?? n.x)), y: n.y };
    }
    return { x: n.x, y: n.y };
  };
  return (
    <div className="array-scroll">
      <svg className="topo" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W }} role="img" aria-label="Netzwerkplan">
        {view.links.map((l, i) => {
          const a = point(l.a, l.b);
          const b = point(l.b, l.a);
          return (
            <g key={i} className={`topo-link ${l.tone !== undefined ? `t${l.tone % 5}` : ''} ${l.hi ? 'hi' : ''} ${l.dim ? 'dim' : ''}`}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeDasharray={l.dashed ? '6 5' : undefined} />
              {l.label && (
                <text x={(a.x + b.x) / 2 + 6} y={(a.y + b.y) / 2 - 6} className="topo-link-label">
                  {l.label}
                </text>
              )}
            </g>
          );
        })}
        {view.nodes.map((n) =>
          n.kind === 'bus' ? (
            <g key={n.id} className={`topo-bus ${n.tone !== undefined ? `t${n.tone % 5}` : ''} ${n.hi ? 'hi' : ''}`}>
              <line x1={n.x - (n.w ?? 400) / 2} x2={n.x + (n.w ?? 400) / 2} y1={n.y} y2={n.y} />
              <text x={n.x - (n.w ?? 400) / 2} y={n.y + 22} className="topo-sub">
                {n.label}
                {n.sub ? ` · ${n.sub}` : ''}
              </text>
            </g>
          ) : (
            <g key={n.id} className={`topo-node ${n.kind} ${n.tone !== undefined ? `t${n.tone % 5}` : ''} ${n.hi ? 'hi' : ''} ${n.dim ? 'dim' : ''}`} transform={`translate(${n.x}, ${n.y})`}>
              <rect x={-52} y={-22} width={104} height={44} rx={n.kind === 'router' || n.kind === 'cloud' ? 22 : 9} />
              <text y={-3} textAnchor="middle" className="topo-label">
                <tspan className="topo-icon">{ICON[n.kind]}</tspan> {n.label}
              </text>
              {n.sub && (
                <text y={13} textAnchor="middle" className="topo-sub">
                  {n.sub}
                </text>
              )}
            </g>
          ),
        )}
        {(view.packets ?? []).map((p, i) => {
          const a = point(p.a, p.b);
          const b = point(p.b, p.a);
          const t = p.t ?? 0.5;
          const x = a.x + (b.x - a.x) * t;
          const y = a.y + (b.y - a.y) * t;
          const w = Math.max(40, p.label.length * 7 + 14);
          return (
            <g key={i} className={`topo-packet ${p.tone !== undefined ? `t${p.tone % 5}` : ''} ${p.lost ? 'lost' : ''}`} transform={`translate(${x}, ${y})`}>
              <rect x={-w / 2} y={-11} width={w} height={22} rx={11} />
              <text textAnchor="middle" y={4}>
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
