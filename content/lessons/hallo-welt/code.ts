import { raw } from '../../types.ts';
import type { Lang, LessonCode, PipelineView, Step } from '../../types.ts';
import { trace } from '../../util.ts';

type Stage = PipelineView['stages'][number];

const WEGE: Record<Lang, { stages: Stage[]; notes: string[] }> = {
  python: {
    stages: [
      { label: 'main.py', sub: 'dein Quelltext', kind: 'file' },
      { label: 'Python-Interpreter', sub: 'liest und führt sofort aus', kind: 'tool' },
      { label: 'Ausgabe', sub: 'Hallo Welt', kind: 'out' },
    ],
    notes: [
      'Du schreibst **Quelltext**: ganz normalen Text in einer Datei. Der Computer kann damit noch nichts anfangen.',
      'Der **Interpreter** liest dein Programm und führt es direkt aus, Anweisung für Anweisung. Es entsteht keine eigene Programmdatei – wer dein Programm starten will, braucht ebenfalls Python.',
      'Die Ausgabe erscheint. Der Preis der Bequemlichkeit: Einen Tippfehler in Zeile 50 bemerkt Python erst, wenn das Programm tatsächlich bei Zeile 50 ankommt.',
    ],
  },
  java: {
    stages: [
      { label: 'Main.java', sub: 'dein Quelltext', kind: 'file' },
      { label: 'javac', sub: 'Compiler: prüft und übersetzt', kind: 'tool' },
      { label: 'Main.class', sub: 'Bytecode', kind: 'file' },
      { label: 'JVM', sub: 'führt Bytecode aus', kind: 'run' },
      { label: 'Ausgabe', sub: 'Hallo Welt', kind: 'out' },
    ],
    notes: [
      'Du schreibst **Quelltext**: ganz normalen Text in einer Datei. Der Computer kann damit noch nichts anfangen.',
      'Der **Compiler** `javac` prüft das gesamte Programm auf Fehler (Tippfehler, falsche Typen) – bevor irgendetwas läuft.',
      'Heraus kommt **Bytecode**: eine kompakte Zwischensprache, die kein Prozessor direkt versteht, die aber auf jedem Betriebssystem gleich ist.',
      'Die **Java Virtual Machine** (JVM) führt den Bytecode aus und übersetzt häufig genutzte Teile währenddessen in schnellen Maschinencode.',
      'Die Ausgabe erscheint. Dieselbe `.class`-Datei läuft unverändert auf Windows, macOS und Linux – überall, wo es eine JVM gibt.',
    ],
  },
  c: {
    stages: [
      { label: 'main.c', sub: 'dein Quelltext', kind: 'file' },
      { label: 'clang', sub: 'Compiler: prüft und übersetzt', kind: 'tool' },
      { label: 'main', sub: 'Maschinencode', kind: 'file' },
      { label: 'Prozessor', sub: 'führt direkt aus', kind: 'run' },
      { label: 'Ausgabe', sub: 'Hallo Welt', kind: 'out' },
    ],
    notes: [
      'Du schreibst **Quelltext**: ganz normalen Text in einer Datei. Der Computer kann damit noch nichts anfangen.',
      'Der **Compiler** prüft das gesamte Programm und übersetzt es vollständig – bevor irgendetwas läuft.',
      'Heraus kommt eine **ausführbare Datei** mit Maschinencode: genau die Befehle, die dein Prozessor versteht. Für einen anderen Prozessor oder ein anderes Betriebssystem musst du neu übersetzen.',
      'Der Prozessor führt die Befehle direkt aus. Kein Übersetzer läuft mehr mit – deshalb ist C so schnell.',
      'Die Ausgabe erscheint. Zum Starten braucht niemand mehr einen Compiler, nur die fertige Datei.',
    ],
  },
  cpp: {
    stages: [
      { label: 'main.cpp', sub: 'dein Quelltext', kind: 'file' },
      { label: 'clang++', sub: 'Compiler: prüft und übersetzt', kind: 'tool' },
      { label: 'main', sub: 'Maschinencode', kind: 'file' },
      { label: 'Prozessor', sub: 'führt direkt aus', kind: 'run' },
      { label: 'Ausgabe', sub: 'Hallo Welt', kind: 'out' },
    ],
    notes: [
      'Du schreibst **Quelltext**: ganz normalen Text in einer Datei. Der Computer kann damit noch nichts anfangen.',
      'Der **Compiler** prüft das gesamte Programm und übersetzt es vollständig – bevor irgendetwas läuft.',
      'Heraus kommt eine **ausführbare Datei** mit Maschinencode: genau die Befehle, die dein Prozessor versteht. Für einen anderen Prozessor oder ein anderes Betriebssystem musst du neu übersetzen.',
      'Der Prozessor führt die Befehle direkt aus. Kein Übersetzer läuft mehr mit – deshalb ist C++ so schnell.',
      'Die Ausgabe erscheint. Zum Starten braucht niemand mehr einen Compiler, nur die fertige Datei.',
    ],
  },
  rust: {
    stages: [
      { label: 'main.rs', sub: 'dein Quelltext', kind: 'file' },
      { label: 'rustc', sub: 'Compiler: prüft sehr streng', kind: 'tool' },
      { label: 'main', sub: 'Maschinencode', kind: 'file' },
      { label: 'Prozessor', sub: 'führt direkt aus', kind: 'run' },
      { label: 'Ausgabe', sub: 'Hallo Welt', kind: 'out' },
    ],
    notes: [
      'Du schreibst **Quelltext**: ganz normalen Text in einer Datei. Der Computer kann damit noch nichts anfangen.',
      'Der **Compiler** `rustc` prüft das gesamte Programm – und zwar strenger als jeder andere hier: Er weist auch Programme zurück, die Speicherfehler enthalten könnten.',
      'Heraus kommt eine **ausführbare Datei** mit Maschinencode: genau die Befehle, die dein Prozessor versteht.',
      'Der Prozessor führt die Befehle direkt aus. Kein Übersetzer läuft mehr mit – Rust ist so schnell wie C.',
      'Die Ausgabe erscheint. Viele Fehler, die in anderen Sprachen erst beim Ausführen auffallen, hat der Compiler vorher schon abgefangen.',
    ],
  },
  sql: { stages: [], notes: [] },
  bash: { stages: [], notes: [] },
};

const lesson: LessonCode = {
  snippets: {
    hallo: {
      python: raw`
print("Hallo Welt")
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        System.out.println("Hallo Welt");
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    printf("Hallo Welt\n");
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    std::cout << "Hallo Welt\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    println!("Hallo Welt");
}
`,
    },
    tee: {
      python: raw`
print("Wasser kochen")  #@a
print("Tee aufgießen")  #@b
print("Drei Minuten warten")  #@c
`,
      java: raw`
public class Main {
    public static void main(String[] args) {  //@start
        System.out.println("Wasser kochen");  //@a
        System.out.println("Tee aufgießen");  //@b
        System.out.println("Drei Minuten warten");  //@c
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {  //@start
    printf("Wasser kochen\n");  //@a
    printf("Tee aufgießen\n");  //@b
    printf("Drei Minuten warten\n");  //@c
    return 0;  //@ende
}
`,
      cpp: raw`
#include <iostream>

int main() {  //@start
    std::cout << "Wasser kochen\n";  //@a
    std::cout << "Tee aufgießen\n";  //@b
    std::cout << "Drei Minuten warten\n";  //@c
    return 0;  //@ende
}
`,
      rust: raw`
fn main() {  //@start
    println!("Wasser kochen");  //@a
    println!("Tee aufgießen");  //@b
    println!("Drei Minuten warten");  //@c
}
`,
    },
    reihenfolge: {
      python: raw`
print("B")
print("A")
print("B")
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        System.out.println("B");
        System.out.println("A");
        System.out.println("B");
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    printf("B\n");
    printf("A\n");
    printf("B\n");
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    std::cout << "B\n";
    std::cout << "A\n";
    std::cout << "B\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    println!("B");
    println!("A");
    println!("B");
}
`,
    },
  },

  scenes: {
    weg: {
      title: 'Vom Quelltext zur Ausgabe',
      build: (_p, lang): Step[] => {
        const w = WEGE[lang];
        return w.stages.map((_, i) => ({ note: w.notes[i], pipeline: { stages: w.stages, active: i } }));
      },
    },
    ablauf: {
      title: 'Anweisungen laufen von oben nach unten',
      code: 'tee',
      build: (_p, lang) =>
        trace((t) => {
          if (lang !== 'python') {
            t.step('start', 'Jedes Programm beginnt in der Funktion `main`. Alles zwischen ihren geschweiften Klammern wird der Reihe nach ausgeführt.');
          }
          t.print('Wasser kochen');
          t.step('a', 'Die erste Anweisung wird ausgeführt: Der Text in den Anführungszeichen erscheint in der Ausgabe.');
          t.print('Tee aufgießen');
          t.step('b', 'Erst wenn die erste Anweisung fertig ist, kommt die zweite an die Reihe.');
          t.print('Drei Minuten warten');
          t.step('c', 'Dann die dritte. Ein Programm ist wie ein Rezept: Die Reihenfolge der Zeilen ist die Reihenfolge der Ausführung.');
          if (lang === 'c' || lang === 'cpp') {
            t.step('ende', '`return 0` beendet `main` und meldet dem Betriebssystem: alles in Ordnung.');
          }
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'gruss',
      title: 'Dein erstes Programm',
      prompt:
        'Ändere das Programm so, dass es genau diese zwei Zeilen ausgibt:\n\n`Hallo Welt`\n\n`Ich lerne programmieren`\n\nMit **Ausführen** siehst du, was dein Programm tut. **Prüfen** vergleicht die Ausgabe mit der erwarteten.',
      tests: [{ name: 'Beide Zeilen stimmen', expected: 'Hallo Welt\nIch lerne programmieren\n' }],
      hints: [
        'Du brauchst zwei Ausgabe-Anweisungen untereinander – eine pro Zeile.',
        'Achte auf Groß- und Kleinschreibung. Der Text muss Zeichen für Zeichen übereinstimmen.',
      ],
      code: {
        python: raw`
#:solution
print("Hallo Welt")
print("Ich lerne programmieren")
#:starter
print("Hallo")
#:end
`,
        java: raw`
public class Main {
    public static void main(String[] args) {
//:solution
        System.out.println("Hallo Welt");
        System.out.println("Ich lerne programmieren");
//:starter
        System.out.println("Hallo");
//:end
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
//:solution
    printf("Hallo Welt\n");
    printf("Ich lerne programmieren\n");
//:starter
    printf("Hallo\n");
//:end
    return 0;
}
`,
        cpp: raw`
#include <iostream>

int main() {
//:solution
    std::cout << "Hallo Welt\n";
    std::cout << "Ich lerne programmieren\n";
//:starter
    std::cout << "Hallo\n";
//:end
    return 0;
}
`,
        rust: raw`
fn main() {
//:solution
    println!("Hallo Welt");
    println!("Ich lerne programmieren");
//:starter
    println!("Hallo");
//:end
}
`,
      },
    },
    {
      kind: 'predict',
      id: 'reihenfolge',
      title: 'Was kommt heraus?',
      code: 'reihenfolge',
      expected: 'B\nA\nB\n',
      explain: 'Die Anweisungen laufen streng von oben nach unten. Jede Ausgabe-Anweisung erzeugt eine eigene Zeile.',
    },
    {
      kind: 'quiz',
      id: 'compiler',
      title: 'Compiler oder Interpreter?',
      question: 'Was ist der wichtigste Vorteil, wenn ein Compiler das ganze Programm vor dem Start übersetzt?',
      options: [
        'Das Programm braucht dann keinen Arbeitsspeicher mehr.',
        'Viele Fehler werden gefunden, bevor das Programm überhaupt läuft – und das Ergebnis ist meist schneller.',
        'Der Quelltext wird dadurch kürzer.',
        'Das Programm kann nur so Text ausgeben.',
      ],
      correct: 1,
      explain:
        'Ein Compiler sieht das ganze Programm auf einmal. Er kann Tippfehler und falsch verwendete Typen melden, bevor ein Nutzer sie zu spüren bekommt, und den Code gründlich optimieren. Der Preis: ein zusätzlicher Schritt vor jedem Start.',
    },
  ],
};

export default lesson;
