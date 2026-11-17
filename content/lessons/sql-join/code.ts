import type { Cell } from '../../datasets.ts';
import { BESTELLUNGEN, KUNDEN } from '../../datasets.ts';
import { colIdx, res, tv, val } from '../../sqlviz.ts';
import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  dataset: 'laden',

  snippets: {
    join: {
      sql: raw`
SELECT b.id, k.name, b.datum  --@select
FROM bestellungen AS b  --@from
JOIN kunden AS k ON k.id = b.kunde_id  --@join
ORDER BY b.id;  --@order
`,
    },
    left: {
      sql: raw`
SELECT k.name, b.id AS bestellung
FROM kunden AS k
LEFT JOIN bestellungen AS b ON b.kunde_id = k.id
ORDER BY k.name;
`,
    },
    drei: {
      sql: raw`
SELECT b.id, p.name, pos.menge
FROM positionen AS pos
JOIN bestellungen AS b ON b.id = pos.bestellung_id
JOIN produkte AS p ON p.id = pos.produkt_id
WHERE b.id = 6;
`,
    },
  },

  scenes: {
    join: {
      title: 'Zeilen über einen Schlüssel verbinden',
      code: 'join',
      build: (): Step[] => {
        const steps: Step[] = [];
        const result: Cell[][] = [];
        steps.push({
          tag: 'from',
          note: 'Eine Bestellung kennt ihren Kunden nur als Nummer: `kunde_id`. Der Name steht in einer anderen Tabelle. Das ist Absicht – so steht jeder Name genau einmal in der Datenbank.',
          tables: [tv(BESTELLUNGEN, { hiCols: colIdx(BESTELLUNGEN, ['kunde_id']) }), tv(KUNDEN, { hiCols: colIdx(KUNDEN, ['id']) })],
        });
        BESTELLUNGEN.rows.forEach((b, i) => {
          const kid = val(BESTELLUNGEN, b, 'kunde_id');
          const ki = KUNDEN.rows.findIndex((k) => val(KUNDEN, k, 'id') === kid);
          result.push([val(BESTELLUNGEN, b, 'id'), val(KUNDEN, KUNDEN.rows[ki], 'name'), val(BESTELLUNGEN, b, 'datum')]);
          steps.push({
            tag: 'join',
            note:
              i === 0
                ? `**ON k.id = b.kunde_id** ist die Verbindungsregel. Bestellung ${val(BESTELLUNGEN, b, 'id')} hat \`kunde_id\` = ${kid}. In \`kunden\` passt die Zeile mit \`id\` = ${kid}: ${val(KUNDEN, KUNDEN.rows[ki], 'name')}. Beide Zeilen werden zu einer verschmolzen.`
                : `Bestellung ${val(BESTELLUNGEN, b, 'id')} → Kunde ${kid}: ${val(KUNDEN, KUNDEN.rows[ki], 'name')}.${i === 2 ? ' Aylin taucht zum zweiten Mal auf – ein Kunde kann zu vielen Bestellungen passen.' : ''}`,
            tables: [tv(BESTELLUNGEN, { hi: [i], hiCols: colIdx(BESTELLUNGEN, ['kunde_id']) }), tv(KUNDEN, { hi: [ki], hiCols: colIdx(KUNDEN, ['id']) })],
            result: res(['id', 'name', 'datum'], [...result]),
          });
        });
        steps.push({
          tag: 'order',
          note: 'Fertig. Emil (Kunde 5) fehlt im Ergebnis – er hat nie bestellt, also gibt es keine passende Zeile. Genau das ist der **INNER JOIN**: Nur Zeilen mit Partner kommen durch. Wer auch Kunden ohne Bestellung sehen will, braucht einen LEFT JOIN.',
          tables: [tv(BESTELLUNGEN), tv(KUNDEN, { dim: [KUNDEN.rows.findIndex((k) => val(KUNDEN, k, 'id') === 5)] })],
          result: res(['id', 'name', 'datum'], result),
        });
        return steps;
      },
    },
  },

  exercises: [
    {
      kind: 'sql',
      id: 'offene',
      title: 'Offene Bestellungen mit Namen',
      prompt: 'Zeige **Datum** und **Kundenname** aller Bestellungen mit dem Status `offen`.',
      starter: "SELECT datum, kunde_id\nFROM bestellungen\nWHERE status = 'offen';",
      solution: "SELECT b.datum, k.name FROM bestellungen AS b JOIN kunden AS k ON k.id = b.kunde_id WHERE b.status = 'offen';",
      hints: ['Verbinde `bestellungen` mit `kunden` über `kunden.id = bestellungen.kunde_id`.', 'Kurze Aliasnamen (`b`, `k`) machen die Abfrage lesbarer.'],
    },
    {
      kind: 'sql',
      id: 'nie-bestellt',
      title: 'Kunden ohne Bestellung',
      prompt: 'Zeige die Namen aller Kunden, die **noch nie** etwas bestellt haben.',
      starter: 'SELECT k.name\nFROM kunden AS k\nJOIN bestellungen AS b ON b.kunde_id = k.id;',
      solution: 'SELECT k.name FROM kunden AS k LEFT JOIN bestellungen AS b ON b.kunde_id = k.id WHERE b.id IS NULL;',
      hints: [
        'Ein normaler JOIN wirft Kunden ohne Bestellung weg. Ein `LEFT JOIN` behält sie und füllt die Spalten der Bestellung mit NULL.',
        'Dann filterst du genau die Zeilen, bei denen die Bestellung NULL ist.',
      ],
    },
    {
      kind: 'sql',
      id: 'umsatz',
      title: 'Umsatz je Kunde',
      prompt:
        'Berechne für jeden Kunden den Umsatz aus allen **nicht stornierten** Bestellungen: Summe von `menge * preis` über alle Positionen. Zeige Name und Umsatz, den höchsten Umsatz zuerst.\n\nDafür brauchst du vier Tabellen: kunden → bestellungen → positionen → produkte.',
      starter: 'SELECT k.name\nFROM kunden AS k;',
      solution:
        "SELECT k.name, SUM(pos.menge * p.preis) AS umsatz FROM kunden AS k JOIN bestellungen AS b ON b.kunde_id = k.id JOIN positionen AS pos ON pos.bestellung_id = b.id JOIN produkte AS p ON p.id = pos.produkt_id WHERE b.status <> 'storniert' GROUP BY k.id, k.name ORDER BY umsatz DESC;",
      ordered: true,
      hints: [
        'Hänge die JOINs aneinander: `FROM kunden k JOIN bestellungen b ON … JOIN positionen pos ON … JOIN produkte p ON …`.',
        'Danach: stornierte Bestellungen mit WHERE ausschließen, nach Kunde gruppieren, `SUM(pos.menge * p.preis)` bilden und absteigend sortieren.',
      ],
    },
  ],
};

export default lesson;
