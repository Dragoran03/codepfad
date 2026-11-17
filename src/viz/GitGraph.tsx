import type { GitCommitView } from '../../content/types.ts';

const ROW = 30;
const LANE = 20;
const PAD = 14;

interface Placed {
  c: GitCommitView;
  row: number;
  lane: number;
}

/** Ordnet Commits (neueste zuerst, topologisch sortiert) in Spuren an. */
function layout(commits: GitCommitView[]): { placed: Placed[]; lanes: number } {
  const lanes: (string | null)[] = [];
  const placed: Placed[] = [];
  let maxLanes = 1;
  commits.forEach((c, row) => {
    let lane = lanes.indexOf(c.hash);
    if (lane === -1) {
      lane = lanes.indexOf(null);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(null);
      }
    }
    // Weitere Spuren, die ebenfalls auf diesen Commit gewartet haben, enden hier.
    lanes.forEach((h, i) => {
      if (h === c.hash && i !== lane) lanes[i] = null;
    });
    placed.push({ c, row, lane });
    lanes[lane] = c.parents[0] ?? null;
    for (const p of c.parents.slice(1)) {
      if (lanes.includes(p)) continue;
      const free = lanes.indexOf(null);
      if (free === -1) lanes.push(p);
      else lanes[free] = p;
    }
    while (lanes.length && lanes[lanes.length - 1] === null) lanes.pop();
    maxLanes = Math.max(maxLanes, lanes.length, lane + 1);
  });
  return { placed, lanes: maxLanes };
}

function RefBadge({ r }: { r: string }) {
  if (r.startsWith('HEAD -> ')) {
    return (
      <span className="git-ref head">
        <span className="git-head">HEAD</span>
        {r.slice(8)}
      </span>
    );
  }
  if (r === 'HEAD') return <span className="git-ref head">HEAD</span>;
  if (r.startsWith('tag: ')) return <span className="git-ref tag">{r.slice(5)}</span>;
  if (r.includes('/')) return <span className="git-ref remote">{r}</span>;
  return <span className="git-ref">{r}</span>;
}

export function GitGraph({ commits, hi = [] }: { commits: GitCommitView[]; hi?: string[] }) {
  if (commits.length === 0) {
    return <div className="git-empty">Noch keine Commits.</div>;
  }
  const { placed, lanes } = layout(commits);
  const byHash = new Map(placed.map((p) => [p.c.hash, p]));
  const width = PAD * 2 + Math.max(0, lanes - 1) * LANE;
  const height = commits.length * ROW;
  const x = (lane: number) => PAD + lane * LANE;
  const y = (row: number) => row * ROW + ROW / 2;

  return (
    <div className="git-graph" role="img" aria-label={`Commit-Graph mit ${commits.length} Commits`}>
      <svg width={width} height={height} className="git-svg">
        {placed.flatMap((p) =>
          p.c.parents.map((h, k) => {
            const q = byHash.get(h);
            const x1 = x(p.lane);
            const y1 = y(p.row);
            if (!q) {
              return <line key={`${p.c.hash}-${h}`} x1={x1} y1={y1} x2={x1} y2={height} className="git-edge faint" />;
            }
            const x2 = x(q.lane);
            const y2 = y(q.row);
            const d =
              x1 === x2
                ? `M ${x1} ${y1} L ${x2} ${y2}`
                : k === 0
                  ? `M ${x1} ${y1} C ${x1} ${y1 + ROW * 0.8}, ${x2} ${y1 + ROW * 0.2}, ${x2} ${y1 + ROW} L ${x2} ${y2}`
                  : `M ${x1} ${y1} C ${x1 + (x2 - x1) * 0.2} ${y1 + ROW}, ${x2} ${y2 - ROW}, ${x2} ${y2}`;
            return <path key={`${p.c.hash}-${h}`} d={d} className={`git-edge lane${q.lane % 5}`} />;
          }),
        )}
        {placed.map((p) => (
          <circle
            key={p.c.hash}
            cx={x(p.lane)}
            cy={y(p.row)}
            r={p.c.parents.length > 1 ? 7 : 6}
            className={`git-node lane${p.lane % 5} ${hi.includes(p.c.hash) ? 'hi' : ''} ${p.c.parents.length > 1 ? 'merge' : ''}`}
          />
        ))}
      </svg>
      <div className="git-rows">
        {placed.map((p) => (
          <div key={p.c.hash} className={`git-row ${hi.includes(p.c.hash) ? 'hi' : ''}`} style={{ height: ROW }}>
            <code className="git-hash">{p.c.hash}</code>
            {p.c.refs.map((r) => (
              <RefBadge key={r} r={r} />
            ))}
            <span className="git-subject">{p.c.subject}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
