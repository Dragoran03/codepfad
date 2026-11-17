import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const ASM = [
  'summe:',
  '    mov   w8, #0        // summe = 0',
  '    mov   w9, #1        // i = 1',
  'schleife:',
  '    cmp   w9, w0        // i mit n vergleichen',
  '    b.gt  ende          // falls i > n: springe zu ende',
  '    add   w8, w8, w9    // summe = summe + i',
  '    add   w9, w9, #1    // i = i + 1',
  '    b     schleife      // zurück zum Vergleich',
  'ende:',
  '    mov   w0, w8        // Ergebnis gehört nach w0',
  '    ret                 // zurück zum Aufrufer',
];

const lesson: LessonCode = {
  asm: ['maximum'],

  snippets: {
    maximum: {
      python: raw`
def maximum(a, b):
    if a > b:
        return a
    return b
`,
      java: raw`
public class Main {
    static int maximum(int a, int b) {
        if (a > b) {
            return a;
        }
        return b;
    }
}
`,
      c: raw`
int maximum(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;
}
`,
      cpp: raw`
int maximum(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;
}
`,
      rust: raw`
#[unsafe(no_mangle)]
pub fn maximum(a: i32, b: i32) -> i32 {
    if a > b {
        return a;
    }
    b
}
`,
    },
  },

  scenes: {
    cpu: {
      title: 'Der Prozessor arbeitet ein Programm ab',
      params: [{ name: 'n', label: 'n', min: 1, max: 4, value: 3 }],
      build: (p): Step[] => {
        const steps: Step[] = [];
        const reg = { w0: p.n, w8: 0, w9: 0 };
        let flag = '–';
        const show = (line: number, note: string) =>
          steps.push({
            note,
            term: { lines: ASM.map((l, i) => ({ out: `${i === line ? '▶' : ' '} ${l}` })) },
            frames: [{ name: 'Register', vars: { w0: reg.w0, w8: reg.w8, w9: reg.w9, PC: `Zeile ${line + 1}`, Vergleich: flag } }],
          });
        show(0, `Die Funktion wird aufgerufen. Das Argument n = ${p.n} liegt nach der Aufrufkonvention von ARM64 im Register **w0**. Register sind winzige Speicherplätze direkt im Prozessor – rechnen kann er nur mit ihnen.`);
        reg.w8 = 0;
        show(1, '`mov` kopiert einen Wert in ein Register. w8 übernimmt die Rolle von `summe`.');
        reg.w9 = 1;
        show(2, 'w9 übernimmt die Rolle von `i`. Variablennamen gibt es hier nicht mehr – nur noch Register.');
        let guard = 0;
        while (guard++ < 20) {
          flag = reg.w9 > reg.w0 ? `${reg.w9} > ${reg.w0}` : `${reg.w9} ≤ ${reg.w0}`;
          show(4, `\`cmp\` vergleicht i (${reg.w9}) mit n (${reg.w0}) und merkt sich das Ergebnis in den **Statusbits** des Prozessors.`);
          if (reg.w9 > reg.w0) {
            show(5, '`b.gt` ist ein **bedingter Sprung**: Weil i größer als n ist, springt der Prozessor zu `ende`. So werden Schleifen und `if` umgesetzt – es gibt keine anderen Kontrollstrukturen.');
            break;
          }
          show(5, '`b.gt` springt nur, wenn der Vergleich „größer" ergab. Hier nicht – es geht mit der nächsten Zeile weiter.');
          reg.w8 += reg.w9;
          show(6, `\`add\` addiert zwei Register: summe = ${reg.w8}.`);
          reg.w9 += 1;
          show(7, `i = ${reg.w9}.`);
          show(8, '`b` ist ein **unbedingter Sprung** zurück zum Vergleich. Der Befehlszähler (PC) wird einfach auf eine andere Adresse gesetzt.');
        }
        reg.w0 = reg.w8;
        show(10, `Das Ergebnis muss in w0 stehen – dort erwartet es der Aufrufer. w0 = ${reg.w0}.`);
        show(11, '`ret` springt an die Stelle zurück, von der aus die Funktion aufgerufen wurde. Aus einer `for`-Schleife sind sieben einfache Befehle geworden.');
        return steps;
      },
    },
  },

  exercises: [
    {
      kind: 'quiz',
      id: 'architektur',
      title: 'Warum gibt es verschiedene Fassungen?',
      question: 'Ein C-Programm, für einen Windows-PC mit Intel-Prozessor übersetzt, startet nicht auf einem aktuellen Mac. Warum nicht?',
      options: [
        'Weil C auf dem Mac verboten ist.',
        'Weil Maschinencode an den Befehlssatz des Prozessors (x86-64 gegen ARM64) und an das Betriebssystem gebunden ist. Der Quelltext muss neu übersetzt werden.',
        'Weil Macs keine Programme ausführen können, die länger als 1 MB sind.',
        'Weil Windows-Programme verschlüsselt sind.',
      ],
      correct: 1,
      explain:
        'Jede Prozessorfamilie hat ihren eigenen **Befehlssatz** (*instruction set architecture*): x86-64 bei Intel und AMD, ARM64 bei Apple-Silicon und den meisten Smartphones, RISC-V als offener Neuling. Dazu kommen Unterschiede im Dateiformat und in den Systemaufrufen der Betriebssysteme. Genau dieses Problem lösen Bytecode und virtuelle Maschinen – und Übersetzungsschichten wie Apples Rosetta 2.',
    },
    {
      kind: 'quiz',
      id: 'register',
      title: 'Wo wird gerechnet?',
      question: 'Wo führt ein Prozessor eine Rechnung wie `add w8, w8, w9` aus?',
      options: [
        'Direkt im Arbeitsspeicher (RAM).',
        'In Registern – winzigen, extrem schnellen Speicherplätzen im Prozessor selbst. Werte aus dem RAM müssen erst hineingeladen werden.',
        'Auf der Festplatte.',
        'Im Betriebssystem.',
      ],
      correct: 1,
      explain:
        'Ein ARM64-Prozessor hat 31 allgemeine Register zu je 64 Bit (als `x0` bis `x30`, die unteren 32 Bit heißen `w0` bis `w30`). Rechenbefehle arbeiten nur mit Registern; eigene Lade- und Speicherbefehle (`ldr`, `str`) bewegen Daten zwischen Registern und Arbeitsspeicher. Eine der wichtigsten Aufgaben des Compilers ist deshalb, Variablen klug auf die wenigen Register zu verteilen.',
    },
  ],
};

export default lesson;
