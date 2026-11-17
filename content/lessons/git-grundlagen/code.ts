import { raw } from '../../types.ts';
import type { AreasView, GitCommitView, LessonCode, Step } from '../../types.ts';

type F = AreasView['areas'][number]['files'];

const bereiche = (arbeit: F, staging: F, repo: F, hi?: number): AreasView => ({
  areas: [
    { title: 'Arbeitsverzeichnis', sub: 'deine Dateien, wie sie gerade sind', files: arbeit },
    { title: 'Staging-Area', sub: 'vorgemerkt für den nächsten Commit', files: staging },
    { title: 'Repository', sub: 'gespeicherte Versionen', files: repo },
  ],
  hi,
});

const C1: GitCommitView = { hash: 'a1f3c09', parents: [], subject: 'Erster Stand', refs: ['HEAD -> main'] };
const C2: GitCommitView = { hash: '7be2d41', parents: ['a1f3c09'], subject: 'Gruß erweitert', refs: ['HEAD -> main'] };

const lesson: LessonCode = {
  shellSetup: raw`
echo "# Mein Projekt" > README.md
echo 'print("Hallo")' > main.py
echo "privat" > notizen.txt
`,

  snippets: {
    start: {
      bash: raw`
git init
git status
git add README.md main.py
git status --short
git commit -m "Erster Stand"
git log --oneline
`,
    },
    aendern: {
      bash: raw`
git init -q
git add README.md main.py
git commit -q -m "Erster Stand"

echo 'print("Tschüss")' >> main.py
git diff
git add main.py
git commit -q -m "Gruß erweitert"
git log --oneline
`,
    },
  },

  scenes: {
    bereiche: {
      title: 'Die drei Bereiche von Git',
      build: (): Step[] => [
        {
          note: 'Nach `git init` ist der Ordner ein **Repository**. Git kennt die Dateien aber noch nicht – sie sind *untracked*.',
          term: { lines: [{ cmd: 'git init', out: 'Initialized empty Git repository' }] },
          areas: bereiche([{ name: 'README.md', state: 'neu' }, { name: 'main.py', state: 'neu' }, { name: 'notizen.txt', state: 'neu' }], [], [], 0),
          git: { commits: [] },
        },
        {
          note: '`git add` legt Dateien in die **Staging-Area**: eine Vormerkliste für den nächsten Commit. So bestimmst du genau, was hineinkommt – `notizen.txt` bleibt draußen.',
          term: { lines: [{ cmd: 'git add README.md main.py' }] },
          areas: bereiche([{ name: 'notizen.txt', state: 'neu' }], [{ name: 'README.md', state: 'neu' }, { name: 'main.py', state: 'neu' }], [], 1),
          git: { commits: [] },
        },
        {
          note: '`git commit` speichert alles Vorgemerkte als neue **Version** im Repository – mit Nachricht, Autor, Zeitpunkt und einer eindeutigen Kennung (dem Hash).',
          term: { lines: [{ cmd: 'git commit -m "Erster Stand"', out: '[main (root-commit) a1f3c09] Erster Stand\n 2 files changed, 2 insertions(+)' }] },
          areas: bereiche([{ name: 'notizen.txt', state: 'neu' }], [], [{ name: 'README.md', state: 'gleich' }, { name: 'main.py', state: 'gleich' }], 2),
          git: { commits: [C1], hi: ['a1f3c09'] },
        },
        {
          note: 'Du änderst `main.py`. Git bemerkt den Unterschied zur gespeicherten Version – `git status` meldet die Datei als *modified*, `git diff` zeigt die geänderten Zeilen.',
          term: { lines: [{ cmd: 'git status --short', out: ' M main.py\n?? notizen.txt' }] },
          areas: bereiche([{ name: 'main.py', state: 'geändert' }, { name: 'notizen.txt', state: 'neu' }], [], [{ name: 'README.md', state: 'gleich' }, { name: 'main.py', state: 'gleich' }], 0),
          git: { commits: [C1] },
        },
        {
          note: 'Wieder vormerken …',
          term: { lines: [{ cmd: 'git add main.py' }] },
          areas: bereiche([{ name: 'notizen.txt', state: 'neu' }], [{ name: 'main.py', state: 'geändert' }], [{ name: 'README.md', state: 'gleich' }, { name: 'main.py', state: 'gleich' }], 1),
          git: { commits: [C1] },
        },
        {
          note: '… und committen. Der neue Commit zeigt auf seinen Vorgänger: So entsteht eine Kette, in der du jederzeit zu jedem früheren Stand zurückkannst. `main` ist der Name der Kette, `HEAD` markiert, wo du gerade stehst.',
          term: { lines: [{ cmd: 'git commit -m "Gruß erweitert"', out: '[main 7be2d41] Gruß erweitert\n 1 file changed, 1 insertion(+)' }] },
          areas: bereiche([{ name: 'notizen.txt', state: 'neu' }], [], [{ name: 'README.md', state: 'gleich' }, { name: 'main.py', state: 'gleich' }], 2),
          git: { commits: [C2, { ...C1, refs: [] }], hi: ['7be2d41'] },
        },
      ],
    },
  },

  exercises: [
    {
      kind: 'shell',
      id: 'erster-commit',
      title: 'Der erste Commit',
      prompt:
        'Mache den Übungsordner zu einem Git-Repository und committe `README.md` und `main.py` mit der Nachricht `Erster Stand`. Die Datei `notizen.txt` ist privat und soll **nicht** ins Repository.',
      starter: 'git init',
      solution: 'git init\ngit add README.md main.py\ngit commit -m "Erster Stand"',
      check: 'git log --format=%s\necho "--- im Repository:"\ngit ls-files\necho "--- Status:"\ngit status --porcelain',
      hints: ['Drei Befehle: anlegen, vormerken, speichern.', '`git add` mit den beiden Dateinamen, dann `git commit -m "Erster Stand"`.'],
    },
    {
      kind: 'shell',
      id: 'gezielt',
      title: 'Gezielt committen',
      setup: raw`
echo "# Mein Projekt" > README.md
echo 'print("Hallo")' > main.py
git init -q
git add README.md main.py
git commit -q -m "Erster Stand"
echo "privat" > notizen.txt
`,
      prompt:
        'Das Repository hat schon einen Commit. Hänge eine Zeile an `main.py` an (zum Beispiel `print("Tschüss")`) und committe **nur** diese Änderung mit der Nachricht `Gruß erweitert`.',
      starter: 'echo \'print("Tschüss")\' >> main.py\ngit add .\ngit commit -m "Gruß erweitert"',
      solution: 'echo \'print("Tschüss")\' >> main.py\ngit add main.py\ngit commit -m "Gruß erweitert"',
      check: 'git log --format=%s\necho "--- im letzten Commit:"\ngit show --name-only --format= HEAD\necho "--- Status:"\ngit status --porcelain',
      hints: ['`git add .` merkt **alles** im Ordner vor – auch `notizen.txt`. Nenne die Datei ausdrücklich.'],
    },
    {
      kind: 'shell',
      id: 'ignorieren',
      title: 'Dateien ignorieren',
      setup: raw`
echo 'print("Hallo")' > main.py
git init -q
git add main.py
git commit -q -m "Erster Stand"
echo "Fehler um 10:03" > debug.log
echo "Fehler um 10:07" > server.log
mkdir cache
echo "temp" > cache/daten.bin
`,
      prompt:
        'Im Projekt entstehen Logdateien (`*.log`) und ein Ordner `cache/`, die nie ins Repository sollen. Lege eine Datei `.gitignore` an, die beides ausschließt, und committe sie. Danach soll `git status` nichts mehr melden.',
      starter: 'echo "*.log" > .gitignore',
      solution: 'printf "*.log\\ncache/\\n" > .gitignore\ngit add .gitignore\ngit commit -m ".gitignore angelegt"',
      check: 'echo "--- Status:"\ngit status --porcelain\necho "--- im Repository:"\ngit ls-files',
      hints: ['In `.gitignore` steht ein Muster pro Zeile. `*.log` erfasst alle Logdateien, `cache/` den ganzen Ordner.', 'Die `.gitignore` selbst gehört ins Repository – sie muss also committet werden.'],
    },
  ],
};

export default lesson;
