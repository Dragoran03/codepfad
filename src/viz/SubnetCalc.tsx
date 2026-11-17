import { useMemo, useState } from 'react';

function parseIp(s: string): number | null {
  const parts = s.trim().split('.');
  if (parts.length !== 4) return null;
  let v = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    v = v * 256 + n;
  }
  return v;
}

const ip = (v: number) => [24, 16, 8, 0].map((s) => (v >>> s) & 255).join('.');
const bits = (v: number) => (v >>> 0).toString(2).padStart(32, '0');

/** Interaktiver Subnetzrechner: IP-Adresse und Präfixlänge → Netz, Broadcast, Hosts. */
export function SubnetCalc() {
  const [addr, setAddr] = useState('192.168.10.37');
  const [prefix, setPrefix] = useState(24);
  const [other, setOther] = useState('192.168.10.200');

  const r = useMemo(() => {
    const a = parseIp(addr);
    if (a === null) return null;
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const net = (a & mask) >>> 0;
    const bc = (net | (~mask >>> 0)) >>> 0;
    const hosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : 2 ** (32 - prefix) - 2;
    const o = parseIp(other);
    return { a, mask, net, bc, hosts, same: o === null ? null : ((o & mask) >>> 0) === net };
  }, [addr, prefix, other]);

  return (
    <figure className="subnet">
      <header className="player-head">
        <span className="player-kicker">Zum Ausprobieren</span>
        <span className="player-title">Subnetzrechner</span>
      </header>
      <div className="subnet-body">
        <div className="subnet-inputs">
          <label className="regex-pattern">
            <span>IP-Adresse</span>
            <input value={addr} onChange={(e) => setAddr(e.target.value)} spellCheck={false} aria-label="IP-Adresse" />
          </label>
          <label className="param wide">
            <span>
              Präfix /<strong>{prefix}</strong>
            </span>
            <input type="range" min={8} max={30} value={prefix} onChange={(e) => setPrefix(Number(e.target.value))} aria-label="Präfixlänge" />
          </label>
        </div>
        {!r && <div className="output-head bad standalone">Das ist keine gültige IPv4-Adresse (vier Zahlen von 0 bis 255, durch Punkte getrennt).</div>}
        {r && (
          <>
            <div className="subnet-bits" aria-label="Adresse und Maske als Bits">
              {[
                ['Adresse', bits(r.a)],
                ['Maske', bits(r.mask)],
              ].map(([label, b]) => (
                <div key={label} className="bitrow">
                  <span className="bitrow-label">{label}</span>
                  <span className="bitrow-bits">
                    {b.split('').map((ch, i) => (
                      <span key={i} className={`b ${i < prefix ? 'netz' : 'host'} ${i % 8 === 7 && i < 31 ? 'gap' : ''}`}>
                        {ch}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
              <div className="bitrow legend">
                <span className="bitrow-label" />
                <span>
                  <span className="b netz">■</span> {prefix} Bit Netzanteil <span className="b host">■</span> {32 - prefix} Bit Hostanteil
                </span>
              </div>
            </div>
            <dl className="bit-readout subnet-readout">
              <div>
                <dt>Netzmaske</dt>
                <dd>{ip(r.mask)}</dd>
              </div>
              <div>
                <dt>Netzadresse</dt>
                <dd>
                  {ip(r.net)}/{prefix}
                </dd>
              </div>
              <div>
                <dt>Erste / letzte Hostadresse</dt>
                <dd>{prefix >= 31 ? '–' : `${ip(r.net + 1)} – ${ip(r.bc - 1)}`}</dd>
              </div>
              <div>
                <dt>Broadcast</dt>
                <dd>{ip(r.bc)}</dd>
              </div>
              <div>
                <dt>Nutzbare Hosts</dt>
                <dd>{r.hosts.toLocaleString('de-DE')}</dd>
              </div>
            </dl>
            <label className="regex-pattern">
              <span>Zweite Adresse</span>
              <input value={other} onChange={(e) => setOther(e.target.value)} spellCheck={false} aria-label="Zweite IP-Adresse" />
            </label>
            {r.same !== null && (
              <div className={`feedback ${r.same ? 'good' : 'bad'}`}>
                <strong>{r.same ? 'Gleiches Netz' : 'Anderes Netz'}</strong>
                <p>
                  {r.same
                    ? 'Beide Adressen haben denselben Netzanteil. Sie können sich direkt erreichen, ohne Router.'
                    : 'Der Netzanteil unterscheidet sich. Pakete zwischen den beiden müssen über einen Router.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </figure>
  );
}
