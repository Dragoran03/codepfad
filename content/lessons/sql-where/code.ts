import { PRODUKTE } from '../../datasets.ts';
import { colIdx, num, pick, range, res, tv, val } from '../../sqlviz.ts';
import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  dataset: 'laden',

  snippets: {
    filter: {
      sql: raw`
SELECT name, preis  --@select
FROM produkte  --@from
WHERE preis < 10;  --@where
`,
    },
    kombiniert: {
      sql: raw`
SELECT name, kategorie, preis
FROM produkte
WHERE kategorie = 'Schreiben'
  AND preis BETWEEN 1 AND 10;
`,
    },
    muster: {
      sql: raw`
SELECT name, stadt
FROM kunden
WHERE stadt IN ('Berlin', 'Köln')
   OR name LIKE 'F%';
`,
    },
  },

  scenes: {
    filter: {
      title: 'WHERE prüft Zeile für Zeile',
      code: 'filter',
      build: (): Step[] => {
        const steps: Step[] = [];
        const keep: number[] = [];
        const out: number[] = [];
        steps.push({ tag: 'from', note: 'FROM holt die Tabelle `produkte`.', tables: [tv(PRODUKTE)] });
        PRODUKTE.rows.forEach((row, i) => {
          const preis = val(PRODUKTE, row, 'preis') as number;
          const ok = preis < 10;
          (ok ? keep : out).push(i);
          steps.push({
            tag: 'where',
            note: `WHERE prüft die Bedingung für jede Zeile einzeln. ${val(PRODUKTE, row, 'name')}: Ist ${num(preis)} < 10? ${ok ? '**Ja** – die Zeile bleibt.' : 'Nein – die Zeile fällt weg.'}`,
            tables: [tv(PRODUKTE, { hi: [i], dim: [...out], hiCols: colIdx(PRODUKTE, ['preis']) })],
          });
        });
        steps.push({
          tag: 'select',
          note: `Von ${PRODUKTE.rows.length} Zeilen haben ${keep.length} die Bedingung erfüllt. Erst jetzt wählt SELECT die Spalten aus. Die Reihenfolge der Ausführung ist also: FROM → WHERE → SELECT.`,
          tables: [tv(PRODUKTE, { dim: out, hiCols: colIdx(PRODUKTE, ['name', 'preis']) })],
          result: res(['name', 'preis'], pick(PRODUKTE, keep.map((i) => PRODUKTE.rows[i]), ['name', 'preis'])),
        });
        return steps;
      },
    },
  },

  exercises: [
    {
      kind: 'sql',
      id: 'guenstig',
      title: 'Günstiges zum Schreiben',
      prompt: 'Zeige Name und Preis aller Produkte der Kategorie `Schreiben`, die **weniger als 5 Euro** kosten.',
      starter: "SELECT name, preis\nFROM produkte\nWHERE kategorie = 'Schreiben';",
      solution: "SELECT name, preis FROM produkte WHERE kategorie = 'Schreiben' AND preis < 5;",
      hints: ['Zwei Bedingungen, die beide gelten müssen, verbindest du mit `AND`.', 'Text steht in einfachen Anführungszeichen: `\'Schreiben\'`.'],
    },
    {
      kind: 'sql',
      id: 'stammkunden',
      title: 'Alte Stammkunden',
      prompt: 'Zeige die Namen aller Kunden aus **Berlin oder Hamburg**, die **vor 2021** Kunde geworden sind (Spalte `seit`).',
      starter: 'SELECT name\nFROM kunden\nWHERE seit < 2021;',
      solution: "SELECT name FROM kunden WHERE stadt IN ('Berlin', 'Hamburg') AND seit < 2021;",
      hints: [
        'Mit `stadt IN (\'Berlin\', \'Hamburg\')` prüfst du mehrere Werte auf einmal.',
        'Wenn du `OR` benutzt, brauchst du Klammern: `(stadt = \'Berlin\' OR stadt = \'Hamburg\') AND seit < 2021`. AND bindet sonst stärker.',
      ],
    },
    {
      kind: 'sql',
      id: 'ohne-email',
      title: 'Wer hat keine E-Mail?',
      prompt: 'Bei manchen Kunden ist keine E-Mail-Adresse hinterlegt – die Spalte enthält dort `NULL`. Zeige die Namen dieser Kunden.',
      starter: 'SELECT name\nFROM kunden\nWHERE email = NULL;',
      solution: 'SELECT name FROM kunden WHERE email IS NULL;',
      hints: ['Probier den Startcode aus: Er liefert gar nichts. Warum? Lies den Abschnitt über NULL noch einmal.', 'Auf „fehlt" prüft man mit `IS NULL`.'],
    },
  ],
};

export default lesson;
