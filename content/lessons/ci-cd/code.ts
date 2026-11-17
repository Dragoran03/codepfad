import { raw } from '../../types.ts';
import type { LessonCode, PipelineView, Step } from '../../types.ts';

const STAGES: PipelineView['stages'] = [
  { label: 'Push', sub: 'neuer Commit', kind: 'file' },
  { label: 'Prüfen', sub: 'Stil und Syntax', kind: 'tool' },
  { label: 'Testen', sub: 'automatische Tests', kind: 'tool' },
  { label: 'Bauen', sub: 'Paket erzeugen', kind: 'tool' },
  { label: 'Ausliefern', sub: 'auf den Server', kind: 'out' },
];

const lesson: LessonCode = {
  shellSetup: raw`
cat > rechner.py <<'PY'
def addiere(a, b):
    return a + b


def teile(a, b):
    return a / b
PY
cat > test_rechner.py <<'PY'
from rechner import addiere, teile

assert addiere(2, 3) == 5
assert teile(10, 4) == 2.5
print("alle Tests bestanden")
PY
`,

  snippets: {
    seterr: {
      bash: raw`
cat > ohne.sh <<'EOF'
false                     # ein Befehl, der immer fehlschlägt
echo "läuft trotzdem weiter"
EOF

cat > mit.sh <<'EOF'
set -e                    # beim ersten Fehler abbrechen
false
echo "das wird nie ausgegeben"
EOF

bash ohne.sh; echo "Exit-Code: $?"
bash mit.sh;  echo "Exit-Code: $?"
`,
    },
  },
  noVerify: ['seterr'],

  scenes: {
    pipeline: {
      title: 'Eine Pipeline läuft',
      params: [{ name: 'fehler', label: 'Fehler in Schritt (0 = keiner)', min: 0, max: 4, value: 0 }],
      build: (p): Step[] => {
        const steps: Step[] = [
          { note: 'Jemand pusht einen Commit. Der CI-Server bemerkt das und startet die Pipeline – auf einem frischen Rechner, ohne irgendetwas vom Entwickler-Laptop.', pipeline: { stages: STAGES, active: 0 } },
        ];
        const texte = [
          '',
          'Erst die schnellen Prüfungen: Ist der Code syntaktisch korrekt? Hält er sich an die Stilregeln (*Linter*)?',
          'Alle automatischen Tests laufen. Das ist der eigentliche Grund für CI: Kein Fehler kommt unbemerkt in den Hauptbranch.',
          'Aus dem Code wird ein auslieferbares Paket gebaut – genau einmal, damit getestet und ausgeliefert dasselbe ist.',
          'Ist alles grün, wird ausgeliefert. Wenn das automatisch geschieht, spricht man von **Continuous Deployment**.',
        ];
        for (let i = 1; i < STAGES.length; i++) {
          if (p.fehler === i) {
            steps.push({
              note: `**Schritt „${STAGES[i].label}" schlägt fehl.** Die Pipeline bricht sofort ab, die folgenden Schritte laufen gar nicht erst. Der Commit wird rot markiert, und wer ihn gepusht hat, bekommt eine Nachricht. Nichts Kaputtes erreicht die Nutzer.`,
              pipeline: { stages: STAGES.map((s, k) => (k === i ? { ...s, sub: 'fehlgeschlagen', kind: 'out' } : s)), active: i },
            });
            return steps;
          }
          steps.push({ note: texte[i], pipeline: { stages: STAGES, active: i } });
        }
        steps.push({ note: 'Fertig: vom Push bis zur Auslieferung ohne Handarbeit, meist in wenigen Minuten. Stell oben einen Fehler ein, um zu sehen, was dann passiert.', pipeline: { stages: STAGES, active: STAGES.length } });
        return steps;
      },
    },
  },

  exercises: [
    {
      kind: 'shell',
      id: 'pipeline',
      title: 'Eine eigene Mini-Pipeline',
      prompt:
        'Schreibe ein Skript `ci.sh`, das drei Schritte nacheinander ausführt und **beim ersten Fehler abbricht**:\n1. `python3 -m py_compile rechner.py` – danach `Schritt 1: Syntax ok` ausgeben\n2. `python3 test_rechner.py` – danach `Schritt 2: Tests ok`\n3. Ordner `dist` anlegen und `rechner.py` hineinkopieren – danach `Schritt 3: Paket gebaut`\n\nGeprüft wird zweimal: mit dem funktionierenden Projekt und mit einem absichtlich kaputten Test. Im zweiten Fall darf **kein** `dist`-Ordner entstehen, und das Skript muss mit einem Exit-Code ungleich 0 enden.',
      starter:
        "cat > ci.sh <<'EOF'\npython3 -m py_compile rechner.py\necho \"Schritt 1: Syntax ok\"\npython3 test_rechner.py\necho \"Schritt 2: Tests ok\"\nmkdir -p dist\ncp rechner.py dist/\necho \"Schritt 3: Paket gebaut\"\nEOF\nbash ci.sh",
      solution:
        "cat > ci.sh <<'EOF'\nset -e\npython3 -m py_compile rechner.py\necho \"Schritt 1: Syntax ok\"\npython3 test_rechner.py\necho \"Schritt 2: Tests ok\"\nmkdir -p dist\ncp rechner.py dist/\necho \"Schritt 3: Paket gebaut\"\nEOF\nbash ci.sh",
      check:
        'rm -rf dist\nbash ci.sh; echo "exit=$?"; ls dist\necho "--- mit kaputtem Test:"\nrm -rf dist\necho "assert addiere(1, 1) == 3" >> test_rechner.py\nbash ci.sh > /dev/null 2>&1; echo "exit=$?"\nls dist 2>/dev/null || echo "kein dist-Ordner"',
      hints: [
        'Der Startcode macht nach einem fehlgeschlagenen Test einfach weiter und baut trotzdem ein Paket. Genau das darf eine Pipeline nie.',
        'Eine einzige Zeile am Anfang des Skripts genügt: `set -e`.',
      ],
    },
    {
      kind: 'quiz',
      id: 'ci-cd',
      title: 'CI oder CD?',
      question: 'Was unterscheidet **Continuous Integration** von **Continuous Delivery/Deployment**?',
      options: [
        'Nichts, es sind zwei Namen für dasselbe.',
        'CI: Jede Änderung wird sofort automatisch gebaut und getestet. CD: Jede erfolgreich geprüfte Änderung ist jederzeit auslieferbar bzw. wird automatisch ausgeliefert.',
        'CI läuft auf dem Laptop, CD auf dem Server.',
        'CI ist für Java, CD für Python.',
      ],
      correct: 1,
      explain:
        '**Continuous Integration** heißt: Alle führen ihre Arbeit häufig zusammen, und jede Änderung wird automatisch geprüft. **Continuous Delivery** heißt: Was die Pipeline besteht, könnte jederzeit per Knopfdruck ausgeliefert werden. Bei **Continuous Deployment** entfällt auch der Knopfdruck. Große Webdienste liefern so viele Male am Tag aus.',
    },
  ],
};

export default lesson;
