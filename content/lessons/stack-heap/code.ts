import { raw } from '../../types.ts';
import type { Frame, HeapObj, Lang, LessonCode, Step } from '../../types.ts';
import { trace } from '../../util.ts';

const LISTE: Record<Lang, { var: string; obj: string }> = {
  python: { var: 'list', obj: 'list (3 Elemente)' },
  java: { var: 'int[]', obj: 'int[3]' },
  c: { var: 'int*', obj: 'malloc: 3 × int' },
  cpp: { var: 'vector', obj: 'Puffer: 3 × int' },
  rust: { var: 'Vec', obj: 'Puffer: 3 × i32' },
  sql: { var: '', obj: '' },
  bash: { var: '', obj: '' },
};

const lesson: LessonCode = {
  snippets: {
    erzeuge: {
      python: raw`
def erzeuge(n):  #@def
    liste = [0] * n  #@alloc
    liste[0] = 7  #@set
    return liste  #@ret

zahl = 3  #@main
daten = erzeuge(zahl)  #@call
print(daten[0], len(daten))  #@out
`,
      java: raw`
public class Main {
    static int[] erzeuge(int n) {  //@def
        int[] liste = new int[n];  //@alloc
        liste[0] = 7;  //@set
        return liste;  //@ret
    }

    public static void main(String[] args) {
        int zahl = 3;  //@main
        int[] daten = erzeuge(zahl);  //@call
        System.out.println(daten[0] + " " + daten.length);  //@out
    }
}
`,
      c: raw`
#include <stdio.h>
#include <stdlib.h>

int *erzeuge(int n) {  //@def
    int *liste = calloc(n, sizeof(int));  //@alloc
    liste[0] = 7;  //@set
    return liste;  //@ret
}

int main(void) {
    int zahl = 3;  //@main
    int *daten = erzeuge(zahl);  //@call
    printf("%d %d\n", daten[0], zahl);  //@out
    free(daten);  //@ende
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <vector>

std::vector<int> erzeuge(int n) {  //@def
    std::vector<int> liste(n, 0);  //@alloc
    liste[0] = 7;  //@set
    return liste;  //@ret
}

int main() {
    int zahl = 3;  //@main
    std::vector<int> daten = erzeuge(zahl);  //@call
    std::cout << daten[0] << " " << daten.size() << "\n";  //@out
    return 0;
}  //@ende
`,
      rust: raw`
fn erzeuge(n: usize) -> Vec<i32> {  //@def
    let mut liste = vec![0; n];  //@alloc
    liste[0] = 7;  //@set
    liste  //@ret
}

fn main() {
    let zahl = 3;  //@main
    let daten = erzeuge(zahl);  //@call
    println!("{} {}", daten[0], daten.len());  //@out
}  //@ende
`,
    },
    tief: {
      python: raw`
def tiefer(n):
    return tiefer(n + 1)

tiefer(1)
`,
      java: raw`
public class Main {
    static int tiefer(int n) {
        return tiefer(n + 1);
    }

    public static void main(String[] args) {
        tiefer(1);
    }
}
`,
      c: raw`
#include <stdio.h>

int tiefer(volatile int n) {
    return tiefer(n + 1) + 1;
}

int main(void) {
    printf("%d\n", tiefer(1));
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int tiefer(volatile int n) {
    return tiefer(n + 1) + 1;
}

int main() {
    std::cout << tiefer(1) << "\n";
    return 0;
}
`,
      rust: raw`
fn tiefer(n: u64) -> u64 {
    tiefer(n + 1) + 1
}

fn main() {
    println!("{}", tiefer(1));
}
`,
    },
  },

  // "tief" stürzt absichtlich ab (Stapelüberlauf).
  noVerify: ['tief'],

  scenes: {
    erzeuge: {
      title: 'Was auf dem Stack liegt – und was auf dem Heap',
      code: 'erzeuge',
      build: (_p, lang): Step[] =>
        trace((t) => {
          const typ = LISTE[lang];
          const ref = (state?: 'dangling') => ({ ref: 'h1', type: typ.var, ...(state ? { state } : {}) });
          const heap = (cells: number[], state?: HeapObj['state']): HeapObj[] => [{ id: 'h1', label: typ.obj, cells, state }];
          const main = (vars: Frame['vars']): Frame => ({ name: 'main', vars });
          const call = (vars: Frame['vars']): Frame => ({ name: 'erzeuge', vars });
          const name = lang === 'python' ? 'Hauptprogramm' : '`main`';

          t.step(
            'main',
            `${name} legt eine kleine Zahl an. Sie landet auf dem **Stack**: einem Stapel aus Bereichen, einer pro laufendem Funktionsaufruf.${lang === 'python' ? ' (Genau genommen ist in Python auch eine Zahl ein Objekt auf dem Heap. Für kleine Werte spielt das keine Rolle, deshalb zeigen wir sie vereinfacht direkt im Stack.)' : ''}`,
            { frames: [main({ zahl: 3 })], heap: [] },
          );
          t.step('call', 'Ein Funktionsaufruf: Oben auf den Stack kommt ein neuer Bereich mit dem Parameter `n`.', {
            frames: [main({ zahl: 3 }), call({ n: 3 })],
            heap: [],
          });
          t.step(
            'alloc',
            lang === 'c'
              ? '`calloc` reserviert Speicher auf dem **Heap** – einem großen Bereich, in dem Daten unabhängig von Funktionsaufrufen leben. Zurück kommt nur die **Adresse** des Blocks. Die lokale Variable `liste` enthält diese Adresse: Sie zeigt auf die Daten.'
              : 'Die Liste selbst landet auf dem **Heap** – einem großen Bereich, in dem Daten unabhängig von Funktionsaufrufen leben. Ihre Größe muss beim Kompilieren nicht feststehen. Die lokale Variable `liste` enthält nur einen **Verweis** darauf.',
            { frames: [main({ zahl: 3 }), call({ n: 3, liste: ref() })], heap: heap([0, 0, 0]) },
          );
          t.step('set', 'Über den Verweis wird ein Element geändert. Verändert wird das Objekt auf dem Heap, nicht die Variable.', {
            frames: [main({ zahl: 3 }), call({ n: 3, liste: ref() })],
            heap: heap([7, 0, 0]),
          });
          t.step(
            'ret',
            lang === 'rust'
              ? 'Die Funktion gibt `liste` zurück. Dabei wird nicht die Liste kopiert, sondern nur der kleine Verwaltungsteil (Adresse, Länge, Kapazität) – und mit ihm der **Besitz** der Daten.'
              : lang === 'cpp'
                ? 'Die Funktion gibt `liste` zurück. Der `vector` überträgt dabei seinen Heap-Puffer an den Aufrufer, statt die Elemente zu kopieren.'
                : 'Die Funktion gibt den Verweis zurück – also nur die Adresse, nicht die Daten.',
            { frames: [main({ zahl: 3 }), call({ n: 3, liste: ref() })], heap: heap([7, 0, 0]) },
          );
          t.step(
            'call',
            'Der Bereich von `erzeuge` wird vom Stack geräumt, `n` und `liste` sind verschwunden. **Die Daten auf dem Heap überleben** – und `daten` zeigt jetzt auf sie.',
            { frames: [main({ zahl: 3, daten: ref() })], heap: heap([7, 0, 0]) },
          );
          t.print('7 3');
          t.step('out', 'Über den Verweis kommt `main` an die Daten.', { frames: [main({ zahl: 3, daten: ref() })], heap: heap([7, 0, 0]) });
          if (lang === 'c') {
            t.step(
              'ende',
              'In C räumt niemand den Heap für dich auf. Was du mit `malloc`/`calloc` reservierst, musst du mit `free` zurückgeben – sonst bleibt der Speicher belegt, bis das Programm endet (ein **Speicherleck**).',
              { frames: [main({ zahl: 3, daten: ref('dangling') })], heap: heap([7, 0, 0], 'freed') },
            );
          } else if (lang === 'cpp' || lang === 'rust') {
            t.step(
              'ende',
              `Am Ende von \`main\` endet die Lebenszeit von \`daten\`. In diesem Moment gibt der ${lang === 'cpp' ? '`vector`' : '`Vec`'} seinen Heap-Speicher automatisch frei – genau einmal, ohne dass du daran denken musst.`,
              { frames: [main({ zahl: 3 })], heap: heap([7, 0, 0], 'freed') },
            );
          } else {
            t.step(
              'out',
              'Und wer gibt den Heap-Speicher frei? Niemand von Hand: Sobald kein Verweis mehr auf das Objekt existiert, räumt der **Garbage Collector** es irgendwann weg.',
              { frames: [main({ zahl: 3, daten: ref() })], heap: heap([7, 0, 0]) },
            );
          }
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'quadrate',
      title: 'Eine Liste erzeugen und zurückgeben',
      prompt:
        'Schreibe die Funktion `quadrate(n)`. Sie soll eine **neue** Liste (bzw. ein neues Array) mit den Quadratzahlen von 1² bis n² erzeugen und zurückgeben. Das Hauptprogramm gibt sie aus.\n\nBeispiel: Für `n = 4` entsteht `1 4 9 16`.',
      tests: [
        { name: 'n = 4', stdin: '4\n', expected: '1 4 9 16\n' },
        { name: 'n = 1', stdin: '1\n', expected: '1\n' },
        { name: 'n = 7', stdin: '7\n', expected: '1 4 9 16 25 36 49\n' },
      ],
      hints: [
        'Erzeuge zuerst eine Liste der passenden Größe (oder eine leere, an die du anhängst). Fülle sie dann in einer Schleife: An Position `i` gehört `(i + 1) * (i + 1)`.',
        'In C braucht die Liste Platz auf dem Heap: `malloc(n * sizeof(int))`. Ein lokales Array würde beim Verlassen der Funktion ungültig.',
      ],
      code: {
        python: raw`
def quadrate(n):
#:solution
    ergebnis = []
    for i in range(1, n + 1):
        ergebnis.append(i * i)
    return ergebnis
#:starter
    # Erzeuge eine neue Liste und gib sie zurück.
    return []
#:end

n = int(input())
for q in quadrate(n):
    print(q, end=" ")
print()
`,
        java: raw`
import java.util.Scanner;

public class Main {
    static int[] quadrate(int n) {
//:solution
        int[] ergebnis = new int[n];
        for (int i = 0; i < n; i++) {
            ergebnis[i] = (i + 1) * (i + 1);
        }
        return ergebnis;
//:starter
        // Erzeuge ein neues Array mit new int[n] und fülle es.
        return new int[0];
//:end
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int q : quadrate(n)) {
            System.out.print(q + " ");
        }
        System.out.println();
    }
}
`,
        c: raw`
#include <stdio.h>
#include <stdlib.h>

int *quadrate(int n) {
//:solution
    int *ergebnis = malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        ergebnis[i] = (i + 1) * (i + 1);
    }
    return ergebnis;
//:starter
    // Reserviere mit malloc Platz für n Zahlen, fülle ihn und gib die Adresse zurück.
    (void)n;
    return NULL;
//:end
}

int main(void) {
    int n;
    scanf("%d", &n);
    int *q = quadrate(n);
    if (q == NULL) {
        printf("(quadrate hat NULL geliefert)\n");
        return 0;
    }
    for (int i = 0; i < n; i++) {
        printf("%d ", q[i]);
    }
    printf("\n");
    free(q);
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <vector>

std::vector<int> quadrate(int n) {
//:solution
    std::vector<int> ergebnis;
    for (int i = 1; i <= n; i++) {
        ergebnis.push_back(i * i);
    }
    return ergebnis;
//:starter
    // Erzeuge einen neuen vector und gib ihn zurück.
    (void)n;
    return {};
//:end
}

int main() {
    int n;
    std::cin >> n;
    for (int q : quadrate(n)) {
        std::cout << q << " ";
    }
    std::cout << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn quadrate(n: i32) -> Vec<i32> {
//:solution
    let mut ergebnis = Vec::new();
    for i in 1..=n {
        ergebnis.push(i * i);
    }
    ergebnis
//:starter
    // Erzeuge einen neuen Vec und gib ihn zurück.
    let _ = n;
    Vec::new()
//:end
}

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let n: i32 = zeile.trim().parse().unwrap();
    for q in quadrate(n) {
        print!("{} ", q);
    }
    println!();
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'lokal',
      title: 'Ein gefährliches Geschenk',
      question:
        'Eine C-Funktion legt ein lokales Array an (`int werte[3];`) und gibt dessen Adresse zurück. Warum ist das ein schwerer Fehler?',
      options: [
        'Lokale Arrays dürfen in C keine Zahlen enthalten.',
        'Das Array lag im Bereich der Funktion auf dem Stack. Nach dem `return` ist dieser Bereich freigegeben und wird beim nächsten Aufruf überschrieben.',
        'Adressen dürfen grundsätzlich nicht zurückgegeben werden.',
        'Der Heap ist zu klein für drei Zahlen.',
      ],
      correct: 1,
      explain:
        'Stack-Speicher lebt genau so lange wie der Funktionsaufruf. Die zurückgegebene Adresse zeigt danach auf Speicher, der schon dem nächsten Aufruf gehört – ein **hängender Zeiger**. Daten, die einen Aufruf überleben sollen, gehören auf den Heap. Rust erkennt diesen Fehler übrigens beim Kompilieren, Java und Python lassen ihn gar nicht erst zu.',
    },
    {
      kind: 'quiz',
      id: 'overflow',
      title: 'Wenn der Stapel überläuft',
      question:
        'Eine Funktion ruft sich ohne Abbruchbedingung immer wieder selbst auf. Nach einigen tausend Aufrufen stürzt das Programm ab. Warum?',
      options: [
        'Der Heap ist voll.',
        'Jeder Aufruf legt einen neuen Bereich auf den Stack, und der Stack hat eine feste, recht kleine Größe.',
        'Die Funktion wird zu langsam.',
        'Das Betriebssystem verbietet mehr als 1000 Funktionen.',
      ],
      correct: 1,
      explain:
        'Der Stack ist meist nur wenige Megabyte groß. Jeder noch nicht beendete Aufruf belegt dort Platz. Ist er voll, kommt es zum **Stapelüberlauf** (*stack overflow*). Führe das Beispiel unten aus, um ihn in deiner Sprache zu sehen.',
    },
  ],
};

export default lesson;
