import type { Cell } from '../../datasets.ts';
import { KONTEN } from '../../datasets.ts';
import { colIdx, res, tv } from '../../sqlviz.ts';
import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const zeilen = (aylin: number, ben: number, clara: number): Cell[][] => [
  [1, 'Aylin', aylin],
  [2, 'Ben', ben],
  [3, 'Clara', clara],
];
const konten = (aylin: number, ben: number, clara: number, hi: number[] = []) => tv({ ...KONTEN, rows: zeilen(aylin, ben, clara) }, { hi, hiCols: colIdx(KONTEN, ['saldo']) });

const lesson: LessonCode = {
  dataset: 'konten',

  snippets: {
    ueberweisung: {
      sql: raw`
BEGIN;  --@begin
UPDATE konten SET saldo = saldo - 100 WHERE inhaber = 'Ben';  --@ab
UPDATE konten SET saldo = saldo + 100 WHERE inhaber = 'Clara';  --@auf
COMMIT;  --@commit

SELECT * FROM konten;  --@select
`,
    },
    rollback: {
      sql: raw`
BEGIN;
UPDATE konten SET saldo = 0;
SELECT inhaber, saldo FROM konten;  -- alles weg?
ROLLBACK;
SELECT inhaber, saldo FROM konten;  -- alles wieder da
`,
    },
    regel: {
      sql: raw`
-- Ben hat nur 120 Euro. Die CHECK-Regel (saldo >= 0) verhindert das Abheben.
UPDATE konten SET saldo = saldo - 150 WHERE inhaber = 'Ben';
`,
    },
  },
  noVerify: ['regel'],

  scenes: {
    ueberweisung: {
      title: 'Eine Überweisung: alles oder nichts',
      code: 'ueberweisung',
      build: (): Step[] => [
        { tag: 'begin', note: 'Ben überweist Clara 100 Euro. Das sind zwei Änderungen. **BEGIN** startet eine Transaktion: Ab hier gehört alles zusammen.', tables: [konten(500, 120, 80)] },
        { tag: 'ab', note: 'Bens Konto wird belastet. Für andere Nutzer der Datenbank ist diese Änderung noch **unsichtbar**.', tables: [konten(500, 20, 80, [1])] },
        {
          tag: 'auf',
          note: 'Clara bekommt das Geld. Stell dir vor, genau zwischen diesen beiden Zeilen fiele der Strom aus: Ohne Transaktion wären 100 Euro verschwunden. Mit Transaktion würde die halbe Überweisung beim Neustart verworfen.',
          tables: [konten(500, 20, 180, [1, 2])],
        },
        { tag: 'commit', note: '**COMMIT** macht beide Änderungen auf einen Schlag dauerhaft und für alle sichtbar. Es gibt nur zwei mögliche Zustände: vorher oder nachher – nie dazwischen.', tables: [konten(500, 20, 180)] },
        { tag: 'select', note: 'Die Summe aller Konten ist gleich geblieben: 700 Euro.', tables: [konten(500, 20, 180)], result: res(['id', 'inhaber', 'saldo'], zeilen(500, 20, 180)) },
      ],
    },
  },

  exercises: [
    {
      kind: 'sql',
      id: 'ueberweisen',
      title: 'Selbst überweisen',
      prompt: 'Aylin überweist Clara **200 Euro**. Führe die Überweisung als Transaktion aus.',
      starter: "BEGIN;\nUPDATE konten SET saldo = saldo - 200 WHERE inhaber = 'Aylin';\nCOMMIT;",
      solution: "BEGIN;\nUPDATE konten SET saldo = saldo - 200 WHERE inhaber = 'Aylin';\nUPDATE konten SET saldo = saldo + 200 WHERE inhaber = 'Clara';\nCOMMIT;",
      check: 'SELECT inhaber, saldo FROM konten ORDER BY id',
      ordered: true,
      hints: ['Eine Überweisung hat zwei Seiten. Dem Startcode fehlt eine.'],
    },
    {
      kind: 'quiz',
      id: 'acid',
      title: 'ACID',
      question: 'Transaktionen garantieren vier Eigenschaften, abgekürzt ACID. Wofür steht das **A** – und was bedeutet es?',
      options: [
        '**Atomarität**: Eine Transaktion wird ganz oder gar nicht ausgeführt.',
        '**Aktualität**: Daten sind immer auf dem neuesten Stand.',
        '**Automatik**: Die Datenbank startet Transaktionen selbst.',
        '**Anonymität**: Niemand sieht, wer etwas geändert hat.',
      ],
      correct: 0,
      explain:
        'ACID steht für **Atomarität** (alles oder nichts), **Konsistenz** (danach gelten alle Regeln wie CHECK und Fremdschlüssel), **Isolation** (gleichzeitige Transaktionen stören sich nicht) und **Dauerhaftigkeit** (nach COMMIT überlebt die Änderung auch einen Absturz). Diese Garantien sind der Hauptgrund, warum man für wichtige Daten eine Datenbank statt einfacher Dateien benutzt.',
    },
  ],
};

export default lesson;
