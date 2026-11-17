import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Areas, FileTree } from './FileTree.tsx';
import { GitGraph } from './GitGraph.tsx';
import { Layers, Sequence, Topology } from './NetViews.tsx';
import type {
  ArrayView,
  BucketsView,
  Frame,
  HeapObj,
  ListView,
  PipelineView,
  Step,
  TableView,
  TreeNode,
  VarVal,
} from '../../content/types.ts';

// ---------- Variablen, Aufrufstapel und Heap ----------

interface Arrow {
  d: string;
  bad: boolean;
}

/** Zeichnet Pfeile von allen [data-from="id"] zu [data-to="id"] innerhalb des Containers. */
function useArrows(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const measure = useCallback(() => {
    const root = ref.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const next: Arrow[] = [];
    root.querySelectorAll<HTMLElement>('[data-from]').forEach((src) => {
      const target = root.querySelector<HTMLElement>(`[data-to="${src.dataset.from}"]`);
      if (!target) return;
      const a = src.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const x1 = a.left + a.width / 2 - box.left;
      const y1 = a.top + a.height / 2 - box.top;
      // Liegt das Ziel in derselben Spalte (z. B. Zeiger auf eine andere Stack-Variable),
      // läuft der Pfeil rechts außen herum und trifft das Ziel von rechts.
      const sameColumn = a.left + a.width / 2 >= b.left && a.left + a.width / 2 <= b.right;
      const x2 = sameColumn ? b.right - box.left + 4 : b.left - box.left - 4;
      const y2 = b.top + Math.min(b.height / 2, 22) - box.top;
      const bend = Math.max(30, Math.abs(x2 - x1) / 2);
      const d = sameColumn
        ? `M ${x1} ${y1} C ${x1 + 70} ${y1}, ${x2 + 70} ${y2}, ${x2} ${y2}`
        : `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
      next.push({ d, bad: src.dataset.bad === '1' || target.dataset.bad === '1' });
    });
    setArrows((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, []);

  useLayoutEffect(() => {
    measure();
    const root = ref.current;
    if (!root) return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [measure, dep]);

  return { ref, arrows };
}

const STATE_LABEL: Record<string, string> = {
  moved: 'verschoben',
  dangling: 'hängt',
  uninit: 'ohne Wert',
  borrowed: 'ausgeliehen',
};

function plain(v: VarVal | undefined): string {
  if (v === undefined) return '\u0000';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function Value({ v }: { v: VarVal }) {
  if (typeof v !== 'object') return <span className="val">{String(v)}</span>;
  return (
    <span className={`val ${v.state ?? ''}`}>
      {v.type && <span className="vtype">{v.type}</span>}
      {v.v !== undefined && <span className="vtext">{v.v}</span>}
      {v.ref && <span className="ref-dot" data-from={v.ref} data-bad={v.state === 'dangling' ? '1' : undefined} />}
      {v.state && <span className="vstate">{STATE_LABEL[v.state]}</span>}
    </span>
  );
}

function FrameBox({ frame, prev, top }: { frame: Frame; prev?: Frame; top: boolean }) {
  const names = Object.keys(frame.vars);
  return (
    <div className={`frame ${top ? 'top' : ''}`}>
      <div className="frame-name">{frame.name}</div>
      {names.length === 0 && <div className="frame-empty">noch keine Variablen</div>}
      {names.map((name) => {
        const changed = prev !== undefined && plain(prev.vars[name]) !== plain(frame.vars[name]);
        const fresh = prev === undefined || !(name in prev.vars);
        return (
          <div key={name} data-to={`${frame.name}.${name}`} className={`slot ${changed && !fresh ? 'changed' : ''} ${fresh ? 'fresh' : ''}`}>
            <span className="slot-name">{name}</span>
            <Value v={frame.vars[name]} />
          </div>
        );
      })}
    </div>
  );
}

function HeapBox({ obj }: { obj: HeapObj }) {
  return (
    <div className={`heap-obj ${obj.state ?? 'live'}`} data-to={obj.id} data-bad={obj.state === 'freed' ? '1' : undefined}>
      {obj.label && <div className="heap-label">{obj.label}</div>}
      <div className="heap-cells">
        {obj.cells.map((c, i) =>
          typeof c === 'object' ? (
            <span key={i} className="heap-cell">
              <span className="ref-dot" data-from={c.ref} />
            </span>
          ) : (
            <span key={i} className="heap-cell">
              {c}
            </span>
          ),
        )}
      </div>
      {obj.state === 'freed' && <div className="heap-state">freigegeben</div>}
      {obj.state === 'garbage' && <div className="heap-state">unerreichbar</div>}
    </div>
  );
}

function MemoryView({ step, prev }: { step: Step; prev?: Step }) {
  const { ref, arrows } = useArrows(step);
  const frames = step.frames ?? [];
  const hasHeap = step.heap !== undefined;
  // Neuester Aufruf oben – wie ein Stapel Teller.
  const ordered = frames.map((f, i) => ({ f, i })).reverse();
  return (
    <div className={`memory ${hasHeap ? 'with-heap' : ''}`} ref={ref}>
      <div className="mem-col">
        <div className="mem-title">{hasHeap || frames.length > 1 ? 'Stack' : 'Variablen'}</div>
        {ordered.map(({ f, i }) => (
          <FrameBox key={`${i}-${f.name}`} frame={f} prev={prev?.frames?.[i]?.name === f.name ? prev.frames[i] : undefined} top={i === frames.length - 1 && frames.length > 1} />
        ))}
      </div>
      {hasHeap && (
        <div className="mem-col heap">
          <div className="mem-title">Heap</div>
          {step.heap!.length === 0 && <div className="frame-empty">leer</div>}
          {step.heap!.map((o) => (
            <HeapBox key={o.id} obj={o} />
          ))}
        </div>
      )}
      <svg className="arrows" aria-hidden="true">
        <defs>
          <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--accent)" />
          </marker>
          <marker id="arrowhead-bad" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--bad)" />
          </marker>
        </defs>
        {arrows.map((a, i) => (
          <path key={i} d={a.d} className={a.bad ? 'bad' : ''} markerEnd={`url(#${a.bad ? 'arrowhead-bad' : 'arrowhead'})`} />
        ))}
      </svg>
    </div>
  );
}

// ---------- Arrays und Balken ----------

function ArrayRow({ view }: { view: ArrayView }) {
  const n = view.cells.length;
  const bars = view.bars === true;
  const w = bars ? 34 : 46;
  const nums = view.cells.map((c) => (typeof c === 'number' ? c : 0));
  const max = Math.max(1, ...nums);
  const barArea = 120;
  const pointerNames = Object.keys(view.pointers ?? {});
  // Mehrere Zeiger auf derselben Zelle untereinander anordnen.
  const stacked: Record<number, string[]> = {};
  for (const name of pointerNames) (stacked[view.pointers![name]] ??= []).push(name);
  const maxStack = Math.max(0, ...Object.values(stacked).map((s) => s.length));

  return (
    <div className="array-block">
      {view.label && <div className="mem-title">{view.label}</div>}
      <div className="array-scroll">
        <div
          className={`array ${bars ? 'bars' : ''}`}
          style={{ width: n * w, height: (bars ? barArea + 26 : 46) + (view.showIndex === false ? 0 : 18) + maxStack * 20 }}
        >
          {view.cells.map((c, i) => {
            const id = view.ids?.[i] ?? i;
            const cls = [
              'cell',
              view.hi?.includes(i) ? 'hi' : '',
              view.dim?.includes(i) ? 'dim' : '',
              view.done?.includes(i) ? 'done' : '',
            ].join(' ');
            return (
              <div key={id} className={cls} style={{ transform: `translateX(${i * w}px)`, width: w - 4 }}>
                {bars ? (
                  <>
                    <div className="bar-space" style={{ height: barArea }}>
                      <div className="bar" style={{ height: Math.max(6, (nums[i] / max) * barArea) }} />
                    </div>
                    <div className="bar-value">{c}</div>
                  </>
                ) : (
                  <div className="cell-box">{c}</div>
                )}
              </div>
            );
          })}
          {view.showIndex !== false &&
            view.cells.map((_, i) => (
              <div key={`i${i}`} className="cell-index" style={{ transform: `translateX(${i * w}px)`, width: w - 4, top: bars ? barArea + 26 : 46 }}>
                {i}
              </div>
            ))}
          {Object.entries(stacked).flatMap(([idx, names]) =>
            names.map((name, k) => (
              <div
                key={name}
                className="cell-pointer"
                style={{
                  transform: `translateX(${Number(idx) * w}px)`,
                  width: w - 4,
                  top: (bars ? barArea + 26 : 46) + (view.showIndex === false ? 0 : 18) + k * 20,
                }}
              >
                ↑{name}
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Hash-Tabelle ----------

function Buckets({ view }: { view: BucketsView }) {
  return (
    <div className="buckets">
      {view.hash && <div className="hash-line">{view.hash}</div>}
      {view.buckets.map((entries, i) => (
        <div key={i} className={`bucket ${view.hi === i ? 'hi' : ''}`}>
          <span className="bucket-index">{i}</span>
          <span className="bucket-entries">
            {entries.length === 0 && <span className="bucket-empty">leer</span>}
            {entries.map((e, j) => (
              <span key={j} className="chip">
                {e}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------- verkettete Liste ----------

function Linked({ view }: { view: ListView }) {
  const labels: Record<string, string[]> = {};
  for (const [name, id] of Object.entries(view.pointers ?? {})) (labels[id] ??= []).push(name);
  return (
    <div className="array-block">
      {view.label && <div className="mem-title">{view.label}</div>}
      <div className="array-scroll">
        <div className="linked">
          {view.nodes.map((node) => (
            <div key={node.id} className="linked-item">
              <div className="linked-labels">{(labels[node.id] ?? []).join(', ')}</div>
              <div className={`node ${view.hi === node.id ? 'hi' : ''}`}>
                <span className="node-value">{node.v}</span>
                <span className="node-next">•</span>
              </div>
              <span className="node-arrow">→</span>
            </div>
          ))}
          <div className="linked-item">
            <div className="linked-labels">{(labels['null'] ?? []).join(', ')}</div>
            <div className="node null">leer</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Aufrufbaum ----------

function Tree({ nodes }: { nodes: TreeNode[] }) {
  const children: Record<string, TreeNode[]> = {};
  const roots: TreeNode[] = [];
  for (const n of nodes) {
    if (n.parent) (children[n.parent] ??= []).push(n);
    else roots.push(n);
  }
  const pos: Record<string, { x: number; y: number }> = {};
  let leaf = 0;
  let depthMax = 0;
  const place = (n: TreeNode, depth: number): number => {
    depthMax = Math.max(depthMax, depth);
    const kids = children[n.id] ?? [];
    const x = kids.length === 0 ? leaf++ : kids.map((k) => place(k, depth + 1)).reduce((a, b) => a + b, 0) / kids.length;
    pos[n.id] = { x, y: depth };
    return x;
  };
  roots.forEach((r) => place(r, 0));
  const W = 92;
  const H = 70;
  const width = Math.max(1, leaf) * W;
  const height = (depthMax + 1) * H;
  const px = (id: string) => pos[id].x * W + W / 2;
  const py = (id: string) => pos[id].y * H + 24;
  return (
    <div className="array-scroll">
      <svg className="tree" viewBox={`0 0 ${width} ${height}`} style={{ width: Math.min(width, 760), maxWidth: '100%' }} role="img" aria-label="Aufrufbaum">
        {nodes
          .filter((n) => n.parent)
          .map((n) => (
            <line key={`l${n.id}`} x1={px(n.parent!)} y1={py(n.parent!) + 14} x2={px(n.id)} y2={py(n.id) - 14} className="tree-edge" />
          ))}
        {nodes.map((n) => (
          <g key={n.id} className={`tree-node ${n.state ?? 'waiting'}`} transform={`translate(${px(n.id)}, ${py(n.id)})`}>
            <rect x={-40} y={-14} width={80} height={28} rx={14} />
            <text textAnchor="middle" dy="4.5">
              {n.label}
            </text>
            {n.result !== undefined && (
              <text className="tree-result" textAnchor="middle" dy="30">
                = {n.result}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ---------- Tabellen (SQL) ----------

export function Table({ view, result }: { view: TableView; result?: boolean }) {
  return (
    <div className={`viz-table ${result ? 'is-result' : ''}`}>
      <div className="mem-title">{view.name}</div>
      <table className="data compact">
        <thead>
          <tr>
            {view.columns.map((c, i) => (
              <th key={i} className={view.hiCols?.includes(i) ? 'hi-col' : undefined}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {view.rows.map((row, i) => {
            const group = view.groups?.[i];
            const cls = [view.hi?.includes(i) ? 'hi' : '', view.dim?.includes(i) ? 'dim' : '', group !== undefined ? `group g${group % 5}` : ''].join(' ');
            return (
              <tr key={i} className={cls}>
                {row.map((v, j) => (
                  <td key={j} className={[v === null ? 'null' : typeof v === 'number' ? 'num' : '', view.hiCols?.includes(j) ? 'hi-col' : ''].join(' ')}>
                    {v === null ? 'NULL' : v}
                  </td>
                ))}
              </tr>
            );
          })}
          {view.rows.length === 0 && (
            <tr>
              <td colSpan={view.columns.length} className="null">
                (noch leer)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Ausführungsweg ----------

function Pipeline({ view }: { view: PipelineView }) {
  return (
    <div className="pipeline">
      {view.stages.map((s, i) => (
        <div key={i} className="pipe-item">
          <div className={`pipe-stage ${s.kind ?? 'tool'} ${i === view.active ? 'active' : ''} ${i < view.active ? 'past' : ''}`}>
            <div className="pipe-label">{s.label}</div>
            {s.sub && <div className="pipe-sub">{s.sub}</div>}
          </div>
          {i < view.stages.length - 1 && <div className={`pipe-arrow ${i < view.active ? 'past' : ''}`}>→</div>}
        </div>
      ))}
    </div>
  );
}

// ---------- alles zusammen ----------

export function StepViews({ step, prev }: { step: Step; prev?: Step }) {
  const arrays = step.array ? (Array.isArray(step.array) ? step.array : [step.array]) : [];
  return (
    <>
      {step.pipeline && <Pipeline view={step.pipeline} />}
      {step.term && (
        <pre className="out terminal scene-term">
          {step.term.lines.map((l, i) => (
            <span key={i}>
              {l.cmd !== undefined && (
                <>
                  <span className="prompt-sign">$ </span>
                  <strong>{l.cmd}</strong>
                  {'\n'}
                </>
              )}
              {l.out && `${l.out}\n`}
            </span>
          ))}
        </pre>
      )}
      {step.files && <FileTree paths={step.files.paths} cwd={step.files.cwd} hi={step.files.hi} />}
      {step.areas && <Areas view={step.areas} />}
      {step.git && <GitGraph commits={step.git.commits} hi={step.git.hi} />}
      {step.topo && <Topology view={step.topo} />}
      {step.layers && <Layers view={step.layers} />}
      {step.seq && <Sequence view={step.seq} />}
      {step.tables && (
        <div className="viz-tables">
          {step.tables.map((t) => (
            <Table key={t.name} view={t} />
          ))}
        </div>
      )}
      {step.result && <Table view={step.result} result />}
      {arrays.map((a, i) => (
        <ArrayRow key={i} view={a} />
      ))}
      {step.buckets && <Buckets view={step.buckets} />}
      {step.list && <Linked view={step.list} />}
      {step.tree && <Tree nodes={step.tree} />}
      {(step.frames || step.heap) && <MemoryView step={step} prev={prev} />}
    </>
  );
}
