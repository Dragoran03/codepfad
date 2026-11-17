import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';

const lesson: LessonCode = {
  shellSetup: raw`
echo "Protokoll vom Montag" > montag.txt
echo "Protokoll vom Dienstag" > dienstag.txt
echo "Ideen" > ideen.txt
echo "# Notizen" > notizen.md
`,

  snippets: {
    grundlagen: {
      bash: raw`
name="Mia"                      # keine Leerzeichen um das =
echo "Hallo $name"

anzahl=$(ls *.txt | wc -l)      # Ausgabe eines Befehls einfangen
echo "Es gibt $anzahl Textdateien"

for datei in *.txt; do
    echo "Gefunden: $datei"
done

if [ -f notizen.md ]; then
    echo "notizen.md existiert"
fi
`,
    },
    exitcode: {
      bash: raw`
grep -q "Montag" montag.txt
echo "Exit-Code von grep: $?"

grep -q "Freitag" montag.txt
echo "Exit-Code von grep: $?"

if grep -q "Ideen" ideen.txt; then
    echo "Treffer – if prüft den Exit-Code"
fi
`,
    },
    skript: {
      bash: raw`
cat > zaehle.sh <<'EOF'
#!/bin/bash
# Zählt die Zeilen aller Dateien mit der Endung, die als Argument kommt.
endung="$1"
for datei in *."$endung"; do
    echo "$datei: $(wc -l < "$datei" | tr -d ' ') Zeile(n)"
done
EOF

chmod +x zaehle.sh
./zaehle.sh txt
`,
    },
  },

  exercises: [
    {
      kind: 'shell',
      id: 'backup',
      title: 'Ein Backup-Skript',
      prompt:
        'Schreibe ein Skript `backup.sh`, das\n1. den Ordner `backup` anlegt (auch wenn er schon existiert, soll kein Fehler entstehen),\n2. alle `.txt`-Dateien hineinkopiert,\n3. ausgibt, wie viele Dateien gesichert wurden – genau im Format `3 Dateien gesichert`.\n\nMache das Skript ausführbar und führe es einmal aus.',
      starter: "cat > backup.sh <<'EOF'\n#!/bin/bash\nmkdir backup\nEOF\n\nchmod +x backup.sh\n./backup.sh",
      solution:
        "cat > backup.sh <<'EOF'\n#!/bin/bash\nmkdir -p backup\ncp *.txt backup/\nanzahl=$(ls backup/*.txt | wc -l | tr -d ' ')\necho \"$anzahl Dateien gesichert\"\nEOF\n\nchmod +x backup.sh\n./backup.sh",
      check: 'ls backup\necho "---"\ntest -x backup.sh && echo "ausführbar"\necho "--- zweiter Lauf:"\n./backup.sh',
      hints: [
        '`mkdir -p` beschwert sich nicht, wenn der Ordner schon existiert.',
        'Die Anzahl bekommst du mit `$(ls backup/*.txt | wc -l)`. Auf dem Mac setzt `wc` Leerzeichen davor; `tr -d \' \'` entfernt sie.',
      ],
    },
    {
      kind: 'shell',
      id: 'argument',
      title: 'Ein Skript mit Argument',
      prompt:
        'Schreibe ein Skript `gruss.sh`. Mit einem Argument gibt es `Hallo, <Argument>!` aus, ohne Argument `Hallo, Welt!`.\n\nBeispiel: `bash gruss.sh Mia` → `Hallo, Mia!`',
      starter: "cat > gruss.sh <<'EOF'\n#!/bin/bash\necho \"Hallo, $1!\"\nEOF",
      solution:
        "cat > gruss.sh <<'EOF'\n#!/bin/bash\nif [ -z \"$1\" ]; then\n    echo \"Hallo, Welt!\"\nelse\n    echo \"Hallo, $1!\"\nfi\nEOF",
      check: 'bash gruss.sh Mia\nbash gruss.sh\nbash gruss.sh "Ada Lovelace"',
      hints: [
        '`$1` ist das erste Argument. `[ -z "$1" ]` ist wahr, wenn es leer ist.',
        'Kurzform ohne if: `echo "Hallo, ${1:-Welt}!"` – `${1:-Welt}` heißt „$1, oder Welt, falls leer".',
      ],
    },
    {
      kind: 'quiz',
      id: 'exit',
      title: 'Erfolg ist null',
      question: 'Ein Befehl endet mit dem Exit-Code `0`. Was bedeutet das?',
      options: ['Er ist fehlgeschlagen.', 'Er war erfolgreich.', 'Er hat keine Ausgabe erzeugt.', 'Er wurde abgebrochen.'],
      correct: 1,
      explain:
        'Unter Unix bedeutet 0 Erfolg, jeder andere Wert einen Fehler – so kann ein Programm mit verschiedenen Zahlen verschiedene Fehler melden. `if`, `&&` und `||` werten genau diesen Code aus: `befehl1 && befehl2` führt den zweiten nur aus, wenn der erste erfolgreich war. In Skripten sorgt `set -e` dafür, dass beim ersten Fehler abgebrochen wird. Darauf baut die Lektion über CI/CD auf.',
    },
  ],
};

export default lesson;
