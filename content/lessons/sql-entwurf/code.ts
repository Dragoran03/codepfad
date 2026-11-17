import { raw } from '../../types.ts';
import type { LessonCode, Step, TableView } from '../../types.ts';

const ALT: TableView = {
  name: 'bestellungen (schlecht entworfen)',
  columns: ['id', 'kunde', 'stadt', 'email', 'datum'],
  rows: [
    [1, 'Aylin', 'Berlin', 'aylin@example.org', '2024-01-12'],
    [3, 'Aylin', 'Berlin', 'aylin@example.org', '2024-02-03'],
    [7, 'Aylin', 'Berlin', 'aylin@example.org', '2024-03-09'],
    [5, 'Clara', 'Berlin', 'clara@example.org', '2024-03-01'],
  ],
};

const lesson: LessonCode = {
  dataset: 'leer',

  snippets: {
    anlegen: {
      sql: raw`
CREATE TABLE autoren (
    id      INTEGER PRIMARY KEY,
    name    TEXT NOT NULL UNIQUE
);

CREATE TABLE buecher (
    id        INTEGER PRIMARY KEY,
    titel     TEXT NOT NULL,
    jahr      INTEGER CHECK (jahr > 1400),
    autor_id  INTEGER NOT NULL REFERENCES autoren(id)
);

INSERT INTO autoren (id, name) VALUES (1, 'Ada Lovelace'), (2, 'Alan Turing');
INSERT INTO buecher (id, titel, jahr, autor_id) VALUES
    (1, 'Notes on the Analytical Engine', 1843, 1),
    (2, 'On Computable Numbers', 1936, 2);

SELECT b.titel, a.name FROM buecher AS b JOIN autoren AS a ON a.id = b.autor_id;
`,
    },
  },

  scenes: {
    normalisieren: {
      title: 'Warum man Tabellen aufteilt',
      build: (): Step[] => [
        {
          note: 'Eine einzige Tabelle für alles wirkt bequem. Doch Aylins Stadt und E-Mail stehen hier dreimal.',
          tables: [ALT],
        },
        {
          note: 'Zieht Aylin um, müssen drei Zeilen geändert werden. Vergisst man eine, widerspricht sich die Datenbank: Wo wohnt sie denn nun? Solche Fehler heißen **Änderungsanomalien**.',
          tables: [{ ...ALT, hi: [0, 1, 2], hiCols: [2, 3] }],
        },
        {
          note: 'Die Lösung: Jede Tatsache bekommt genau einen Platz. Kundendaten wandern in eine eigene Tabelle, die Bestellung verweist nur noch per Schlüssel darauf. Dieses Aufteilen heißt **Normalisierung**.',
          tables: [
            { name: 'kunden', columns: ['id', 'name', 'stadt', 'email'], rows: [[1, 'Aylin', 'Berlin', 'aylin@example.org'], [3, 'Clara', 'Berlin', 'clara@example.org']], hi: [0] },
            { name: 'bestellungen', columns: ['id', 'kunde_id', 'datum'], rows: [[1, 1, '2024-01-12'], [3, 1, '2024-02-03'], [7, 1, '2024-03-09'], [5, 3, '2024-03-01']], hiCols: [1] },
          ],
        },
        {
          note: 'Ein Umzug ist jetzt eine Änderung an genau einer Stelle. Und mit einem JOIN lässt sich die alte, breite Ansicht jederzeit wieder herstellen.',
          tables: [
            { name: 'kunden', columns: ['id', 'name', 'stadt', 'email'], rows: [[1, 'Aylin', 'Hamburg', 'aylin@example.org'], [3, 'Clara', 'Berlin', 'clara@example.org']], hi: [0], hiCols: [2] },
            { name: 'bestellungen', columns: ['id', 'kunde_id', 'datum'], rows: [[1, 1, '2024-01-12'], [3, 1, '2024-02-03'], [7, 1, '2024-03-09'], [5, 3, '2024-03-01']] },
          ],
        },
      ],
    },
  },

  exercises: [
    {
      kind: 'sql',
      id: 'kurse',
      title: 'Eine Tabelle entwerfen',
      prompt:
        'Lege eine Tabelle `kurse` an mit diesen Spalten:\n- `id`: ganze Zahl, Primärschlüssel\n- `titel`: Text, Pflichtfeld, jeder Titel nur einmal\n- `plaetze`: ganze Zahl, Pflichtfeld, muss größer als 0 sein\n\nGeprüft wird der Aufbau der Tabelle.',
      starter: 'CREATE TABLE kurse (\n    id INTEGER,\n    titel TEXT\n);',
      solution: 'CREATE TABLE kurse (\n    id INTEGER PRIMARY KEY,\n    titel TEXT NOT NULL UNIQUE,\n    plaetze INTEGER NOT NULL CHECK (plaetze > 0)\n);',
      check:
        "SELECT name, type, \"notnull\", pk FROM pragma_table_info('kurse') UNION ALL SELECT 'unique', '', COUNT(*), 0 FROM pragma_index_list('kurse') WHERE \"unique\" = 1 UNION ALL SELECT 'check', '', (SELECT sql LIKE '%CHECK%plaetze%>%0%' FROM sqlite_master WHERE name = 'kurse'), 0",
      hints: [
        'Hinter jedem Spaltennamen steht der Typ, danach die Regeln: `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `CHECK (bedingung)`.',
        'Die Spaltendefinitionen werden durch Kommas getrennt.',
      ],
    },
    {
      kind: 'quiz',
      id: 'schluessel',
      title: 'Ein guter Primärschlüssel',
      question: 'Warum nimmt man als Primärschlüssel einer Kundentabelle meist eine künstliche Nummer statt zum Beispiel der E-Mail-Adresse?',
      options: [
        'Weil Zahlen schöner aussehen.',
        'Weil sich eine E-Mail-Adresse ändern oder fehlen kann – ein Primärschlüssel aber nie ändern darf, denn andere Tabellen verweisen auf ihn.',
        'Weil Text als Primärschlüssel verboten ist.',
        'Weil E-Mail-Adressen zu kurz sind.',
      ],
      correct: 1,
      explain:
        'Ein Primärschlüssel muss eindeutig, immer vorhanden und **unveränderlich** sein. Natürliche Merkmale wie Namen oder E-Mail-Adressen erfüllen das selten dauerhaft. Eine künstliche Nummer (oder eine UUID) hat keine Bedeutung außerhalb der Datenbank – und kann sich deshalb auch nie ändern müssen.',
    },
  ],
};

export default lesson;
