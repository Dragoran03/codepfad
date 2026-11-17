import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const BAUM = ['fotos/', 'fotos/urlaub1.jpg', 'fotos/urlaub2.jpg', 'notizen.txt', 'projekt/', 'projekt/README.md', 'projekt/docs/', 'projekt/src/', 'projekt/src/main.py'];

const lesson: LessonCode = {
  shellSetup: raw`
mkdir -p projekt/src projekt/docs fotos
echo 'print("hallo")' > projekt/src/main.py
echo '# Mein Projekt' > projekt/README.md
echo 'Einkaufen: Brot, Kaffee' > notizen.txt
touch fotos/urlaub1.jpg fotos/urlaub2.jpg
`,

  snippets: {
    umsehen: {
      bash: raw`
pwd
ls
ls -l projekt
cd projekt
ls -a
cat README.md
`,
    },
    anlegen: {
      bash: raw`
mkdir entwuerfe
touch entwuerfe/idee.txt
echo "Eine gute Idee" > entwuerfe/idee.txt
cp entwuerfe/idee.txt entwuerfe/idee-kopie.txt
mv entwuerfe/idee-kopie.txt entwuerfe/zweite-idee.txt
ls entwuerfe
rm entwuerfe/zweite-idee.txt
ls entwuerfe
`,
    },
  },

  scenes: {
    navigation: {
      title: 'Durch die Ordner wandern',
      build: (): Step[] => {
        const steps: Step[] = [];
        const lines: { cmd?: string; out?: string }[] = [];
        const step = (cmd: string, out: string | undefined, cwd: string, note: string, hi: string[] = []) => {
          lines.push({ cmd, out });
          steps.push({ note, term: { lines: lines.slice(-4) }, files: { paths: BAUM, cwd, hi } });
        };
        steps.push({ note: 'Das Terminal hat immer einen **aktuellen Ordner** – den Ort, an dem du gerade „stehst". Alle Befehle beziehen sich auf ihn, solange du nichts anderes angibst.', files: { paths: BAUM, cwd: '' } });
        step('pwd', '…/uebung', '', '`pwd` (*print working directory*) zeigt, wo du bist – als vollständigen, **absoluten Pfad** vom obersten Ordner `/` aus.');
        step('ls', 'fotos  notizen.txt  projekt', '', '`ls` (*list*) zeigt den Inhalt des aktuellen Ordners.', ['fotos/', 'notizen.txt', 'projekt/']);
        step('cd projekt', undefined, 'projekt', '`cd` (*change directory*) wechselt den Ordner. `projekt` ist ein **relativer Pfad**: Er gilt ab dem aktuellen Ordner. Das Terminal antwortet nicht – keine Nachricht ist eine gute Nachricht.');
        step('cd src', undefined, 'projekt/src', 'Eine Ebene tiefer.');
        step('cd ..', undefined, 'projekt', '`..` ist immer der **übergeordnete** Ordner. Ein einzelner Punkt `.` steht für den aktuellen.');
        step('cd ../fotos', undefined, 'fotos', 'Pfade lassen sich kombinieren: erst eine Ebene hoch, dann hinein in `fotos`.');
        step('ls', 'urlaub1.jpg  urlaub2.jpg', 'fotos', 'Hier liegen die Fotos.', ['fotos/urlaub1.jpg', 'fotos/urlaub2.jpg']);
        step('cd', undefined, '', 'Ein `cd` ohne Ziel führt in den **Home-Ordner** (abgekürzt `~`). In dieser Übung ist das der Übungsordner, auf deinem Rechner etwa `/Users/name` oder `/home/name`.');
        return steps;
      },
    },
  },

  exercises: [
    {
      kind: 'shell',
      id: 'ordnen',
      title: 'Aufräumen',
      prompt:
        'Lege einen Ordner `archiv` an und **verschiebe** `notizen.txt` hinein. **Kopiere** außerdem `projekt/README.md` nach `archiv/README-kopie.md`. Das Original im Projekt soll erhalten bleiben.',
      starter: 'mkdir archiv',
      solution: 'mkdir archiv\nmv notizen.txt archiv/\ncp projekt/README.md archiv/README-kopie.md',
      check: 'find . | sort\necho "---"\ncat archiv/README-kopie.md',
      hints: ['`mv quelle ziel` verschiebt, `cp quelle ziel` kopiert.', 'Ist das Ziel ein Ordner, landet die Datei darin unter ihrem alten Namen. Sonst bekommt sie den neuen Namen.'],
    },
    {
      kind: 'shell',
      id: 'umbauen',
      title: 'Umbauen',
      prompt: 'Lösche den Ordner `fotos` mitsamt Inhalt. Lege dann im Projekt den Ordner `tests` an und darin eine leere Datei `test_main.py`.',
      starter: 'rm fotos',
      solution: 'rm -r fotos\nmkdir projekt/tests\ntouch projekt/tests/test_main.py',
      check: 'find . | sort',
      hints: ['Probier den Startcode: `rm` weigert sich, einen Ordner zu löschen. Mit `-r` (rekursiv) löscht es Ordner samt Inhalt.', '`touch datei` legt eine leere Datei an.'],
    },
    {
      kind: 'quiz',
      id: 'pfade',
      title: 'Relativ oder absolut?',
      question: 'Du bist im Ordner `/home/mia/projekt/src`. Wohin führt `cd ../../bilder`?',
      options: ['`/home/mia/projekt/bilder`', '`/home/mia/bilder`', '`/bilder`', '`/home/bilder`'],
      correct: 1,
      explain:
        'Jedes `..` geht eine Ebene nach oben: von `src` nach `projekt`, dann nach `mia`. Von dort geht es in `bilder`. Pfade, die mit `/` beginnen, sind absolut und gelten unabhängig vom aktuellen Ordner; alle anderen sind relativ.',
    },
  ],
};

export default lesson;
