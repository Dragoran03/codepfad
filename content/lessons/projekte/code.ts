import type { LessonCode } from '../../types.ts';

const lesson: LessonCode = {
  exercises: [
    {
      kind: 'quiz',
      id: 'semver',
      title: 'Versionsnummern lesen',
      question:
        'Dein Projekt nutzt eine Bibliothek in Version `2.4.1`. Es erscheinen die Versionen `2.4.2`, `2.5.0` und `3.0.0`. Nach den Regeln von **Semantic Versioning** – bei welcher musst du damit rechnen, dass dein Code angepasst werden muss?',
      options: ['2.4.2', '2.5.0', '3.0.0', 'Bei allen dreien gleichermaßen.'],
      correct: 2,
      explain:
        'Semantic Versioning heißt MAJOR.MINOR.PATCH. Eine neue **Patch**-Version behebt nur Fehler, eine neue **Minor**-Version fügt Funktionen hinzu, ohne Bestehendes zu brechen. Erst eine neue **Major**-Version darf inkompatible Änderungen enthalten. Paketmanager nutzen das: `^2.4.1` heißt „jede 2.x.y ab 2.4.1, aber nicht 3.0".',
    },
    {
      kind: 'quiz',
      id: 'lockfile',
      title: 'Wozu die Sperrdatei?',
      question:
        'Viele Projekte enthalten neben der Liste ihrer Abhängigkeiten eine automatisch erzeugte Datei wie `package-lock.json`, `poetry.lock` oder `Cargo.lock`. Wozu dient sie?',
      options: [
        'Sie verhindert, dass andere den Code lesen.',
        'Sie hält die **exakten** Versionen aller direkten und indirekten Abhängigkeiten fest, damit jeder Rechner – auch der CI-Server – genau dieselben benutzt.',
        'Sie sperrt das Projekt gegen Änderungen.',
        'Sie enthält die Passwörter des Projekts.',
      ],
      correct: 1,
      explain:
        'Die Liste der Abhängigkeiten erlaubt meist Versionsbereiche. Ohne Sperrdatei bekäme ein Kollege nächste Woche womöglich eine neuere Version mit einem neuen Fehler – „bei mir funktioniert es aber". Die Sperrdatei macht Builds **reproduzierbar**. Sie gehört bei Anwendungen deshalb mit in die Versionsverwaltung.',
    },
    {
      kind: 'quiz',
      id: 'build',
      title: 'Was macht ein Build-Werkzeug?',
      question: 'Welche Aufgabe übernimmt ein Build-Werkzeug wie Maven, Gradle, CMake oder Cargo **nicht**?',
      options: [
        'Abhängigkeiten herunterladen.',
        'Den Code in der richtigen Reihenfolge kompilieren.',
        'Tests ausführen.',
        'Die Programmlogik schreiben.',
      ],
      correct: 3,
      explain:
        'Build-Werkzeuge automatisieren alles **rund um** den Code: Abhängigkeiten auflösen, nur geänderte Dateien neu übersetzen, Tests starten, ein auslieferbares Paket bauen. Weil diese Schritte mit einem einzigen Befehl ablaufen, kann sie auch ein Server ausführen – die Grundlage für CI/CD im Werkzeug-Pfad.',
    },
  ],
};

export default lesson;
