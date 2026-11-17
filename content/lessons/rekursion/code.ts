import { raw } from '../../types.ts';
import type { Frame, LessonCode, Step, TreeNode } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  stdin: { fib: '4\n' },

  snippets: {
    fib: {
      python: raw`
def fib(n):  #@call
    if n < 2:  #@basis
        return n  #@basis
    return fib(n - 1) + fib(n - 2)  #@rek

n = int(input())
print(fib(n))  #@out
`,
      java: raw`
import java.util.Scanner;

public class Main {
    static int fib(int n) {  //@call
        if (n < 2) {  //@basis
            return n;  //@basis
        }
        return fib(n - 1) + fib(n - 2);  //@rek
    }

    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        System.out.println(fib(n));  //@out
    }
}
`,
      c: raw`
#include <stdio.h>

int fib(int n) {  //@call
    if (n < 2) {  //@basis
        return n;  //@basis
    }
    return fib(n - 1) + fib(n - 2);  //@rek
}

int main(void) {
    int n;
    scanf("%d", &n);
    printf("%d\n", fib(n));  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int fib(int n) {  //@call
    if (n < 2) {  //@basis
        return n;  //@basis
    }
    return fib(n - 1) + fib(n - 2);  //@rek
}

int main() {
    int n;
    std::cin >> n;
    std::cout << fib(n) << "\n";  //@out
    return 0;
}
`,
      rust: raw`
use std::io;

fn fib(n: u32) -> u32 {  //@call
    if n < 2 {  //@basis
        return n;  //@basis
    }
    fib(n - 1) + fib(n - 2)  //@rek
}

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let n: u32 = zeile.trim().parse().unwrap();
    println!("{}", fib(n));  //@out
}
`,
    },
  },

  scenes: {
    fib: {
      title: 'Der Aufrufbaum von fib(n)',
      code: 'fib',
      params: [{ name: 'n', label: 'n', min: 1, max: 6, value: 4 }],
      build: (p): Step[] =>
        trace((t) => {
          const nodes: TreeNode[] = [];
          const stack: { id: string; n: number }[] = [];
          let counter = 0;
          let calls = 0;
          const snap = () => ({
            tree: nodes.map((x) => ({ ...x })),
            frames: [{ name: 'main', vars: {} }, ...stack.map((s): Frame => ({ name: `fib(${s.n})`, vars: { n: s.n } }))],
          });
          const setState = (id: string, state: TreeNode['state'], result?: number) => {
            const node = nodes.find((x) => x.id === id)!;
            node.state = state;
            if (result !== undefined) node.result = result;
          };

          const fib = (n: number, parent?: string): number => {
            const id = `c${counter++}`;
            calls++;
            if (parent) setState(parent, 'waiting');
            nodes.push({ id, label: `fib(${n})`, parent, state: 'active' });
            stack.push({ id, n });
            t.step('call', calls === 1 ? `Der erste Aufruf: \`fib(${n})\`. Er kommt auf den Stack und als Wurzel in den Baum.` : `Neuer Aufruf \`fib(${n})\`. Ein weiterer Bereich kommt auf den Stack; der Aufrufer wartet.`, snap());
            let result: number;
            if (n < 2) {
              result = n;
              t.step('basis', `**Basisfall:** Für n < 2 ist die Antwort ohne weitere Aufrufe klar: ${n}.`, snap());
            } else {
              t.step('rek', `Kein Basisfall. \`fib(${n})\` braucht erst \`fib(${n - 1})\` und \`fib(${n - 2})\` – zwei kleinere Versionen derselben Aufgabe.`, snap());
              const a = fib(n - 1, id);
              setState(id, 'active');
              t.step('rek', `\`fib(${n - 1})\` hat ${a} geliefert. Jetzt ist \`fib(${n - 2})\` dran.`, snap());
              const b = fib(n - 2, id);
              setState(id, 'active');
              result = a + b;
              t.step('rek', `Beide Teilergebnisse liegen vor: ${a} + ${b} = ${result}.`, snap());
            }
            setState(id, 'done', result);
            stack.pop();
            return result;
          };

          const r = fib(p.n);
          t.print(r);
          const dup = nodes.filter((x) => x.label === `fib(${Math.max(0, p.n - 2)})`).length;
          t.step(
            'out',
            `Ergebnis: ${r}, berechnet mit ${calls} Aufrufen.${p.n >= 4 ? ` Beachte, wie oft dieselbe Teilaufgabe gelöst wurde – \`fib(${p.n - 2})\` allein ${dup}-mal. Schieb den Regler auf 6 und sieh zu, wie der Baum explodiert.` : ''}`,
            snap(),
          );
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'potenz',
      title: 'Potenzen rekursiv',
      prompt:
        'Berechne `basis` hoch `exponent` **rekursiv**, ohne Schleife. Die Idee:\n\n- Basisfall: Alles hoch 0 ist 1.\n- Sonst: b hoch e ist b mal (b hoch e−1), also `basis * potenz(basis, exponent - 1)`.',
      tests: [
        { name: '2 hoch 10', stdin: '2 10\n', expected: '1024\n' },
        { name: '5 hoch 0', stdin: '5 0\n', expected: '1\n' },
        { name: '3 hoch 4', stdin: '3 4\n', expected: '81\n' },
        { name: '7 hoch 1', stdin: '7 1\n', expected: '7\n' },
      ],
      hints: ['Zuerst den Basisfall prüfen: Ist der Exponent 0, gib 1 zurück.', 'Sonst ruft die Funktion sich selbst mit einem um 1 kleineren Exponenten auf und multipliziert das Ergebnis mit der Basis.'],
      code: {
        python: raw`
def potenz(basis, exponent):
#:solution
    if exponent == 0:
        return 1
    return basis * potenz(basis, exponent - 1)
#:starter
    return basis
#:end

b, e = map(int, input().split())
print(potenz(b, e))
`,
        java: raw`
import java.util.Scanner;

public class Main {
    static long potenz(long basis, int exponent) {
//:solution
        if (exponent == 0) {
            return 1;
        }
        return basis * potenz(basis, exponent - 1);
//:starter
        return basis;
//:end
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        long b = in.nextLong();
        int e = in.nextInt();
        System.out.println(potenz(b, e));
    }
}
`,
        c: raw`
#include <stdio.h>

long long potenz(long long basis, int exponent) {
//:solution
    if (exponent == 0) {
        return 1;
    }
    return basis * potenz(basis, exponent - 1);
//:starter
    (void)exponent;
    return basis;
//:end
}

int main(void) {
    long long b;
    int e;
    scanf("%lld %d", &b, &e);
    printf("%lld\n", potenz(b, e));
    return 0;
}
`,
        cpp: raw`
#include <iostream>

long long potenz(long long basis, int exponent) {
//:solution
    if (exponent == 0) {
        return 1;
    }
    return basis * potenz(basis, exponent - 1);
//:starter
    (void)exponent;
    return basis;
//:end
}

int main() {
    long long b;
    int e;
    std::cin >> b >> e;
    std::cout << potenz(b, e) << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn potenz(basis: i64, exponent: u32) -> i64 {
//:solution
    if exponent == 0 {
        return 1;
    }
    basis * potenz(basis, exponent - 1)
//:starter
    let _ = exponent;
    basis
//:end
}

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let teile: Vec<&str> = zeile.split_whitespace().collect();
    let b: i64 = teile[0].parse().unwrap();
    let e: u32 = teile[1].parse().unwrap();
    println!("{}", potenz(b, e));
}
`,
      },
    },
    {
      kind: 'code',
      id: 'hanoi',
      title: 'Die Türme von Hanoi',
      prompt:
        'Auf Stab A liegen `n` Scheiben, nach oben hin kleiner werdend. Sie sollen auf Stab C. Es darf immer nur eine Scheibe bewegt werden, und nie eine größere auf eine kleinere. Stab B hilft.\n\nGib alle Züge aus, einen pro Zeile, z. B. `A -> C`.\n\nOhne Rekursion ist das knifflig, mit ihr sind es drei Zeilen: Um `n` Scheiben von *von* nach *nach* zu bringen,\n\n1. bringe `n − 1` Scheiben von *von* auf den *Hilfsstab*,\n2. bewege die größte Scheibe von *von* nach *nach*,\n3. bringe die `n − 1` Scheiben vom *Hilfsstab* nach *nach*.',
      tests: [
        { name: 'Eine Scheibe', stdin: '1\n', expected: 'A -> C\n' },
        { name: 'Zwei Scheiben', stdin: '2\n', expected: 'A -> B\nA -> C\nB -> C\n' },
        { name: 'Drei Scheiben', stdin: '3\n', expected: 'A -> C\nA -> B\nC -> B\nA -> C\nB -> A\nB -> C\nA -> C\n' },
      ],
      hints: [
        'Basisfall: Bei 0 Scheiben ist nichts zu tun.',
        'Schritt 1 ist ein Aufruf `hanoi(n - 1, von, hilfe, nach)` – die Rollen von Ziel und Hilfsstab sind vertauscht. Schritt 3 ist `hanoi(n - 1, hilfe, nach, von)`.',
      ],
      code: {
        python: raw`
def hanoi(n, von, nach, hilfe):
#:solution
    if n == 0:
        return
    hanoi(n - 1, von, hilfe, nach)
    print(von, "->", nach)
    hanoi(n - 1, hilfe, nach, von)
#:starter
    # Bewege n Scheiben von 'von' nach 'nach'.
    pass
#:end

hanoi(int(input()), "A", "C", "B")
`,
        java: raw`
import java.util.Scanner;

public class Main {
    static void hanoi(int n, char von, char nach, char hilfe) {
//:solution
        if (n == 0) {
            return;
        }
        hanoi(n - 1, von, hilfe, nach);
        System.out.println(von + " -> " + nach);
        hanoi(n - 1, hilfe, nach, von);
//:starter
        // Bewege n Scheiben von 'von' nach 'nach'.
//:end
    }

    public static void main(String[] args) {
        hanoi(new Scanner(System.in).nextInt(), 'A', 'C', 'B');
    }
}
`,
        c: raw`
#include <stdio.h>

void hanoi(int n, char von, char nach, char hilfe) {
//:solution
    if (n == 0) {
        return;
    }
    hanoi(n - 1, von, hilfe, nach);
    printf("%c -> %c\n", von, nach);
    hanoi(n - 1, hilfe, nach, von);
//:starter
    // Bewege n Scheiben von 'von' nach 'nach'.
    (void)n;
    (void)von;
    (void)nach;
    (void)hilfe;
//:end
}

int main(void) {
    int n;
    scanf("%d", &n);
    hanoi(n, 'A', 'C', 'B');
    return 0;
}
`,
        cpp: raw`
#include <iostream>

void hanoi(int n, char von, char nach, char hilfe) {
//:solution
    if (n == 0) {
        return;
    }
    hanoi(n - 1, von, hilfe, nach);
    std::cout << von << " -> " << nach << "\n";
    hanoi(n - 1, hilfe, nach, von);
//:starter
    // Bewege n Scheiben von 'von' nach 'nach'.
    (void)n;
    (void)von;
    (void)nach;
    (void)hilfe;
//:end
}

int main() {
    int n;
    std::cin >> n;
    hanoi(n, 'A', 'C', 'B');
    return 0;
}
`,
        rust: raw`
use std::io;

fn hanoi(n: u32, von: char, nach: char, hilfe: char) {
//:solution
    if n == 0 {
        return;
    }
    hanoi(n - 1, von, hilfe, nach);
    println!("{} -> {}", von, nach);
    hanoi(n - 1, hilfe, nach, von);
//:starter
    // Bewege n Scheiben von 'von' nach 'nach'.
    let _ = (n, von, nach, hilfe);
//:end
}

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    hanoi(zeile.trim().parse().unwrap(), 'A', 'C', 'B');
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'basisfall',
      title: 'Ohne Ausweg',
      question: 'Was passiert, wenn eine rekursive Funktion keinen erreichbaren Basisfall hat?',
      options: [
        'Sie liefert automatisch 0.',
        'Sie ruft sich endlos selbst auf, bis der Stack überläuft und das Programm abstürzt.',
        'Der Compiler fügt einen Basisfall ein.',
        'Sie läuft genau einmal.',
      ],
      correct: 1,
      explain:
        'Jeder Aufruf belegt Platz auf dem Stack, und keiner wird je beendet. Nach einigen tausend Ebenen ist der Stack voll – das hast du in der Lektion über Stack und Heap gesehen. Jede Rekursion braucht deshalb einen Basisfall **und** muss sich ihm mit jedem Aufruf nähern.',
    },
  ],
};

export default lesson;
