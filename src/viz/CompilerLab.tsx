import { useMemo, useState } from 'react';

// Ein Mini-Compiler für Ausdrücke wie `preis = 2 + 3 * (netto - rabatt)`.
// Er zeigt die drei klassischen Phasen: Lexer → Parser → Codeerzeugung.

type TokKind = 'zahl' | 'name' | 'operator' | 'klammer' | 'zuweisung';
interface Tok {
  kind: TokKind;
  text: string;
  pos: number;
}

type Node =
  | { t: 'zahl'; v: number }
  | { t: 'name'; n: string }
  | { t: 'bin'; op: string; l: Node; r: Node }
  | { t: 'neg'; e: Node }
  | { t: 'zuweisung'; n: string; e: Node };

class Fehler extends Error {
  pos: number;
  constructor(msg: string, pos: number) {
    super(msg);
    this.pos = pos;
  }
}

function lex(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9]/.test(c)) {
      const m = src.slice(i).match(/^[0-9]+(\.[0-9]+)?/)!;
      toks.push({ kind: 'zahl', text: m[0], pos: i });
      i += m[0].length;
    } else if (/[A-Za-z_äöüÄÖÜß]/.test(c)) {
      const m = src.slice(i).match(/^[A-Za-z_äöüÄÖÜß][A-Za-z0-9_äöüÄÖÜß]*/)!;
      toks.push({ kind: 'name', text: m[0], pos: i });
      i += m[0].length;
    } else if ('+-*/%'.includes(c)) {
      toks.push({ kind: 'operator', text: c, pos: i });
      i++;
    } else if ('()'.includes(c)) {
      toks.push({ kind: 'klammer', text: c, pos: i });
      i++;
    } else if (c === '=') {
      toks.push({ kind: 'zuweisung', text: c, pos: i });
      i++;
    } else {
      throw new Fehler(`Unbekanntes Zeichen „${c}"`, i);
    }
  }
  return toks;
}

const BINDUNG: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };

function parse(toks: Tok[], len: number): Node {
  let i = 0;
  const peek = () => toks[i];
  const expect = (text: string) => {
    const t = toks[i];
    if (!t || t.text !== text) throw new Fehler(`„${text}" erwartet`, t?.pos ?? len);
    i++;
  };
  const primary = (): Node => {
    const t = toks[i];
    if (!t) throw new Fehler('Ausdruck endet zu früh', len);
    if (t.kind === 'zahl') {
      i++;
      return { t: 'zahl', v: Number(t.text) };
    }
    if (t.kind === 'name') {
      i++;
      return { t: 'name', n: t.text };
    }
    if (t.text === '(') {
      i++;
      const e = expr(0);
      expect(')');
      return e;
    }
    if (t.text === '-') {
      i++;
      return { t: 'neg', e: primary() };
    }
    throw new Fehler(`„${t.text}" passt hier nicht`, t.pos);
  };
  // Präzedenz-Klettern: Operatoren mit stärkerer Bindung werden tiefer in den Baum gehängt.
  const expr = (min: number): Node => {
    let left = primary();
    for (;;) {
      const t = peek();
      if (!t || t.kind !== 'operator' || BINDUNG[t.text] <= min) break;
      i++;
      const right = expr(BINDUNG[t.text]);
      left = { t: 'bin', op: t.text, l: left, r: right };
    }
    return left;
  };
  let root: Node;
  if (toks[0]?.kind === 'name' && toks[1]?.kind === 'zuweisung') {
    i = 2;
    root = { t: 'zuweisung', n: toks[0].text, e: expr(0) };
  } else {
    root = expr(0);
  }
  if (i < toks.length) throw new Fehler(`Unerwartetes „${toks[i].text}"`, toks[i].pos);
  return root;
}

function gen(n: Node, out: string[]): void {
  switch (n.t) {
    case 'zahl':
      out.push(`PUSH   ${n.v}`);
      break;
    case 'name':
      out.push(`LOAD   ${n.n}`);
      break;
    case 'neg':
      gen(n.e, out);
      out.push('NEG');
      break;
    case 'bin':
      gen(n.l, out);
      gen(n.r, out);
      out.push({ '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '%': 'MOD' }[n.op]!);
      break;
    case 'zuweisung':
      gen(n.e, out);
      out.push(`STORE  ${n.n}`);
      break;
  }
}

function run(code: string[], vars: Record<string, number>): { stack: number[]; trace: string[]; vars: Record<string, number> } {
  const stack: number[] = [];
  const trace: string[] = [];
  const v = { ...vars };
  for (const ins of code) {
    const [op, arg] = ins.split(/\s+/);
    if (op === 'PUSH') stack.push(Number(arg));
    else if (op === 'LOAD') {
      if (!(arg in v)) throw new Fehler(`Variable „${arg}" hat keinen Wert`, 0);
      stack.push(v[arg]);
    } else if (op === 'STORE') v[arg] = stack.pop()!;
    else if (op === 'NEG') stack.push(-stack.pop()!);
    else {
      const b = stack.pop()!;
      const a = stack.pop()!;
      stack.push(op === 'ADD' ? a + b : op === 'SUB' ? a - b : op === 'MUL' ? a * b : op === 'DIV' ? a / b : a % b);
    }
    trace.push(`[${stack.map((x) => Math.round(x * 1000) / 1000).join(', ')}]`);
  }
  return { stack, trace, vars: v };
}

interface Drawn {
  id: number;
  label: string;
  kind: string;
  x: number;
  depth: number;
  parent?: number;
}

function layout(root: Node): { nodes: Drawn[]; leaves: number; depth: number } {
  const nodes: Drawn[] = [];
  let leaf = 0;
  let maxDepth = 0;
  let id = 0;
  const walk = (n: Node, depth: number, parent?: number): number => {
    const me = id++;
    maxDepth = Math.max(maxDepth, depth);
    const kids: Node[] = n.t === 'bin' ? [n.l, n.r] : n.t === 'neg' || n.t === 'zuweisung' ? [n.e] : [];
    const label = n.t === 'zahl' ? String(n.v) : n.t === 'name' ? n.n : n.t === 'bin' ? n.op : n.t === 'neg' ? '−' : `${n.n} =`;
    const entry: Drawn = { id: me, label, kind: n.t, x: 0, depth, parent };
    nodes.push(entry);
    if (kids.length === 0) entry.x = leaf++;
    else {
      const xs = kids.map((k) => {
        const kid = walk(k, depth + 1, me);
        return nodes.find((d) => d.id === kid)!.x;
      });
      entry.x = xs.reduce((a, b) => a + b, 0) / xs.length;
    }
    return me;
  };
  walk(root, 0);
  return { nodes, leaves: leaf, depth: maxDepth };
}

function Ast({ root }: { root: Node }) {
  const { nodes, leaves, depth } = layout(root);
  const W = 76;
  const H = 58;
  const width = Math.max(1, leaves) * W;
  const height = (depth + 1) * H;
  const px = (d: Drawn) => d.x * W + W / 2;
  const py = (d: Drawn) => d.depth * H + 22;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return (
    <svg className="ast" viewBox={`0 0 ${width} ${height}`} style={{ width: Math.min(width, 640), maxWidth: '100%' }} role="img" aria-label="Syntaxbaum">
      {nodes
        .filter((n) => n.parent !== undefined)
        .map((n) => {
          const p = byId.get(n.parent!)!;
          return <line key={`e${n.id}`} x1={px(p)} y1={py(p) + 13} x2={px(n)} y2={py(n) - 13} className="tree-edge" />;
        })}
      {nodes.map((n) => {
        const w = Math.min(W - 4, Math.max(52, n.label.length * 8.5 + 16));
        return (
        <g key={n.id} className={`ast-node ${n.kind}`} transform={`translate(${px(n)}, ${py(n)})`}>
          <rect x={-w / 2} y={-14} width={w} height={28} rx={n.kind === 'bin' || n.kind === 'neg' ? 14 : 6} />
          <text textAnchor="middle" dy="4.5">
            {n.label}
          </text>
        </g>
        );
      })}
    </svg>
  );
}

/** `<CompilerLab ansicht="lexer|parser|code" />` */
export function CompilerLab({ ansicht = 'alles' }: { ansicht?: 'lexer' | 'parser' | 'code' | 'alles' }) {
  const [src, setSrc] = useState('preis = 2 + 3 * (netto - rabatt)');
  const [netto, setNetto] = useState(10);
  const [rabatt, setRabatt] = useState(4);

  const res = useMemo(() => {
    try {
      const toks = lex(src);
      if (toks.length === 0) return { toks, error: null };
      const ast = parse(toks, src.length);
      const code: string[] = [];
      gen(ast, code);
      let exec: ReturnType<typeof run> | null = null;
      let execError: string | null = null;
      try {
        exec = run(code, { netto, rabatt });
      } catch (e) {
        execError = (e as Error).message;
      }
      return { toks, ast, code, exec, execError, error: null };
    } catch (e) {
      const f = e as Fehler;
      return { toks: [] as Tok[], error: f.message, pos: f.pos };
    }
  }, [src, netto, rabatt]);

  const show = (part: 'lexer' | 'parser' | 'code') => ansicht === 'alles' || ansicht === part;

  return (
    <figure className="complab">
      <header className="player-head">
        <span className="player-kicker">Zum Ausprobieren</span>
        <span className="player-title">Ein Mini-Compiler</span>
      </header>
      <div className="complab-body">
        <label className="regex-pattern">
          <span>Quelltext</span>
          <input value={src} onChange={(e) => setSrc(e.target.value)} spellCheck={false} aria-label="Ausdruck" />
        </label>
        {res.error && (
          <div className="output-head bad standalone">
            Fehler an Position {('pos' in res ? res.pos : 0) + 1}: {res.error}
          </div>
        )}
        {show('lexer') && (
          <div>
            <div className="mem-title">1 · Lexer: Zeichen werden zu Tokens</div>
            <div className="tokens">
              {res.toks.map((t, i) => (
                <span key={i} className={`token ${t.kind}`}>
                  <span className="token-text">{t.text}</span>
                  <span className="token-kind">{t.kind}</span>
                </span>
              ))}
              {res.toks.length === 0 && !res.error && <span className="area-empty">keine Tokens</span>}
            </div>
          </div>
        )}
        {show('parser') && 'ast' in res && res.ast && (
          <div>
            <div className="mem-title">2 · Parser: Tokens werden zum Syntaxbaum</div>
            <div className="array-scroll">
              <Ast root={res.ast} />
            </div>
          </div>
        )}
        {show('code') && 'code' in res && res.code && (
          <div className="complab-code">
            <div>
              <div className="mem-title">3 · Codeerzeugung: Befehle für eine Stack-Maschine</div>
              <pre className="out terminal">
                {res.code.map((c, i) => (
                  <span key={i}>
                    {c.padEnd(16)}
                    <span className="stack-trace">{res.exec?.trace[i] ?? ''}</span>
                    {'\n'}
                  </span>
                ))}
              </pre>
            </div>
            <div className="complab-vars">
              <div className="mem-title">Werte der Variablen</div>
              <label className="param">
                <span>
                  netto = <strong>{netto}</strong>
                </span>
                <input type="range" min={0} max={20} value={netto} onChange={(e) => setNetto(Number(e.target.value))} />
              </label>
              <label className="param">
                <span>
                  rabatt = <strong>{rabatt}</strong>
                </span>
                <input type="range" min={0} max={20} value={rabatt} onChange={(e) => setRabatt(Number(e.target.value))} />
              </label>
              {res.execError && <p className="hint-line">{res.execError}</p>}
              {res.exec && (
                <p className="complab-result">
                  {Object.entries(res.exec.vars)
                    .filter(([k]) => k !== 'netto' && k !== 'rabatt')
                    .map(([k, v]) => `${k} = ${Math.round(v * 1000) / 1000}`)
                    .join(', ') || `Ergebnis: ${Math.round((res.exec.stack[0] ?? 0) * 1000) / 1000}`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="player-note">
        Ändere den Quelltext: Was passiert mit dem Baum, wenn du die Klammern weglässt? Was meldet der Compiler bei „2 + * 3“?
      </div>
    </figure>
  );
}
