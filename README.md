# Codepfad

Interaktive Lernplattform fürs Programmieren – mit fünf Lernpfaden, Schritt-für-Schritt-Animationen und Aufgaben, die mit den echten Compilern auf diesem Rechner geprüft werden.

| Pfad | Inhalt | Sprachen |
|---|---|---|
| Programmieren | 31 Lektionen von „Hallo Welt" bis Nebenläufigkeit, Testen und Debugging | Python, Java, C, C++, Rust |
| Unter der Haube | 10 Lektionen: Lexer, Parser, Optimierung, Maschinencode, Linker, VMs, Prozessor, Betriebssystem | Python, Java, C, C++, Rust |
| Netzwerke | 10 Lektionen: Schichten, Busse, Ethernet, VLANs, IP, Routing, TCP/UDP, Sockets, DNS, HTTP | Python, Java, C, C++, Rust |
| SQL | 10 Lektionen von SELECT bis Transaktionen | SQL (SQLite) |
| Werkzeuge | 8 Lektionen: Terminal, Pipes, Skripte, Regex, Git, CI/CD | Bash |

## Starten

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

Oder als fertiger Build: `npm run build && npm start` (http://127.0.0.1:4317).

Voraussetzungen: Node 26 (für `node:sqlite` und direktes Ausführen von TypeScript) sowie `python3`, `javac`/`java`, `clang`/`clang++` und `rustc` im `PATH`. Die Terminal-Übungen nutzen die Sandbox von macOS (`sandbox-exec`) und sind auf anderen Systemen gesperrt.

## Sicherheit

Der Server führt Code aus, den du im Browser eingibst – mit deinen Benutzerrechten. Er lauscht deshalb nur auf `127.0.0.1` und nimmt nur JSON-Anfragen der eigenen Seite an (geprüft über `Host`, `Origin` und `Sec-Fetch-Site`). Terminal-Übungen laufen zusätzlich in einer Sandbox, die nur im jeweiligen Wegwerf-Ordner schreiben darf und kein Netzwerk hat. Programmier-Übungen laufen ohne Sandbox – schreib dort nichts, was du nicht auch selbst im Terminal ausführen würdest.

## Prüfen

```bash
npm test           # Server: Ausführung, Zeitlimits, SQL, Sandbox, API-Schutz
npm run verify     # alle Inhalte gegen die echten Compiler (~3 Minuten)
npm run verify -- schleifen --lang rust   # nur eine Lektion / eine Sprache
npm run typecheck
```

`npm run verify` stellt sicher, dass jede Musterlösung ihre Tests besteht, jeder Startcode sie verfehlt, jedes Beispiel läuft und jede Animation dieselbe Ausgabe zeigt wie das echte Programm.

## Aufbau

```
content/curriculum.ts          Pfade, Kapitel, Lektionen
content/lessons/<id>/          lesson.mdx (Text) + code.ts (Beispiele, Aufgaben, Animationen)
content/datasets.ts            SQL-Datensätze
server/                        Ausführung (runner, sql, shell) und HTTP-API
src/                           Oberfläche (React), Visualisierungen in src/viz/
scripts/verify-content.ts      Inhaltsprüfung
data/progress.json             dein Fortschritt
```

In `lesson.mdx` stehen diese Bausteine zur Verfügung: `<Code name>`, `<Szene name>`, `<Aufgabe id>`, `<Nur lang>`, `<Merke>`, `<Datensatz dataset>`, `<Uebersetzen name>` sowie die Labore `<BigO>`, `<BitLab>`, `<RaceLab>`, `<RegexLab>`, `<CompilerLab>` und `<SubnetCalc>`.
