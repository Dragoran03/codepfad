import type { AreasView } from '../../content/types.ts';

interface Node {
  name: string;
  path: string;
  dir: boolean;
  children: Node[];
}

function build(paths: string[]): Node[] {
  const root: Node = { name: '', path: '', dir: true, children: [] };
  for (const p of paths) {
    const dir = p.endsWith('/');
    const parts = p.replace(/\/$/, '').split('/');
    let cur = root;
    parts.forEach((part, i) => {
      const last = i === parts.length - 1;
      const sub = parts.slice(0, i + 1).join('/') + (last && !dir ? '' : '/');
      let next = cur.children.find((c) => c.name === part);
      if (!next) {
        next = { name: part, path: sub, dir: !last || dir, children: [] };
        cur.children.push(next);
      }
      cur = next;
    });
  }
  return root.children;
}

function Entry({ node, cwd, hi, depth }: { node: Node; cwd?: string; hi: string[]; depth: number }) {
  const here = cwd !== undefined && node.dir && cwd.replace(/\/?$/, '/') === node.path;
  return (
    <>
      <div className={`ft-row ${node.dir ? 'dir' : 'file'} ${hi.includes(node.path) ? 'hi' : ''} ${here ? 'here' : ''}`} style={{ paddingLeft: 8 + depth * 18 }}>
        <span className="ft-icon" aria-hidden="true">
          {node.dir ? '▸' : '·'}
        </span>
        <span className="ft-name">
          {node.name}
          {node.dir ? '/' : ''}
        </span>
        {here && <span className="ft-here">du bist hier</span>}
      </div>
      {node.name !== '.git' && node.children.map((c) => <Entry key={c.path} node={c} cwd={cwd} hi={hi} depth={depth + 1} />)}
    </>
  );
}

/** Verzeichnisbaum. `cwd` ist der aktuelle Ordner relativ zur Wurzel ("" = Wurzel). */
export function FileTree({ paths, cwd, hi = [], label = 'Übungsordner' }: { paths: string[]; cwd?: string; hi?: string[]; label?: string }) {
  const nodes = build(paths);
  const atRoot = cwd === '' || cwd === '.' || cwd === '/';
  return (
    <div className="filetree">
      <div className={`ft-row dir root ${atRoot ? 'here' : ''}`}>
        <span className="ft-icon" aria-hidden="true">
          ▾
        </span>
        <span className="ft-name">{label}/</span>
        {atRoot && <span className="ft-here">du bist hier</span>}
      </div>
      {nodes.length === 0 && <div className="ft-row empty">(leer)</div>}
      {nodes.map((n) => (
        <Entry key={n.path} node={n} cwd={atRoot ? undefined : cwd} hi={hi} depth={1} />
      ))}
    </div>
  );
}

export function Areas({ view }: { view: AreasView }) {
  return (
    <div className="areas">
      {view.areas.map((a, i) => (
        <div key={a.title} className={`area ${view.hi === i ? 'hi' : ''}`}>
          <div className="area-title">{a.title}</div>
          {a.sub && <div className="area-sub">{a.sub}</div>}
          <div className="area-files">
            {a.files.length === 0 && <span className="area-empty">leer</span>}
            {a.files.map((f) => (
              <span key={f.name} className={`area-file ${f.state ?? ''}`}>
                {f.name}
                {f.state && f.state !== 'gleich' && <em>{f.state}</em>}
              </span>
            ))}
          </div>
          {i < view.areas.length - 1 && <span className="area-arrow" aria-hidden="true">→</span>}
        </div>
      ))}
    </div>
  );
}
