import { raw } from '../../types.ts';
import type { GitCommitView, LessonCode, Step } from '../../types.ts';

const c = (hash: string, subject: string, parents: string[], refs: string[] = []): GitCommitView => ({ hash, subject, parents, refs });

const lesson: LessonCode = {
  shellSetup: raw`
git init -q
echo "# Shop" > README.md
git add README.md && git commit -q -m "Projekt angelegt"
echo "<h1>Willkommen</h1>" > index.html
git add index.html && git commit -q -m "Startseite"
`,

  snippets: {
    branch: {
      bash: raw`
git switch -c feature
echo "<form>Login</form>" > login.html
git add login.html
git commit -q -m "Login-Formular"

git switch main
echo "<h1>Herzlich willkommen</h1>" > index.html
git commit -q -am "Begrüßung verbessert"

git merge feature -m "Login übernommen"
git log --oneline --graph --all
`,
    },
  },

  scenes: {
    verzweigen: {
      title: 'Verzweigen und zusammenführen',
      build: (): Step[] => {
        const a = c('3e1a9f0', 'Projekt angelegt', []);
        const b = c('91c47d2', 'Startseite', ['3e1a9f0']);
        const f = c('c5d8e13', 'Login-Formular', ['91c47d2']);
        const m = c('48a0b6e', 'Begrüßung verbessert', ['91c47d2']);
        const x = c('e7f2c95', 'Login übernommen', ['48a0b6e', 'c5d8e13']);
        return [
          {
            note: 'Ein Repository mit zwei Commits auf dem Branch `main`. Ein **Branch** ist nichts weiter als ein beweglicher Name, der auf einen Commit zeigt. `HEAD` zeigt auf den Branch, auf dem du gerade arbeitest.',
            git: { commits: [{ ...b, refs: ['HEAD -> main'] }, a] },
          },
          {
            note: '`git switch -c feature` legt einen neuen Branch an und wechselt hinein. Er zeigt zunächst auf denselben Commit wie `main` – Branches kosten praktisch nichts.',
            term: { lines: [{ cmd: 'git switch -c feature', out: "Switched to a new branch 'feature'" }] },
            git: { commits: [{ ...b, refs: ['HEAD -> feature', 'main'] }, a] },
          },
          {
            note: 'Ein Commit auf `feature`. Nur dieser Branch rückt vor; `main` bleibt, wo es war.',
            term: { lines: [{ cmd: 'git commit -m "Login-Formular"' }] },
            git: { commits: [{ ...f, refs: ['HEAD -> feature'] }, { ...b, refs: ['main'] }, a], hi: [f.hash] },
          },
          {
            note: 'Zurück auf `main`. Git stellt die Dateien so her, wie sie dort aussehen – `login.html` verschwindet aus dem Ordner. Keine Sorge: Sie steckt sicher im Commit auf `feature`.',
            term: { lines: [{ cmd: 'git switch main', out: "Switched to branch 'main'" }] },
            git: { commits: [{ ...f, refs: ['feature'] }, { ...b, refs: ['HEAD -> main'] }, a] },
          },
          {
            note: 'Auch auf `main` geht die Arbeit weiter. Jetzt hat sich die Geschichte **verzweigt**: zwei Entwicklungslinien mit gemeinsamem Vorfahren.',
            term: { lines: [{ cmd: 'git commit -am "Begrüßung verbessert"' }] },
            git: { commits: [{ ...m, refs: ['HEAD -> main'] }, { ...f, refs: ['feature'] }, b, a], hi: [m.hash] },
          },
          {
            note: '`git merge feature` führt die Linien zusammen. Weil beide Seiten neue Commits haben, entsteht ein **Merge-Commit** mit zwei Vorgängern. Hätte nur `feature` neue Commits gehabt, hätte Git `main` einfach vorgerückt (*Fast-Forward*).',
            term: { lines: [{ cmd: 'git merge feature', out: "Merge made by the 'ort' strategy.\n login.html | 1 +" }] },
            git: { commits: [{ ...x, refs: ['HEAD -> main'] }, { ...m }, { ...f, refs: ['feature'] }, b, a], hi: [x.hash] },
          },
        ];
      },
    },
  },

  exercises: [
    {
      kind: 'shell',
      id: 'feature',
      title: 'Ein Feature-Branch',
      prompt:
        'Lege einen Branch `login` an und wechsle hinein. Erzeuge dort eine Datei `login.html` (Inhalt beliebig) und committe sie mit der Nachricht `Login hinzugefügt`. Wechsle dann zurück zu `main` und führe `login` dort hinein zusammen.',
      starter: 'git switch -c login\necho "<form></form>" > login.html\ngit add login.html\ngit commit -m "Login hinzugefügt"',
      solution: 'git switch -c login\necho "<form></form>" > login.html\ngit add login.html\ngit commit -m "Login hinzugefügt"\ngit switch main\ngit merge login',
      check: 'echo "aktueller Branch: $(git branch --show-current)"\necho "--- Geschichte von main:"\ngit log --format=%s main\necho "--- Dateien:"\nls',
      hints: ['Am Ende musst du auf `main` stehen. `git switch main` wechselt zurück.', '`git merge login` holt die Commits von `login` nach `main`. Weil `main` sich nicht verändert hat, ist das ein Fast-Forward.'],
    },
    {
      kind: 'shell',
      id: 'konflikt',
      title: 'Einen Konflikt lösen',
      setup: raw`
git init -q
echo "farbe=rot" > config.txt
git add config.txt && git commit -q -m "Konfiguration"
git switch -q -c blau
echo "farbe=blau" > config.txt
git commit -q -am "Blau als Farbe"
git switch -q main
echo "farbe=gruen" > config.txt
git commit -q -am "Grün als Farbe"
`,
      prompt:
        'Auf `main` wurde die Farbe auf grün geändert, auf dem Branch `blau` auf blau – dieselbe Zeile, zwei Meinungen. Führe `blau` nach `main` zusammen. Git wird einen **Konflikt** melden. Entscheide dich für `farbe=blau` und schließe den Merge ab.',
      starter: 'git merge blau',
      solution: 'git merge blau\necho "farbe=blau" > config.txt\ngit add config.txt\ngit commit -m "Blau übernommen"',
      check: 'echo "--- config.txt:"\ncat config.txt\necho "--- Status:"\ngit status --porcelain\necho "--- Vorgänger des letzten Commits:"\ngit log -1 --format=%p | wc -w | tr -d " "',
      hints: [
        'Nach dem Konflikt steht in `config.txt` beides, eingerahmt von `<<<<<<<`, `=======` und `>>>>>>>`. Schreib die Datei so, wie sie am Ende aussehen soll.',
        'Dann `git add config.txt` (heißt hier: „Konflikt gelöst") und `git commit`.',
      ],
    },
    {
      kind: 'quiz',
      id: 'head',
      title: 'Was ist HEAD?',
      question: 'Was bezeichnet `HEAD` in Git?',
      options: [
        'Den ersten Commit des Projekts.',
        'Den Commit (meist über einen Branch), auf dem du gerade arbeitest – dort wird der nächste Commit angehängt.',
        'Den Branch mit den meisten Commits.',
        'Den Server, auf dem das Repository liegt.',
      ],
      correct: 1,
      explain:
        '`HEAD` ist ein Zeiger auf deine aktuelle Position. Normalerweise zeigt er auf einen Branch (`HEAD -> main`), der wiederum auf einen Commit zeigt. Ein neuer Commit rückt diesen Branch vor. Zeigt `HEAD` direkt auf einen Commit statt auf einen Branch, spricht man von einem *detached HEAD* – neue Commits hängen dann an keinem Namen und gehen leicht verloren.',
    },
  ],
};

export default lesson;
