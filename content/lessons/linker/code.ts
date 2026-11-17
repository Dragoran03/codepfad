import { raw } from '../../types.ts';
import type { LessonCode, Step, TableView } from '../../types.ts';

const obj = (name: string, rows: (string | number)[][], hi?: number[], dim?: number[]): TableView => ({ name, columns: ['Symbol', 'Status'], rows, hi, dim });

const lesson: LessonCode = {
  // "fehlt" scheitert absichtlich beim Linken.
  noVerify: ['fehlt'],

  snippets: {
    fehlt: {
      python: raw`
# In Python gibt es keinen Linker. Ein fehlender Name fällt erst
# beim Aufruf auf – hier fehlt die Funktion verdopple ganz:
print("Start")
print(verdopple(21))
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        // Java prüft beim Kompilieren, ob jede benutzte Klasse existiert.
        System.out.println(Rechner.verdopple(21));
    }
}
`,
      c: raw`
#include <stdio.h>

int verdopple(int x);   // Deklaration: "Diese Funktion gibt es irgendwo."

int main(void) {
    printf("%d\n", verdopple(21));
    return 0;
}
// Die Definition fehlt – der Compiler ist zufrieden, der Linker nicht.
`,
      cpp: raw`
#include <iostream>

int verdopple(int x);   // Deklaration: "Diese Funktion gibt es irgendwo."

int main() {
    std::cout << verdopple(21) << "\n";
    return 0;
}
// Die Definition fehlt – der Compiler ist zufrieden, der Linker nicht.
`,
      rust: raw`
unsafe extern "C" {
    fn verdopple(x: i32) -> i32;   // eine Funktion aus einer fremden Bibliothek
}

fn main() {
    println!("{}", unsafe { verdopple(21) });
}
`,
    },
  },

  scenes: {
    linken: {
      title: 'Der Linker verbindet Teile',
      build: (): Step[] => [
        {
          note: 'Größere Programme bestehen aus vielen Quelldateien. Jede wird **einzeln** übersetzt – zu einer **Objektdatei** mit Maschinencode und einer Liste von **Symbolen**: welche Funktionen sie anbietet und welche sie von woanders braucht.',
          tables: [
            obj('main.o', [['main', 'definiert'], ['verdopple', 'gebraucht'], ['printf', 'gebraucht']]),
            obj('rechnen.o', [['verdopple', 'definiert'], ['halbiere', 'definiert']]),
            obj('libc (Bibliothek)', [['printf', 'definiert'], ['malloc', 'definiert'], ['…', '…']]),
          ],
        },
        {
          note: 'Der **Linker** sammelt alle Objektdateien und Bibliotheken ein und sucht zu jedem gebrauchten Symbol eine Definition. `verdopple` findet er in `rechnen.o` …',
          tables: [
            obj('main.o', [['main', 'definiert'], ['verdopple', 'gebraucht'], ['printf', 'gebraucht']], [1]),
            obj('rechnen.o', [['verdopple', 'definiert'], ['halbiere', 'definiert']], [0]),
            obj('libc (Bibliothek)', [['printf', 'definiert'], ['malloc', 'definiert'], ['…', '…']]),
          ],
        },
        {
          note: '… und `printf` in der C-Standardbibliothek. Dann trägt er an jeder Aufrufstelle die endgültige Adresse ein (**Relokation**).',
          tables: [
            obj('main.o', [['main', 'definiert'], ['verdopple', 'gebraucht'], ['printf', 'gebraucht']], [2]),
            obj('rechnen.o', [['verdopple', 'definiert'], ['halbiere', 'definiert']]),
            obj('libc (Bibliothek)', [['printf', 'definiert'], ['malloc', 'definiert'], ['…', '…']], [0]),
          ],
        },
        {
          note: 'Heraus kommt die **ausführbare Datei**. Findet der Linker eine Definition nicht, meldet er *undefined symbol* bzw. *undefined reference*. Gibt es sie doppelt, meldet er *duplicate symbol*. Beides sind keine Compiler-, sondern Linker-Fehler – erkennbar an Meldungen von `ld`.',
          tables: [
            {
              name: 'programm (ausführbar)',
              columns: ['Symbol', 'Adresse'],
              rows: [['main', '0x100003f40'], ['verdopple', '0x100003f80'], ['halbiere', '0x100003f90'], ['printf', '→ libc (dynamisch)']],
            },
          ],
        },
      ],
    },
  },

  exercises: [
    {
      kind: 'quiz',
      id: 'statisch-dynamisch',
      title: 'Statisch oder dynamisch?',
      question: 'Was ist der Unterschied zwischen **statischem** und **dynamischem** Linken einer Bibliothek?',
      options: [
        'Statisch: Der Code der Bibliothek wird in die ausführbare Datei kopiert. Dynamisch: Die Datei verweist nur darauf, und das Betriebssystem lädt die Bibliothek beim Start dazu.',
        'Statisch ist für C, dynamisch für C++.',
        'Dynamisch gelinkte Programme laufen nur im Internet.',
        'Es gibt keinen Unterschied.',
      ],
      correct: 0,
      explain:
        'Statisch gelinkte Programme sind eigenständig und laufen überall, sind aber größer, und jede Sicherheitskorrektur der Bibliothek erfordert ein neues Programm. Dynamisch gelinkte teilen sich Bibliotheken (`.so` unter Linux, `.dylib` auf dem Mac, `.dll` unter Windows); ein Update der Bibliothek wirkt sofort für alle – kann aber auch alle auf einmal kaputt machen. Rust und Go linken ihre eigenen Bibliotheken meist statisch.',
    },
    {
      kind: 'quiz',
      id: 'deklaration',
      title: 'Ankündigen und Liefern',
      question: 'Im C-Beispiel steht `int verdopple(int x);` ohne Rumpf. Warum ist der Compiler damit zufrieden, obwohl die Funktion nirgends geschrieben ist?',
      options: [
        'Er erzeugt automatisch eine leere Funktion.',
        'Eine **Deklaration** verspricht nur, dass es die Funktion irgendwo gibt, und nennt ihre Typen. Damit kann der Compiler den Aufruf prüfen und übersetzen. Ob das Versprechen eingelöst wird, prüft erst der Linker.',
        'Weil C keine Typen prüft.',
        'Er ist nicht zufrieden – das ist ein Compilerfehler.',
      ],
      correct: 1,
      explain:
        'Genau dafür gibt es Header-Dateien (`.h`): Sie enthalten Deklarationen, damit jede Quelldatei einzeln übersetzt werden kann, ohne die anderen zu kennen. Die **Definition** steht in genau einer `.c`-Datei. Das Prinzip „überall deklarieren, einmal definieren" heißt in C++ *One Definition Rule*.',
    },
  ],
};

export default lesson;
