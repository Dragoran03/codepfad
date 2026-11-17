import { raw } from '../../types.ts';
import type { Lang, LessonCode, PipelineView, Step } from '../../types.ts';

type Stage = PipelineView['stages'][number];

const WEGE: Partial<Record<Lang, { stages: Stage[]; notes: string[] }>> = {
  python: {
    stages: [
      { label: 'Quelltext', sub: 'main.py', kind: 'file' },
      { label: 'Tokenizer', sub: 'Zeichen → Tokens', kind: 'tool' },
      { label: 'Parser', sub: 'Tokens → Syntaxbaum', kind: 'tool' },
      { label: 'Compiler', sub: 'Baum → Bytecode', kind: 'tool' },
      { label: 'Python-VM', sub: 'führt Bytecode aus', kind: 'run' },
    ],
    notes: [
      'Auch Python wird übersetzt – nur unsichtbar, direkt vor dem Ausführen.',
      'Der **Tokenizer** (Lexer) zerlegt den Text in Wörter: Namen, Zahlen, Operatoren, Einrückungen.',
      'Der **Parser** erkennt die Struktur und baut einen **Syntaxbaum**. Ein Syntaxfehler fällt hier auf – noch bevor eine einzige Zeile läuft.',
      'Der Compiler macht aus dem Baum **Bytecode**: einfache Befehle für eine gedachte Maschine. Python speichert ihn in `__pycache__`, damit der nächste Start schneller geht.',
      'Die **virtuelle Maschine** von Python liest Bytecode-Befehl für Bytecode-Befehl und führt ihn aus. Typen prüft erst sie – deshalb fallen Typfehler in Python erst zur Laufzeit auf.',
    ],
  },
  java: {
    stages: [
      { label: 'Quelltext', sub: 'Main.java', kind: 'file' },
      { label: 'javac', sub: 'Lexer, Parser, Typprüfung', kind: 'tool' },
      { label: 'Bytecode', sub: 'Main.class', kind: 'file' },
      { label: 'JVM', sub: 'interpretiert erst …', kind: 'run' },
      { label: 'JIT-Compiler', sub: '… dann Maschinencode', kind: 'out' },
    ],
    notes: [
      'Java übersetzt in zwei Etappen.',
      '`javac` zerlegt den Text, baut den Syntaxbaum und prüft **alle Typen**. Die meisten Fehler fallen hier auf.',
      'Heraus kommt **Bytecode** für die Java Virtual Machine – auf jedem Betriebssystem derselbe.',
      'Die JVM führt den Bytecode zunächst langsam aus und **beobachtet dabei**, welche Methoden oft laufen.',
      'Häufig benutzte Stellen übersetzt der **JIT-Compiler** („just in time") während des Laufs in optimierten Maschinencode – mit Wissen, das ein Compiler vorab nicht hätte. Deshalb werden Java-Programme nach dem Start schneller.',
    ],
  },
  c: {
    stages: [
      { label: 'Quelltext', sub: 'main.c', kind: 'file' },
      { label: 'Front-End', sub: 'Lexer, Parser, Typen', kind: 'tool' },
      { label: 'LLVM-IR', sub: 'Zwischencode', kind: 'file' },
      { label: 'Optimierer', sub: 'Dutzende Durchläufe', kind: 'tool' },
      { label: 'Back-End', sub: 'Maschinencode', kind: 'tool' },
      { label: 'Linker', sub: 'ausführbare Datei', kind: 'out' },
    ],
    notes: [
      'clang übersetzt C in mehreren Stufen.',
      'Das **Front-End** kennt die Sprache C: Es zerlegt den Text, baut den Syntaxbaum und prüft Namen und Typen. Vorher läuft der **Präprozessor**, der `#include`-Dateien einfügt.',
      'Heraus kommt **Zwischencode** (LLVM-IR): eine maschinennahe, aber noch prozessorunabhängige Sprache.',
      'Der **Optimierer** formt den Zwischencode in vielen Durchläufen um: Konstanten ausrechnen, toten Code streichen, Funktionen einbetten, Schleifen umbauen.',
      'Das **Back-End** kennt den Prozessor (hier ARM64 oder x86-64): Es wählt Befehle aus und verteilt Werte auf Register.',
      'Der **Linker** fügt die übersetzten Teile und Bibliotheken zu einer ausführbaren Datei zusammen.',
    ],
  },
  cpp: {
    stages: [
      { label: 'Quelltext', sub: 'main.cpp', kind: 'file' },
      { label: 'Front-End', sub: 'Templates, Typen', kind: 'tool' },
      { label: 'LLVM-IR', sub: 'Zwischencode', kind: 'file' },
      { label: 'Optimierer', sub: 'Dutzende Durchläufe', kind: 'tool' },
      { label: 'Back-End', sub: 'Maschinencode', kind: 'tool' },
      { label: 'Linker', sub: 'ausführbare Datei', kind: 'out' },
    ],
    notes: [
      'clang++ übersetzt C++ in mehreren Stufen.',
      'Das **Front-End** ist bei C++ besonders aufwendig: Es muss Templates für jeden benutzten Typ ausprägen, Überladungen auflösen und Typen ableiten. Das ist der Hauptgrund für lange C++-Kompilierzeiten.',
      'Heraus kommt **Zwischencode** (LLVM-IR) – derselbe wie bei C, Rust und Swift. Ab hier ist es egal, aus welcher Sprache er stammt.',
      'Der **Optimierer** entfernt die Abstraktionen: Kleine Funktionen und Templates werden eingebettet, bis oft nur noch wenige Maschinenbefehle übrig bleiben (*zero-cost abstractions*).',
      'Das **Back-End** erzeugt Maschinencode für den Zielprozessor.',
      'Der **Linker** fügt Objektdateien und Bibliotheken zusammen.',
    ],
  },
  rust: {
    stages: [
      { label: 'Quelltext', sub: 'main.rs', kind: 'file' },
      { label: 'Front-End', sub: 'Parser, Makros, Typen', kind: 'tool' },
      { label: 'MIR', sub: 'Borrow-Checker', kind: 'tool' },
      { label: 'LLVM-IR', sub: 'Optimierer', kind: 'tool' },
      { label: 'Back-End', sub: 'Maschinencode', kind: 'tool' },
      { label: 'Linker', sub: 'ausführbare Datei', kind: 'out' },
    ],
    notes: [
      'rustc übersetzt Rust in mehreren Stufen.',
      'Das **Front-End** zerlegt den Text, expandiert Makros wie `println!` und leitet Typen ab.',
      'Auf einer eigenen Zwischenstufe (**MIR**) prüft der **Borrow-Checker** die Besitz- und Ausleihregeln. Hier entstehen die berühmten Fehlermeldungen – und hier werden Speicherfehler ausgeschlossen.',
      'Danach übergibt rustc an **LLVM** – denselben Optimierer, den auch clang benutzt.',
      'Das **Back-End** erzeugt Maschinencode für den Zielprozessor.',
      'Der **Linker** fügt alles zu einer ausführbaren Datei zusammen.',
    ],
  },
};

const lesson: LessonCode = {
  asm: ['quadrat'],

  snippets: {
    quadrat: {
      python: raw`
def quadrat(x):
    return x * x
`,
      java: raw`
public class Main {
    static int quadrat(int x) {
        return x * x;
    }

    public static void main(String[] args) {
        System.out.println(quadrat(7));
    }
}
`,
      c: raw`
int quadrat(int x) {
    return x * x;
}
`,
      cpp: raw`
int quadrat(int x) {
    return x * x;
}
`,
      rust: raw`
#[unsafe(no_mangle)]
pub fn quadrat(x: i32) -> i32 {
    x * x
}
`,
    },
  },

  scenes: {
    weg: {
      title: 'Die Stationen in deiner Sprache',
      build: (_p, lang): Step[] => {
        const w = WEGE[lang];
        if (!w) return [];
        return w.stages.map((_, i) => ({ note: w.notes[i], pipeline: { stages: w.stages, active: i } }));
      },
    },
  },

  exercises: [
    {
      kind: 'quiz',
      id: 'frontend',
      title: 'Vorne und hinten',
      question: 'clang (C, C++), rustc (Rust) und swiftc (Swift) benutzen alle dasselbe Back-End: LLVM. Warum ist diese Aufteilung so erfolgreich?',
      options: [
        'Weil alle drei Sprachen gleich aussehen.',
        'Weil die aufwendigen Teile – Optimierung und Maschinencode für viele Prozessoren – nur einmal geschrieben werden müssen. Eine neue Sprache braucht nur ein Front-End bis zum Zwischencode.',
        'Weil LLVM die Sprachen ineinander übersetzt.',
        'Weil es Speicher spart.',
      ],
      correct: 1,
      explain:
        'Ohne gemeinsamen Zwischencode bräuchte jede Kombination aus Sprache und Prozessor einen eigenen Compiler – bei 5 Sprachen und 5 Prozessoren 25 Stück. Mit Zwischencode sind es 5 Front-Ends plus 5 Back-Ends. Jede Verbesserung am Optimierer kommt sofort allen Sprachen zugute.',
    },
    {
      kind: 'quiz',
      id: 'wann',
      title: 'Vorher oder währenddessen?',
      question: 'Was unterscheidet einen **Ahead-of-Time-Compiler** (C, Rust) von einem **JIT-Compiler** (Java-JVM, JavaScript-Engines)?',
      options: [
        'AOT übersetzt alles, bevor das Programm verteilt wird; JIT übersetzt während des Laufs und kann dabei beobachten, welche Stellen oft laufen.',
        'AOT ist immer schneller.',
        'JIT erzeugt keinen Maschinencode.',
        'Es gibt keinen Unterschied.',
      ],
      correct: 0,
      explain:
        'Der AOT-Compiler hat viel Zeit, aber kein Wissen über die tatsächliche Benutzung. Der JIT-Compiler muss schnell sein, weiß dafür, welche Methoden heiß sind und welche Typen tatsächlich vorkommen – und kann gezielt dafür optimieren. Der Preis: Aufwärmzeit beim Start.',
    },
  ],
};

export default lesson;
