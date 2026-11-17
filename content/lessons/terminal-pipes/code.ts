import { raw } from '../../types.ts';
import type { LessonCode, PipelineView, Step } from '../../types.ts';

const STAGES: PipelineView['stages'] = [
  { label: 'grep', sub: 'nur 404-Zeilen', kind: 'tool' },
  { label: 'cut', sub: 'nur die IP', kind: 'tool' },
  { label: 'sort', sub: 'Gleiche nebeneinander', kind: 'tool' },
  { label: 'uniq -c', sub: 'Gleiche zählen', kind: 'tool' },
  { label: 'sort -rn', sub: 'nach Anzahl', kind: 'out' },
];

const lesson: LessonCode = {
  shellSetup: raw`
cat > server.log <<'LOG'
10.0.0.5 GET /index.html 200
10.0.0.7 GET /kontakt 404
10.0.0.5 GET /bild.png 200
10.0.0.9 POST /login 401
10.0.0.7 GET /impressum 404
10.0.0.5 GET /alt.html 404
10.0.0.9 GET /index.html 200
10.0.0.7 GET /kontakt 404
10.0.0.3 GET /index.html 200
10.0.0.7 GET /alt.html 404
10.0.0.3 GET /kontakt 200
10.0.0.5 GET /index.html 200
10.0.0.9 GET /index.html 200
LOG
`,

  snippets: {
    einzeln: {
      bash: raw`
cat server.log | head -3
grep "404" server.log
wc -l server.log
`,
    },
    umleiten: {
      bash: raw`
grep " 404$" server.log > fehler.txt
echo "Ende der Liste" >> fehler.txt
cat fehler.txt
ls nichtda 2> fehlermeldung.txt
cat fehlermeldung.txt
`,
    },
    kette: {
      bash: raw`
grep " 404$" server.log | cut -d" " -f1 | sort | uniq -c | sort -rn
`,
    },
  },

  scenes: {
    kette: {
      title: 'Wer verursacht die meisten 404-Fehler?',
      build: (): Step[] => {
        const outs = [
          '10.0.0.7 GET /kontakt 404\n10.0.0.7 GET /impressum 404\n10.0.0.5 GET /alt.html 404\n10.0.0.7 GET /kontakt 404\n10.0.0.7 GET /alt.html 404',
          '10.0.0.7\n10.0.0.7\n10.0.0.5\n10.0.0.7\n10.0.0.7',
          '10.0.0.5\n10.0.0.7\n10.0.0.7\n10.0.0.7\n10.0.0.7',
          '   1 10.0.0.5\n   4 10.0.0.7',
          '   4 10.0.0.7\n   1 10.0.0.5',
        ];
        const cmds = ['grep " 404$" server.log', '… | cut -d" " -f1', '… | sort', '… | uniq -c', '… | sort -rn'];
        const notes = [
          '`grep` lässt nur Zeilen durch, die auf ` 404` enden (`$` heißt „Zeilenende"). Aus 13 Zeilen werden 5.',
          'Das `|` (Pipe) schickt die Ausgabe direkt als Eingabe in den nächsten Befehl. `cut` zerlegt jede Zeile an Leerzeichen (`-d" "`) und behält nur das erste Feld (`-f1`): die IP-Adresse.',
          '`sort` sortiert. Das wirkt unnötig, ist aber die Voraussetzung für den nächsten Schritt: Gleiche Zeilen stehen jetzt direkt untereinander.',
          '`uniq -c` fasst **aufeinanderfolgende** gleiche Zeilen zusammen und zählt sie. Ohne vorheriges `sort` würde es die getrennten Vorkommen einzeln zählen.',
          '`sort -rn` sortiert numerisch (`-n`) und umgekehrt (`-r`). Fertig: Die 10.0.0.7 verursacht die meisten Fehler. Fünf kleine Werkzeuge, von denen keines diese Frage allein beantworten könnte.',
        ];
        return outs.map((out, i) => ({
          note: notes[i],
          pipeline: { stages: STAGES, active: i },
          term: { lines: [{ cmd: cmds[i], out }] },
        }));
      },
    },
  },

  exercises: [
    {
      kind: 'shell',
      id: 'zaehlen',
      title: 'Fehler zählen',
      prompt: 'Wie viele Anfragen in `server.log` endeten mit dem Status **404**? Schreibe nur die Zahl in die Datei `anzahl.txt`.',
      starter: 'grep " 404$" server.log',
      solution: 'grep " 404$" server.log | wc -l > anzahl.txt',
      check: "tr -d ' ' < anzahl.txt",
      hints: ['`wc -l` zählt Zeilen. Verbinde `grep` und `wc` mit einer Pipe.', 'Die Ausgabe leitest du mit `> anzahl.txt` in die Datei um. (Auch `grep -c` zählt Treffer direkt.)'],
    },
    {
      kind: 'shell',
      id: 'top',
      title: 'Die beliebtesten Seiten',
      prompt:
        'Erzeuge die Datei `top.txt` mit den **drei am häufigsten aufgerufenen Pfaden** (dritte Spalte in `server.log`), jeweils mit ihrer Anzahl davor – so, wie `uniq -c` sie ausgibt, die häufigste zuerst.',
      starter: 'cut -d" " -f3 server.log > top.txt',
      solution: 'cut -d" " -f3 server.log | sort | uniq -c | sort -rn | head -3 > top.txt',
      check: "awk '{print $1, $2}' top.txt",
      hints: ['Das Muster aus der Animation: ausschneiden → sortieren → zählen → nach Anzahl sortieren.', '`head -3` behält nur die ersten drei Zeilen.'],
    },
    {
      kind: 'quiz',
      id: 'umleitung',
      title: 'Einer oder zwei?',
      question: 'Was ist der Unterschied zwischen `befehl > datei` und `befehl >> datei`?',
      options: [
        'Keiner.',
        '`>` überschreibt die Datei, `>>` hängt an ihr Ende an.',
        '`>` schreibt Fehlermeldungen, `>>` normale Ausgabe.',
        '`>>` ist schneller.',
      ],
      correct: 1,
      explain:
        'Ein einfaches `>` legt die Datei neu an bzw. leert sie vorher – ein klassischer Weg, versehentlich Daten zu verlieren. `>>` hängt an. Fehlermeldungen laufen über einen eigenen Kanal (*stderr*), den man mit `2>` umleitet; `2>&1` schickt sie in denselben Kanal wie die normale Ausgabe.',
    },
  ],
};

export default lesson;
