import type { Cell } from '../../datasets.ts';
import { PRODUKTE } from '../../datasets.ts';
import { colIdx, res, tv, val } from '../../sqlviz.ts';
import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  dataset: 'laden',

  snippets: {
    aendern: {
      sql: raw`
INSERT INTO produkte (id, name, kategorie, preis)  --@insert
VALUES (9, 'Radiergummi', 'Schreiben', 1.2);  --@insert

UPDATE produkte  --@update
SET preis = preis * 1.1  --@update
WHERE kategorie = 'Taschen';  --@update

DELETE FROM produkte  --@delete
WHERE id = 8;  --@delete

SELECT * FROM produkte ORDER BY id;  --@select
`,
    },
    fk: {
      sql: raw`
-- Kunde 1 hat noch Bestellungen. Die Datenbank verweigert das Löschen,
-- weil sonst Bestellungen auf einen Kunden verweisen würden, den es nicht gibt.
DELETE FROM kunden WHERE id = 1;
`,
    },
  },
  noVerify: ['fk'],

  scenes: {
    aendern: {
      title: 'Einfügen, ändern, löschen',
      code: 'aendern',
      build: (): Step[] => {
        let rows: Cell[][] = PRODUKTE.rows.map((r) => [...r]);
        const t = () => ({ ...PRODUKTE, rows: rows.map((r) => [...r]) });
        const steps: Step[] = [{ tag: 'insert', note: 'Ausgangslage: acht Produkte.', tables: [tv(t())] }];
        rows.push([9, 'Radiergummi', 'Schreiben', 1.2]);
        steps.push({
          tag: 'insert',
          note: '**INSERT** fügt eine neue Zeile ein. In den ersten Klammern stehen die Spalten, nach `VALUES` die Werte in derselben Reihenfolge.',
          tables: [tv(t(), { hi: [rows.length - 1] })],
        });
        const taschen = rows.map((r, i) => (val(PRODUKTE, r, 'kategorie') === 'Taschen' ? i : -1)).filter((i) => i >= 0);
        steps.push({
          tag: 'update',
          note: '**UPDATE** ändert vorhandene Zeilen. Das `WHERE` wählt aus, **welche** – hier alle Taschen.',
          tables: [tv(t(), { hi: taschen, hiCols: colIdx(PRODUKTE, ['preis']) })],
        });
        rows = rows.map((r) => (val(PRODUKTE, r, 'kategorie') === 'Taschen' ? [r[0], r[1], r[2], (r[3] as number) * 1.1] : r));
        steps.push({
          tag: 'update',
          note: '`SET preis = preis * 1.1` rechnet für jede ausgewählte Zeile mit ihrem **eigenen** alten Preis. Beide Taschen sind 10 % teurer.',
          tables: [tv(t(), { hi: taschen, hiCols: colIdx(PRODUKTE, ['preis']) })],
        });
        const lineal = rows.findIndex((r) => val(PRODUKTE, r, 'id') === 8);
        steps.push({ tag: 'delete', note: '**DELETE** entfernt Zeilen – wieder ausgewählt per WHERE.', tables: [tv(t(), { hi: [lineal] })] });
        steps.push({ tag: 'delete', note: 'Das Lineal ist gelöscht. In SQL gibt es kein Rückgängig – außer in einer Transaktion (letzte Lektion).', tables: [tv(t(), { dim: [lineal] })] });
        rows = rows.filter((r) => val(PRODUKTE, r, 'id') !== 8);
        steps.push({
          tag: 'select',
          note: 'Der neue Stand. Ändernde Anweisungen liefern selbst keine Tabelle, deshalb schaut man hinterher mit SELECT nach.',
          tables: [tv(t())],
          result: res(PRODUKTE.columns.map((c) => c.name), rows),
        });
        return steps;
      },
    },
  },

  exercises: [
    {
      kind: 'sql',
      id: 'neue-kundin',
      title: 'Eine neue Kundin',
      prompt: 'Trage eine neue Kundin ein: `id` 7, Name `Greta`, Stadt `Leipzig`, Kundin seit `2024`, keine E-Mail-Adresse.',
      starter: "INSERT INTO kunden (id, name, stadt)\nVALUES (7, 'Greta', 'Leipzig');",
      solution: "INSERT INTO kunden (id, name, stadt, seit, email) VALUES (7, 'Greta', 'Leipzig', 2024, NULL);",
      check: 'SELECT * FROM kunden ORDER BY id',
      ordered: true,
      hints: ['Probier den Startcode aus: Die Spalte `seit` ist `NOT NULL` und muss angegeben werden.', 'Fehlende E-Mail: entweder `NULL` als Wert oder die Spalte ganz weglassen.'],
    },
    {
      kind: 'sql',
      id: 'papier-teurer',
      title: 'Papier wird teurer',
      prompt: 'Erhöhe den Preis aller Produkte der Kategorie `Papier` um **50 Cent**. Alle anderen Preise bleiben gleich.',
      starter: 'UPDATE produkte\nSET preis = preis + 0.5;',
      solution: "UPDATE produkte SET preis = preis + 0.5 WHERE kategorie = 'Papier';",
      check: 'SELECT id, preis FROM produkte ORDER BY id',
      ordered: true,
      hints: ['Ein UPDATE ohne WHERE ändert **alle** Zeilen. Der Startcode tut genau das – schau dir das Ergebnis an.'],
    },
    {
      kind: 'sql',
      id: 'storno',
      title: 'Eine Stornierung aufräumen',
      prompt:
        'Bestellung 4 wurde storniert und soll vollständig verschwinden – mitsamt ihren Positionen. Der Startcode versucht, nur die Bestellung zu löschen, und scheitert. Lies die Fehlermeldung und löse das Problem.',
      starter: 'DELETE FROM bestellungen WHERE id = 4;',
      solution: 'DELETE FROM positionen WHERE bestellung_id = 4;\nDELETE FROM bestellungen WHERE id = 4;',
      check: 'SELECT (SELECT COUNT(*) FROM bestellungen), (SELECT COUNT(*) FROM positionen)',
      hints: [
        '`positionen.bestellung_id` ist ein Fremdschlüssel. Solange noch Positionen auf Bestellung 4 verweisen, darf sie nicht gelöscht werden.',
        'Lösche zuerst die Positionen, dann die Bestellung – zwei Anweisungen, getrennt durch Semikolon.',
      ],
    },
  ],
};

export default lesson;
