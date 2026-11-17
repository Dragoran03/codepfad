import { PRODUKTE } from '../../datasets.ts';
import { colIdx, pick, range, res, tv, val } from '../../sqlviz.ts';
import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  dataset: 'laden',

  snippets: {
    top3: {
      sql: raw`
SELECT name, preis  --@select
FROM produkte  --@from
ORDER BY preis DESC  --@order
LIMIT 3;  --@limit
`,
    },
    mehrere: {
      sql: raw`
SELECT kategorie, name, preis
FROM produkte
ORDER BY kategorie, preis DESC;
`,
    },
    distinct: {
      sql: raw`
SELECT DISTINCT status
FROM bestellungen;
`,
    },
  },

  scenes: {
    top3: {
      title: 'Die drei teuersten Produkte',
      code: 'top3',
      build: (): Step[] => {
        const sorted = [...PRODUKTE.rows].sort((a, b) => (val(PRODUKTE, b, 'preis') as number) - (val(PRODUKTE, a, 'preis') as number));
        const sortedTable = { ...PRODUKTE, rows: sorted };
        return [
          { tag: 'from', note: 'Ohne ORDER BY ist die Reihenfolge der Zeilen **nicht festgelegt**. Dass sie hier nach `id` sortiert aussehen, ist Zufall der Speicherung – verlassen darf man sich darauf nicht.', tables: [tv(PRODUKTE)] },
          { tag: 'select', note: 'SELECT wählt Name und Preis.', tables: [tv(PRODUKTE, { hiCols: colIdx(PRODUKTE, ['name', 'preis']) })] },
          {
            tag: 'order',
            note: '**ORDER BY preis DESC** sortiert absteigend (*descending*) nach Preis. Ohne `DESC` – oder mit `ASC` – wird aufsteigend sortiert.',
            tables: [tv(sortedTable, { hiCols: colIdx(PRODUKTE, ['preis']) })],
          },
          {
            tag: 'limit',
            note: '**LIMIT 3** schneidet nach drei Zeilen ab. Zusammen mit ORDER BY entsteht so eine Rangliste: „die drei teuersten".',
            tables: [tv(sortedTable, { hi: [0, 1, 2], dim: range(sorted.length).slice(3) })],
            result: res(['name', 'preis'], pick(PRODUKTE, sorted.slice(0, 3), ['name', 'preis'])),
          },
        ];
      },
    },
  },

  exercises: [
    {
      kind: 'sql',
      id: 'neueste',
      title: 'Die neuesten Kunden',
      prompt: 'Zeige Name und Jahr (`seit`) der **zwei Kunden**, die am kürzesten dabei sind – der neueste zuerst.',
      starter: 'SELECT name, seit\nFROM kunden;',
      solution: 'SELECT name, seit FROM kunden ORDER BY seit DESC LIMIT 2;',
      ordered: true,
      hints: ['Sortiere absteigend nach `seit` und begrenze auf zwei Zeilen.'],
    },
    {
      kind: 'sql',
      id: 'staedte',
      title: 'Jede Stadt einmal',
      prompt: 'Zeige jede Stadt, aus der Kunden kommen, **genau einmal** – alphabetisch sortiert.',
      starter: 'SELECT stadt\nFROM kunden;',
      solution: 'SELECT DISTINCT stadt FROM kunden ORDER BY stadt;',
      ordered: true,
      hints: ['`DISTINCT` direkt nach SELECT entfernt doppelte Zeilen aus dem Ergebnis.'],
    },
    {
      kind: 'sql',
      id: 'katalog',
      title: 'Ein geordneter Katalog',
      prompt: 'Zeige Kategorie, Name und Preis aller Produkte – zuerst nach **Kategorie** alphabetisch, innerhalb einer Kategorie vom **günstigsten** zum teuersten.',
      starter: 'SELECT kategorie, name, preis\nFROM produkte\nORDER BY preis;',
      solution: 'SELECT kategorie, name, preis FROM produkte ORDER BY kategorie, preis;',
      ordered: true,
      hints: ['ORDER BY kann mehrere Spalten nehmen, durch Komma getrennt. Die zweite entscheidet nur, wo die erste gleich ist.'],
    },
  ],
};

export default lesson;
