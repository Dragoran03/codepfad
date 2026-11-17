import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const BC = ['LOAD_NAME   a', 'LOAD_NAME   b', 'LOAD_CONST  2', 'BINARY_OP   *', 'BINARY_OP   +', 'STORE_NAME  ergebnis'];

const lesson: LessonCode = {
  asm: ['rechnung'],

  snippets: {
    rechnung: {
      python: raw`
def rechne(a, b):
    return a + b * 2
`,
      java: raw`
public class Main {
    static int rechne(int a, int b) {
        return a + b * 2;
    }
}
`,
      c: raw`
int rechne(int a, int b) {
    return a + b * 2;
}
`,
      cpp: raw`
int rechne(int a, int b) {
    return a + b * 2;
}
`,
      rust: raw`
#[unsafe(no_mangle)]
pub fn rechne(a: i32, b: i32) -> i32 {
    a + b * 2
}
`,
    },
  },

  scenes: {
    stack: {
      title: 'Eine Stack-Maschine rechnet a + b * 2',
      build: (): Step[] => {
        const steps: Step[] = [];
        const stack: number[] = [];
        const vars: Record<string, number | string> = { a: 3, b: 4, ergebnis: '–' };
        const show = (pc: number, note: string) =>
          steps.push({
            note,
            term: { lines: BC.map((b, i) => ({ out: `${i === pc ? '▶' : ' '} ${String(i * 2).padStart(2)}  ${b}` })) },
            array: { label: 'Stapel der VM (oben ist rechts)', cells: stack.length ? [...stack] : ['leer'], showIndex: false, hi: stack.length ? [stack.length - 1] : [] },
            frames: [{ name: 'Variablen', vars: { ...vars } }],
          });
        show(-1, 'Der Python-Compiler hat `ergebnis = a + b * 2` in sechs Bytecode-Befehle übersetzt. Die virtuelle Maschine hat keine Register, sondern einen **Stapel**: Befehle legen Werte darauf oder nehmen sie herunter.');
        stack.push(3);
        show(0, '`LOAD_NAME a` schlägt `a` nach und legt den Wert auf den Stapel.');
        stack.push(4);
        show(1, 'Dasselbe für `b`.');
        stack.push(2);
        show(2, '`LOAD_CONST` legt eine Konstante aus dem Code auf den Stapel.');
        stack.pop();
        stack.pop();
        stack.push(8);
        show(3, '`BINARY_OP *` nimmt die obersten **zwei** Werte herunter, multipliziert sie und legt das Ergebnis zurück. Die Reihenfolge der Befehle entspricht dem Syntaxbaum, von unten nach oben gelesen.');
        stack.pop();
        stack.pop();
        stack.push(11);
        show(4, '`BINARY_OP +`: 3 + 8 = 11. Erst hier, beim Ausführen, prüft die VM, ob `+` für diese Typen überhaupt erlaubt ist.');
        stack.pop();
        vars.ergebnis = 11;
        show(5, '`STORE_NAME` nimmt den obersten Wert und speichert ihn unter dem Namen `ergebnis`. Der Stapel ist wieder leer. Die JVM arbeitet nach demselben Prinzip – nur mit Befehlen wie `iload` und `imul`.');
        return steps;
      },
    },
  },

  exercises: [
    {
      kind: 'quiz',
      id: 'warum-vm',
      title: 'Wozu der Umweg?',
      question: 'Warum übersetzen Java und Python in Bytecode statt direkt in Maschinencode?',
      options: [
        'Weil Bytecode schneller ist als Maschinencode.',
        'Weil derselbe Bytecode auf jedem Prozessor und Betriebssystem läuft, für das es die virtuelle Maschine gibt – und weil die VM zur Laufzeit Dinge leisten kann, die vorab schwer sind (Typen prüfen, Speicher aufräumen, gezielt optimieren).',
        'Weil Maschinencode verboten ist.',
        'Weil Bytecode kleiner ist als der Quelltext.',
      ],
      correct: 1,
      explain:
        '„Write once, run anywhere" war das Versprechen von Java: Die Arbeit, für jeden Prozessor Maschinencode zu erzeugen, steckt einmal in der VM statt in jedem Programm. Dazu kommen Laufzeitdienste wie Garbage Collection und Sicherheitsprüfungen. Der Preis ist Geschwindigkeit – den die JVM mit ihrem JIT-Compiler größtenteils wieder hereinholt.',
    },
    {
      kind: 'quiz',
      id: 'aufwaermen',
      title: 'Aufwärmen',
      question: 'Ein Java-Webserver beantwortet die ersten Anfragen nach dem Start deutlich langsamer als spätere. Was ist die wahrscheinlichste Erklärung?',
      options: [
        'Die Festplatte muss erst warm werden.',
        'Die JVM führt den Code zunächst im Interpreter aus und übersetzt häufig benutzte Methoden erst nach und nach mit dem JIT-Compiler in optimierten Maschinencode.',
        'Java-Programme werden mit der Zeit immer schneller, ohne Grenze.',
        'Der Garbage Collector läuft nur am Anfang.',
      ],
      correct: 1,
      explain:
        'Das nennt man **Aufwärmphase** (*warm-up*). Die JVM zählt, wie oft Methoden und Schleifen laufen. Ab einer Schwelle übersetzt sie sie – erst schnell und einfach, bei weiterem Bedarf gründlich optimiert. Wer Java-Code misst, muss deshalb erst aufwärmen, sonst misst er den Interpreter.',
    },
  ],
};

export default lesson;
