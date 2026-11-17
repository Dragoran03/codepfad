import type { Cell } from '../../datasets.ts';
import { PRODUKTE } from '../../datasets.ts';
import { colIdx, res, tv, val } from '../../sqlviz.ts';
import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  dataset: 'laden',

  snippets: {
    gruppen: {
      sql: raw`
SELECT kategorie,  --@select
       COUNT(*) AS anzahl,  --@select
       MIN(preis) AS billigstes,  --@select
       MAX(preis) AS teuerstes  --@select
FROM produkte  --@from
GROUP BY kategorie  --@group
ORDER BY kategorie;  --@order
`,
    },
    gesamt: {
      sql: raw`
SELECT COUNT(*) AS produkte,
       ROUND(AVG(preis), 2) AS durchschnitt,
       SUM(preis) AS summe
FROM produkte;
`,
    },
    having: {
      sql: raw`
SELECT kategorie, COUNT(*) AS anzahl
FROM produkte
GROUP BY kategorie
HAVING COUNT(*) >= 3;
`,
    },
  },

  scenes: {
    gruppen: {
      title: 'Zeilen in Gruppen zusammenfassen',
      code: 'gruppen',
      build: (): Step[] => {
        const kategorien = [...new Set(PRODUKTE.rows.map((r) => val(PRODUKTE, r, 'kategorie') as string))].sort();
        const groups: Record<number, number> = {};
        PRODUKTE.rows.forEach((r, i) => {
          groups[i] = kategorien.indexOf(val(PRODUKTE, r, 'kategorie') as string);
        });
        const sorted = [...PRODUKTE.rows].sort((a, b) => kategorien.indexOf(val(PRODUKTE, a, 'kategorie') as string) - kategorien.indexOf(val(PRODUKTE, b, 'kategorie') as string));
        const sortedGroups: Record<number, number> = {};
        sorted.forEach((r, i) => {
          sortedGroups[i] = kategorien.indexOf(val(PRODUKTE, r, 'kategorie') as string);
        });
        const rows: Cell[][] = kategorien.map((k) => {
          const preise = PRODUKTE.rows.filter((r) => val(PRODUKTE, r, 'kategorie') === k).map((r) => val(PRODUKTE, r, 'preis') as number);
          return [k, preise.length, Math.min(...preise), Math.max(...preise)];
        });
        return [
          { tag: 'from', note: 'Ausgangspunkt sind alle Produkte.', tables: [tv(PRODUKTE)] },
          {
            tag: 'group',
            note: '**GROUP BY kategorie** sortiert die Zeilen gedanklich in Fächer: eine Gruppe pro Kategorie. Die Farben zeigen, welche Zeile in welche Gruppe fällt.',
            tables: [tv(PRODUKTE, { groups, hiCols: colIdx(PRODUKTE, ['kategorie']) })],
          },
          {
            tag: 'group',
            note: 'Zur Anschauung nebeneinandergelegt: drei Gruppen.',
            tables: [tv({ ...PRODUKTE, rows: sorted }, { groups: sortedGroups, hiCols: colIdx(PRODUKTE, ['kategorie']) })],
          },
          {
            tag: 'select',
            note: 'Jetzt wird **jede Gruppe zu einer einzigen Zeile**. Die **Aggregatfunktionen** fassen dabei die Werte der Gruppe zusammen: `COUNT(*)` zählt die Zeilen, `MIN` und `MAX` finden den kleinsten und größten Preis.',
            tables: [tv({ ...PRODUKTE, rows: sorted }, { groups: sortedGroups, hiCols: colIdx(PRODUKTE, ['kategorie', 'preis']) })],
            result: res(['kategorie', 'anzahl', 'billigstes', 'teuerstes'], rows, { groups: { 0: 0, 1: 1, 2: 2 } }),
          },
          {
            tag: 'order',
            note: 'Aus acht Zeilen wurden drei. Im Ergebnis dürfen nur die Gruppierungsspalte und Aggregate stehen – welchen `name` sollte die Zeile „Papier" auch zeigen, wenn es zwei Papierprodukte gibt?',
            tables: [tv({ ...PRODUKTE, rows: sorted }, { groups: sortedGroups })],
            result: res(['kategorie', 'anzahl', 'billigstes', 'teuerstes'], rows, { groups: { 0: 0, 1: 1, 2: 2 } }),
          },
        ];
      },
    },
  },

  exercises: [
    {
      kind: 'sql',
      id: 'je-stadt',
      title: 'Kunden je Stadt',
      prompt: 'Zeige für jede Stadt, wie viele Kunden dort wohnen. Spalten: `stadt` und die Anzahl.',
      starter: 'SELECT stadt\nFROM kunden;',
      solution: 'SELECT stadt, COUNT(*) FROM kunden GROUP BY stadt;',
      hints: ['Gruppiere nach `stadt` und zähle mit `COUNT(*)`.'],
    },
    {
      kind: 'sql',
      id: 'beliebt',
      title: 'Die meistverkauften Produkte',
      prompt:
        'In `positionen` steht, wie oft ein Produkt (`produkt_id`) in einer Bestellung gekauft wurde (`menge`). Zeige für jedes Produkt die **Gesamtmenge** – aber nur für Produkte, von denen **mindestens 5 Stück** verkauft wurden.',
      starter: 'SELECT produkt_id, SUM(menge)\nFROM positionen\nGROUP BY produkt_id;',
      solution: 'SELECT produkt_id, SUM(menge) FROM positionen GROUP BY produkt_id HAVING SUM(menge) >= 5;',
      hints: [
        'WHERE filtert **Zeilen vor** dem Gruppieren. Eine Bedingung an das Ergebnis einer Gruppe gehört in **HAVING**, nach GROUP BY.',
      ],
    },
    {
      kind: 'quiz',
      id: 'where-having',
      title: 'WHERE oder HAVING?',
      question: 'Du willst die Anzahl der Bestellungen je Kunde, aber nur für Bestellungen, die **nicht storniert** sind. Wo gehört die Bedingung `status <> \'storniert\'` hin?',
      options: ['In WHERE – sie betrifft einzelne Zeilen, bevor gruppiert wird.', 'In HAVING – weil gruppiert wird.', 'In ORDER BY.', 'Das geht nur mit zwei Abfragen.'],
      correct: 0,
      explain:
        'Die Reihenfolge der Ausführung ist: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. WHERE wirft einzelne Zeilen hinaus, bevor sie in Gruppen landen. HAVING wirft ganze Gruppen hinaus, und nur dort darf man Aggregate wie `COUNT(*)` benutzen.',
    },
  ],
};

export default lesson;
