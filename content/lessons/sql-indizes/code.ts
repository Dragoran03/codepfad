import { BESTELLUNGEN } from '../../datasets.ts';
import { val } from '../../sqlviz.ts';
import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  dataset: 'laden',

  snippets: {
    plan: {
      sql: raw`
EXPLAIN QUERY PLAN
SELECT * FROM bestellungen WHERE kunde_id = 1;

CREATE INDEX idx_bestellungen_kunde ON bestellungen(kunde_id);

EXPLAIN QUERY PLAN
SELECT * FROM bestellungen WHERE kunde_id = 1;
`,
    },
  },

  scenes: {
    index: {
      title: 'Ohne und mit Index suchen',
      build: (): Step[] => {
        const kunden = BESTELLUNGEN.rows.map((r) => val(BESTELLUNGEN, r, 'kunde_id') as number);
        const ids = BESTELLUNGEN.rows.map((r) => val(BESTELLUNGEN, r, 'id') as number);
        const cells = kunden.map((k, i) => `B${ids[i]}: K${k}`);
        const steps: Step[] = [];
        const treffer = kunden.map((k, i) => (k === 1 ? i : -1)).filter((i) => i >= 0);
        steps.push({
          note: 'Gesucht: alle Bestellungen von Kunde 1. Ohne Index liegen die Zeilen in keiner hilfreichen Ordnung. Die Datenbank muss **jede** Zeile ansehen – ein *Full Table Scan*.',
          array: { label: 'Tabelle bestellungen (B = Bestellung, K = Kunde)', cells, showIndex: false },
        });
        kunden.forEach((k, i) => {
          steps.push({
            note: `Zeile ${i + 1} von ${kunden.length}: Kunde ${k}${k === 1 ? ' – Treffer.' : '.'}`,
            array: { label: 'Tabelle bestellungen (B = Bestellung, K = Kunde)', cells, showIndex: false, hi: [i], done: treffer.filter((t) => t < i) },
          });
        });
        const index = kunden.map((k, i) => ({ k, b: ids[i] })).sort((a, b) => a.k - b.k || a.b - b.b);
        const icells = index.map((e) => `K${e.k} → B${e.b}`);
        const ihit = index.map((e, i) => (e.k === 1 ? i : -1)).filter((i) => i >= 0);
        steps.push({
          note: `${kunden.length} Zeilen gelesen. Bei 7 Zeilen egal, bei 70 Millionen nicht. Ein **Index** ist eine zusätzliche, **sortierte** Liste: jede \`kunde_id\` mit einem Verweis auf ihre Zeile – wie das Stichwortverzeichnis hinten in einem Buch.`,
          array: { label: 'Index auf kunde_id (sortiert)', cells: icells, showIndex: false },
        });
        steps.push({
          note: 'In einer sortierten Liste findet die Datenbank den Anfang der Treffer mit wenigen Sprüngen (wie bei der binären Suche) – in Wirklichkeit in einem B-Baum, der auch bei Milliarden Einträgen nur eine Handvoll Schritte braucht.',
          array: { label: 'Index auf kunde_id (sortiert)', cells: icells, showIndex: false, hi: [ihit[0]], pointers: { suche: ihit[0] } },
        });
        steps.push({
          note: 'Die Treffer stehen direkt nebeneinander. Über die Verweise geht es zu genau den passenden Zeilen. Kein unnötiger Blick auf fremde Bestellungen.',
          array: { label: 'Index auf kunde_id (sortiert)', cells: icells, showIndex: false, done: ihit },
        });
        return steps;
      },
    },
  },

  exercises: [
    {
      kind: 'sql',
      id: 'index',
      title: 'Einen Index anlegen',
      prompt:
        'Im Laden wird ständig nach Produkten einer Kategorie gesucht (`WHERE kategorie = …`). Lege einen Index auf die Spalte `kategorie` der Tabelle `produkte` an. Den Namen darfst du frei wählen.\n\nTipp: Mit `EXPLAIN QUERY PLAN` vor einer Abfrage siehst du, ob die Datenbank deinen Index benutzt.',
      starter: "EXPLAIN QUERY PLAN\nSELECT * FROM produkte WHERE kategorie = 'Papier';",
      solution: 'CREATE INDEX idx_produkte_kategorie ON produkte(kategorie);',
      check: "SELECT COUNT(*) FROM pragma_index_list('produkte') AS il JOIN pragma_index_info(il.name) AS ii WHERE ii.name = 'kategorie'",
      hints: ['`CREATE INDEX name ON tabelle(spalte);`'],
    },
    {
      kind: 'quiz',
      id: 'kosten',
      title: 'Warum nicht überall?',
      question: 'Wenn Indizes Suchen so beschleunigen – warum legt man nicht einfach auf jede Spalte einen an?',
      options: [
        'Weil eine Tabelle höchstens einen Index haben darf.',
        'Weil jeder Index Speicher kostet und bei jedem INSERT, UPDATE und DELETE mitgepflegt werden muss – das verlangsamt das Schreiben.',
        'Weil Indizes die Ergebnisse verfälschen.',
        'Weil Indizes nur mit Zahlen funktionieren.',
      ],
      correct: 1,
      explain:
        'Ein Index ist eine zweite, sortierte Kopie einer Spalte. Jede Änderung an der Tabelle muss auch dort einsortiert werden. Man legt Indizes deshalb gezielt an: auf Spalten, nach denen oft gesucht, verknüpft oder sortiert wird. Primärschlüssel und `UNIQUE`-Spalten bekommen automatisch einen.',
    },
  ],
};

export default lesson;
