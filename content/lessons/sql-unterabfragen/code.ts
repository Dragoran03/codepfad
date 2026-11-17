import { PRODUKTE } from '../../datasets.ts';
import { colIdx, num, pick, res, tv, val } from '../../sqlviz.ts';
import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  dataset: 'laden',

  snippets: {
    schnitt: {
      sql: raw`
SELECT name, preis  --@outer
FROM produkte  --@outer
WHERE preis > (SELECT AVG(preis) FROM produkte)  --@inner
ORDER BY preis DESC;  --@order
`,
    },
    inliste: {
      sql: raw`
SELECT name
FROM kunden
WHERE id IN (SELECT kunde_id FROM bestellungen WHERE status = 'offen');
`,
    },
    from: {
      sql: raw`
SELECT kategorie, anzahl
FROM (
    SELECT kategorie, COUNT(*) AS anzahl
    FROM produkte
    GROUP BY kategorie
) AS je_kategorie
WHERE anzahl > 1;
`,
    },
  },

  scenes: {
    schnitt: {
      title: 'Erst innen, dann außen',
      code: 'schnitt',
      build: (): Step[] => {
        const preise = PRODUKTE.rows.map((r) => val(PRODUKTE, r, 'preis') as number);
        const avg = preise.reduce((a, b) => a + b, 0) / preise.length;
        const keep = PRODUKTE.rows.map((_, i) => i).filter((i) => preise[i] > avg);
        const out = PRODUKTE.rows.map((_, i) => i).filter((i) => preise[i] <= avg);
        const sorted = [...keep].sort((a, b) => preise[b] - preise[a]);
        return [
          {
            tag: 'inner',
            note: 'Die Klammer ist eine **Unterabfrage** – eine vollständige Abfrage innerhalb einer anderen. Sie wird zuerst ausgewertet: Sie geht alle Preise durch und bildet den Durchschnitt.',
            tables: [tv(PRODUKTE, { hiCols: colIdx(PRODUKTE, ['preis']) })],
          },
          {
            tag: 'inner',
            note: `Ergebnis der Unterabfrage: ein einzelner Wert, ${num(Math.round(avg * 10000) / 10000)}. Eine Unterabfrage, die genau einen Wert liefert, darf überall stehen, wo ein Wert stehen darf.`,
            tables: [tv(PRODUKTE, { hiCols: colIdx(PRODUKTE, ['preis']) })],
            result: res(['AVG(preis)'], [[Math.round(avg * 10000) / 10000]]),
          },
          {
            tag: 'outer',
            note: `Jetzt läuft die äußere Abfrage, als stünde dort \`WHERE preis > ${num(avg)}\`. Nur ${keep.length} Produkte sind teurer als der Durchschnitt.`,
            tables: [tv(PRODUKTE, { hi: keep, dim: out })],
          },
          {
            tag: 'order',
            note: 'Sortiert nach Preis. Der Vorteil gegenüber einer festen Zahl: Ändern sich die Preise, stimmt die Abfrage trotzdem.',
            tables: [tv(PRODUKTE, { hi: keep, dim: out })],
            result: res(['name', 'preis'], pick(PRODUKTE, sorted.map((i) => PRODUKTE.rows[i]), ['name', 'preis'])),
          },
        ];
      },
    },
  },

  exercises: [
    {
      kind: 'sql',
      id: 'ladenhueter',
      title: 'Ladenhüter',
      prompt: 'Zeige die Namen aller Produkte, die **nie** in einer Bestellposition vorkommen. Benutze eine Unterabfrage mit `NOT IN`.',
      starter: 'SELECT name\nFROM produkte;',
      solution: 'SELECT name FROM produkte WHERE id NOT IN (SELECT produkt_id FROM positionen);',
      hints: ['Die Unterabfrage liefert alle `produkt_id`s aus `positionen`.'],
    },
    {
      kind: 'sql',
      id: 'fueller',
      title: 'Wer hat einen Füller gekauft?',
      prompt:
        'Zeige die Namen aller Kunden, die mindestens einmal das Produkt mit der `id` 2 (den Füller) bestellt haben. Benutze verschachtelte Unterabfragen: Welche Bestellungen enthalten Produkt 2? Welchen Kunden gehören diese Bestellungen?',
      starter: 'SELECT name\nFROM kunden\nWHERE id IN (...);',
      solution: 'SELECT name FROM kunden WHERE id IN (SELECT kunde_id FROM bestellungen WHERE id IN (SELECT bestellung_id FROM positionen WHERE produkt_id = 2));',
      hints: [
        'Von innen nach außen: `SELECT bestellung_id FROM positionen WHERE produkt_id = 2` liefert die Bestellungen.',
        'Darum herum: `SELECT kunde_id FROM bestellungen WHERE id IN (…)`. Und ganz außen die Namen.',
      ],
    },
    {
      kind: 'sql',
      id: 'alteingesessen',
      title: 'Länger dabei als der Durchschnitt',
      prompt: 'Zeige Name und Jahr (`seit`) aller Kunden, die **früher** Kunde geworden sind als der Durchschnitt aller Kunden.',
      starter: 'SELECT name, seit\nFROM kunden\nWHERE seit < 2020;',
      solution: 'SELECT name, seit FROM kunden WHERE seit < (SELECT AVG(seit) FROM kunden);',
      hints: ['Ersetze die feste Zahl durch eine Unterabfrage, die den Durchschnitt berechnet.'],
    },
  ],
};

export default lesson;
