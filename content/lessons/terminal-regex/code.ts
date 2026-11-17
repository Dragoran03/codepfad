import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';

const lesson: LessonCode = {
  shellSetup: raw`
cat > kontakte.txt <<'TXT'
Mia Schulz, mia.schulz@example.org, 10115 Berlin, seit 2021-03-14
Ben Koch, ben@example.org, 20095 Hamburg, seit 2019-11-02
Clara Wolf, keine Mail, 80331 München, seit 2023-07-30
Deniz Arslan, deniz.arslan@beispiel.de, 50667 Köln, seit 2020-01-09
Zentrale, info@example.org, Telefon 030 1234567
TXT
`,

  snippets: {
    grep: {
      bash: raw`
grep -E "Berlin|Hamburg" kontakte.txt
echo "---"
grep -Eo "[0-9]{4}-[0-9]{2}-[0-9]{2}" kontakte.txt
echo "---"
grep -Ev "@" kontakte.txt
echo "---"
sed -E "s/([0-9]{4})-([0-9]{2})-([0-9]{2})/\3.\2.\1/" kontakte.txt
`,
    },
  },

  exercises: [
    {
      kind: 'shell',
      id: 'mails',
      title: 'Alle E-Mail-Adressen',
      prompt:
        'Schreibe alle E-Mail-Adressen aus `kontakte.txt` in die Datei `mails.txt` – nur die Adressen, eine pro Zeile, in der Reihenfolge, in der sie vorkommen.',
      starter: 'grep "@" kontakte.txt > mails.txt',
      solution: 'grep -Eo "[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\\.[a-z]+" kontakte.txt > mails.txt',
      check: 'cat mails.txt',
      hints: [
        '`grep -o` gibt nur den passenden Teil aus, nicht die ganze Zeile. `-E` aktiviert die erweiterte Schreibweise mit `+` und `{n}`.',
        'Eine Adresse: Zeichen vor dem `@` (`[A-Za-z0-9._-]+`), das `@`, dann die Domain (`[A-Za-z0-9.-]+`), ein Punkt (`\\.`) und die Endung (`[a-z]+`).',
      ],
    },
    {
      kind: 'shell',
      id: 'plz',
      title: 'Nach Postleitzahl filtern',
      prompt:
        'Schreibe die Namen (erstes Feld vor dem Komma) aller Personen in `nord.txt`, deren Postleitzahl mit **1 oder 2** beginnt. Die Zentrale hat keine Postleitzahl und gehört nicht dazu.',
      starter: 'grep -E "[12]" kontakte.txt | cut -d"," -f1 > nord.txt',
      solution: 'grep -E ", [12][0-9]{4} " kontakte.txt | cut -d"," -f1 > nord.txt',
      check: 'cat nord.txt',
      hints: [
        'Der Startcode findet zu viel: Jede Zeile mit einer 1 oder 2 irgendwo passt, auch in Jahreszahlen.',
        'Mach das Muster genauer: Komma, Leerzeichen, eine 1 oder 2, dann genau vier weitere Ziffern und ein Leerzeichen: `", [12][0-9]{4} "`.',
      ],
    },
    {
      kind: 'quiz',
      id: 'bedeutung',
      title: 'Ein Muster lesen',
      question: 'Welche Zeichenkette passt **vollständig** auf das Muster `^[A-Z][a-z]+-[0-9]{2,3}$`?',
      options: ['`Raum-7`', '`raum-12`', '`Raum-123`', '`Raum-1234`'],
      correct: 2,
      explain:
        '`^` und `$` verankern das Muster an Anfang und Ende. Verlangt sind: ein Großbuchstabe, mindestens ein Kleinbuchstabe, ein Bindestrich und **zwei bis drei** Ziffern. `Raum-7` hat zu wenige Ziffern, `Raum-1234` zu viele, `raum-12` beginnt klein.',
    },
  ],
};

export default lesson;
