import { KUNDEN } from '../../datasets.ts';
import { colIdx, pick, res, tv } from '../../sqlviz.ts';
import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  dataset: 'laden',

  snippets: {
    auswahl: {
      sql: raw`
SELECT name, stadt  --@select
FROM kunden;  --@from
`,
    },
    alles: {
      sql: raw`
SELECT * FROM produkte;
`,
    },
    rechnen: {
      sql: raw`
SELECT name, preis, preis * 1.19 AS brutto
FROM produkte;
`,
    },
  },

  scenes: {
    auswahl: {
      title: 'Was SELECT mit einer Tabelle macht',
      code: 'auswahl',
      build: (): Step[] => [
        {
          tag: 'from',
          note: 'Gelesen wird von oben nach unten, ausgeführt aber nicht: Zuerst kommt **FROM**. Die Datenbank holt sich die Tabelle `kunden` – sechs Zeilen, fünf Spalten.',
          tables: [tv(KUNDEN)],
        },
        {
          tag: 'select',
          note: 'Dann wählt **SELECT** die gewünschten Spalten aus. Alle Zeilen bleiben, nur die Spalten `name` und `stadt` kommen ins Ergebnis.',
          tables: [tv(KUNDEN, { hiCols: colIdx(KUNDEN, ['name', 'stadt']) })],
        },
        {
          tag: 'select',
          note: 'Das Ergebnis ist selbst wieder eine Tabelle – mit eigenen Spalten und Zeilen. Diese Eigenschaft macht SQL so mächtig: Man kann Ergebnisse weiterverarbeiten, als wären sie Tabellen.',
          tables: [tv(KUNDEN, { hiCols: colIdx(KUNDEN, ['name', 'stadt']) })],
          result: res(['name', 'stadt'], pick(KUNDEN, KUNDEN.rows, ['name', 'stadt'])),
        },
      ],
    },
  },

  exercises: [
    {
      kind: 'sql',
      id: 'produkte',
      title: 'Name und Preis',
      prompt: 'Zeige von allen Produkten den **Namen** und den **Preis**.',
      starter: 'SELECT name\nFROM produkte;',
      solution: 'SELECT name, preis FROM produkte;',
      hints: ['Mehrere Spalten werden nach SELECT durch Kommas getrennt.'],
    },
    {
      kind: 'sql',
      id: 'brutto',
      title: 'Ein berechnetes Feld',
      prompt:
        'Die Preise in `produkte` sind Nettopreise. Zeige für jedes Produkt den Namen und den Preis **mit 19 % Mehrwertsteuer** (also `preis * 1.19`). Gib der berechneten Spalte den Namen `brutto`.',
      starter: 'SELECT name, preis\nFROM produkte;',
      solution: 'SELECT name, preis * 1.19 AS brutto FROM produkte;',
      hints: ['Nach SELECT dürfen auch Rechenausdrücke stehen.', 'Mit `AS` gibst du einer Spalte im Ergebnis einen Namen: `ausdruck AS brutto`.'],
    },
    {
      kind: 'quiz',
      id: 'stern',
      title: 'Der Stern',
      question: 'Was liefert `SELECT * FROM kunden;`?',
      options: ['Nur die erste Spalte.', 'Alle Spalten aller Zeilen.', 'Die Anzahl der Zeilen.', 'Einen Fehler – `*` ist Multiplikation.'],
      correct: 1,
      explain:
        'Der Stern steht für „alle Spalten". Zum Erkunden einer Tabelle ist das praktisch. In Programmen nennt man die Spalten besser ausdrücklich: Dann ist klar, was gebraucht wird, und eine später hinzugefügte Spalte ändert das Ergebnis nicht unbemerkt.',
    },
  ],
};

export default lesson;
