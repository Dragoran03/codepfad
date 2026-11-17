import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

// Ein "Server" ist hier einfach ein Bare-Repository im Übungsordner – Git behandelt es
// genauso wie ein Repository auf GitHub oder GitLab, nur ohne Netzwerk.
const SERVER = raw`
git init -q --bare server.git
git clone -q server.git vorlage 2>/dev/null
cd vorlage
echo "# Teamprojekt" > README.md
git add README.md
git commit -q -m "Projekt angelegt"
git push -q origin main
cd ..
rm -rf vorlage
`;

const lesson: LessonCode = {
  shellSetup: SERVER,

  snippets: {
    klonen: {
      bash: raw`
git clone server.git projekt
cd projekt
git remote -v
echo "Mia" > TEAM.txt
git add TEAM.txt
git commit -q -m "Team eingetragen"
git push
git log --oneline --all
`,
    },
  },

  scenes: {
    ablauf: {
      title: 'Zwei Rechner, ein Server',
      build: (): Step[] => {
        const area = (dein: string[], server: string[], kollegin: string[], hi?: number): Step['areas'] => ({
          areas: [
            { title: 'Dein Rechner', sub: 'lokales Repository', files: dein.map((name) => ({ name })) },
            { title: 'Server (origin)', sub: 'z. B. GitHub', files: server.map((name) => ({ name })) },
            { title: 'Rechner der Kollegin', sub: 'lokales Repository', files: kollegin.map((name) => ({ name })) },
          ],
          hi,
        });
        const A = 'A: Projekt angelegt';
        const B = 'B: deine Änderung';
        const K = 'K: ihre Änderung';
        const M = 'M: Merge';
        return [
          { note: 'Auf dem Server liegt das gemeinsame Repository. Ein Remote heißt nach dem Klonen standardmäßig `origin`.', areas: area([], [A], []) },
          { note: '`git clone` kopiert das **ganze** Repository mitsamt Geschichte auf deinen Rechner. Deine Kollegin macht dasselbe.', term: { lines: [{ cmd: 'git clone …/server.git projekt' }] }, areas: area([A], [A], [A], 0) },
          { note: 'Ihr arbeitet beide lokal und committet. Das passiert ohne Netzwerk – Commits landen erst einmal nur im eigenen Repository.', areas: area([A, B], [A], [A, K]) },
          { note: 'Die Kollegin ist schneller: `git push` schickt ihren Commit zum Server.', term: { lines: [{ cmd: 'git push   (Kollegin)' }] }, areas: area([A, B], [A, K], [A, K], 1) },
          {
            note: 'Dein `git push` wird **abgelehnt**: Auf dem Server liegt ein Commit, den du nicht hast. Git weigert sich, ihn zu überschreiben – sonst ginge die Arbeit der Kollegin verloren.',
            term: { lines: [{ cmd: 'git push', out: ' ! [rejected]        main -> main (fetch first)' }] },
            areas: area([A, B], [A, K], [A, K], 0),
          },
          {
            note: '`git pull` holt die fremden Commits (`git fetch`) und führt sie mit deinen zusammen (`git merge`). Jetzt hast du beides.',
            term: { lines: [{ cmd: 'git pull', out: "Merge made by the 'ort' strategy." }] },
            areas: area([A, K, B, M], [A, K], [A, K], 0),
          },
          { note: 'Jetzt klappt der Push. Holt sich die Kollegin beim nächsten `git pull` den Stand, sind alle wieder gleich.', term: { lines: [{ cmd: 'git push' }] }, areas: area([A, K, B, M], [A, K, B, M], [A, K], 1) },
        ];
      },
    },
  },

  exercises: [
    {
      kind: 'shell',
      id: 'pushen',
      title: 'Klonen, ändern, hochladen',
      prompt:
        'Klone `server.git` in den Ordner `projekt`. Lege dort eine Datei `TEAM.txt` mit deinem Namen an, committe sie mit der Nachricht `Mich eingetragen` und lade den Commit auf den Server hoch.',
      starter: 'git clone server.git projekt\ncd projekt\necho "Mia" > TEAM.txt\ngit add TEAM.txt\ngit commit -m "Mich eingetragen"',
      solution: 'git clone server.git projekt\ncd projekt\necho "Mia" > TEAM.txt\ngit add TEAM.txt\ngit commit -m "Mich eingetragen"\ngit push',
      check: 'echo "--- Geschichte auf dem Server:"\ngit --git-dir=server.git log --format=%s main',
      hints: ['Ein Commit ist zunächst nur lokal. Erst `git push` schickt ihn zum Server.'],
    },
    {
      kind: 'shell',
      id: 'abgelehnt',
      title: 'Push abgelehnt',
      setup:
        SERVER +
        raw`
git clone -q server.git projekt
git clone -q server.git kollegin
cd kollegin
echo "Installation: siehe unten" > DOKU.md
git add DOKU.md
git commit -q -m "Doku begonnen"
git push -q
cd ../projekt
echo "print('hallo')" > app.py
git add app.py
git commit -q -m "App angelegt"
cd ..
`,
      prompt:
        'In `projekt` liegt dein neuer Commit `App angelegt`, noch nicht hochgeladen. In der Zwischenzeit hat eine Kollegin `Doku begonnen` auf den Server geschoben. Bringe deinen Commit auf den Server – ohne ihre Arbeit zu verlieren.',
      starter: 'cd projekt\ngit push',
      solution: 'cd projekt\ngit pull\ngit push',
      check:
        'echo "--- Commits auf dem Server (ohne Merges):"\ngit --git-dir=server.git log --format=%s --no-merges main | sort\necho "--- Abgleich:"\ncd projekt && git status -sb | head -1',
      hints: ['Probier den Startcode aus und lies die Meldung: Der Server hat Commits, die du nicht hast.', 'Erst `git pull`, dann `git push`.'],
    },
    {
      kind: 'quiz',
      id: 'pr',
      title: 'Der Pull Request',
      question: 'Was ist ein **Pull Request** (bei GitLab: Merge Request)?',
      options: [
        'Ein anderer Name für `git pull`.',
        'Eine Anfrage auf einer Plattform wie GitHub, einen Branch in den Hauptbranch zu übernehmen – mit Raum für Code-Review, Diskussion und automatische Prüfungen.',
        'Ein Befehl, der den Server neu startet.',
        'Ein Fehler, der beim Pushen auftritt.',
      ],
      correct: 1,
      explain:
        'Im Team pusht man meist nicht direkt auf `main`. Man arbeitet auf einem eigenen Branch, pusht ihn und eröffnet einen Pull Request. Kolleginnen lesen die Änderungen, kommentieren, eine CI-Pipeline lässt die Tests laufen – erst dann wird zusammengeführt. Dieser Ablauf ist der Kern moderner Teamarbeit.',
    },
  ],
};

export default lesson;
