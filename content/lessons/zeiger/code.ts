import { raw } from '../../types.ts';
import type { Frame, LessonCode, Step } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  snippets: {
    tausch: {
      python: raw`
def tausche(feld):  #@def
    tmp = feld[0]  #@tmp
    feld[0] = feld[1]  #@a
    feld[1] = tmp  #@b

werte = [1, 2]  #@init
tausche(werte)  #@call
print(werte[0], werte[1])  #@out
`,
      java: raw`
public class Main {
    static void tausche(int[] feld) {  //@def
        int tmp = feld[0];  //@tmp
        feld[0] = feld[1];  //@a
        feld[1] = tmp;  //@b
    }

    public static void main(String[] args) {
        int[] werte = {1, 2};  //@init
        tausche(werte);  //@call
        System.out.println(werte[0] + " " + werte[1]);  //@out
    }
}
`,
      c: raw`
#include <stdio.h>

void tausche(int *a, int *b) {  //@def
    int tmp = *a;  //@tmp
    *a = *b;  //@a
    *b = tmp;  //@b
}

int main(void) {
    int x = 1;  //@init
    int y = 2;
    tausche(&x, &y);  //@call
    printf("%d %d\n", x, y);  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>

void tausche(int &a, int &b) {  //@def
    int tmp = a;  //@tmp
    a = b;  //@a
    b = tmp;  //@b
}

int main() {
    int x = 1;  //@init
    int y = 2;
    tausche(x, y);  //@call
    std::cout << x << " " << y << "\n";  //@out
    return 0;
}
`,
      rust: raw`
fn tausche(a: &mut i32, b: &mut i32) {  //@def
    let tmp = *a;  //@tmp
    *a = *b;  //@a
    *b = tmp;  //@b
}

fn main() {
    let mut x = 1;  //@init
    let mut y = 2;
    tausche(&mut x, &mut y);  //@call
    println!("{} {}", x, y);  //@out
}
`,
    },
    alias: {
      python: raw`
a = [1, 2, 3]
b = a
b.append(4)
print(len(a))

c = list(a)
c.append(5)
print(len(a))
`,
      java: raw`
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> a = new ArrayList<>(List.of(1, 2, 3));
        List<Integer> b = a;
        b.add(4);
        System.out.println(a.size());

        List<Integer> c = new ArrayList<>(a);
        c.add(5);
        System.out.println(a.size());
    }
}
`,
      c: raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    int a[5] = {1, 2, 3};
    int laenge = 3;

    int *b = a;          // b zeigt auf dasselbe Array
    b[laenge] = 4;
    laenge++;
    printf("%d\n", laenge);

    int c[6];
    memcpy(c, a, sizeof(int) * laenge);  // echte Kopie
    c[laenge] = 5;
    printf("%d\n", laenge);
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> a = {1, 2, 3};
    std::vector<int> &b = a;   // Referenz: ein zweiter Name für a
    b.push_back(4);
    std::cout << a.size() << "\n";

    std::vector<int> c = a;    // Kopie
    c.push_back(5);
    std::cout << a.size() << "\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    let mut a = vec![1, 2, 3];
    let b = &mut a;      // veränderliche Referenz auf a
    b.push(4);
    println!("{}", a.len());

    let mut c = a.clone();  // Kopie
    c.push(5);
    println!("{}", a.len());
}
`,
    },
  },

  scenes: {
    tausch: {
      title: 'Über einen Verweis fremde Daten ändern',
      code: 'tausch',
      build: (_p, lang): Step[] =>
        trace((t) => {
          if (lang === 'python' || lang === 'java') {
            const typ = lang === 'java' ? 'int[]' : 'list';
            const heap = (c: number[]) => [{ id: 'h1', label: lang === 'java' ? 'int[2]' : 'list', cells: c }];
            const r = { ref: 'h1', type: typ };
            const main = (): Frame => ({ name: 'main', vars: { werte: r } });
            t.step('init', 'Die Liste liegt auf dem Heap, `werte` enthält einen Verweis darauf.', { frames: [main()], heap: heap([1, 2]) });
            t.step(
              'def',
              `${lang === 'java' ? 'Java' : 'Python'} übergibt Argumente immer als Kopie. Kopiert wird hier aber nur der **Verweis**, nicht die Liste: \`feld\` und \`werte\` zeigen jetzt auf dasselbe Objekt.`,
              { frames: [main(), { name: 'tausche', vars: { feld: r } }], heap: heap([1, 2]) },
            );
            t.step('tmp', 'Der erste Wert wird zwischengespeichert, damit er beim Überschreiben nicht verloren geht.', {
              frames: [main(), { name: 'tausche', vars: { feld: r, tmp: 1 } }],
              heap: heap([1, 2]),
            });
            t.step('a', 'Über den Verweis wird das gemeinsame Objekt verändert.', {
              frames: [main(), { name: 'tausche', vars: { feld: r, tmp: 1 } }],
              heap: heap([2, 2]),
            });
            t.step('b', 'Der zwischengespeicherte Wert kommt an die zweite Stelle. Die Werte sind getauscht.', {
              frames: [main(), { name: 'tausche', vars: { feld: r, tmp: 1 } }],
              heap: heap([2, 1]),
            });
            t.print('2 1');
            t.step(
              'out',
              'Die Funktion ist beendet, aber die Änderung bleibt sichtbar – sie fand ja am gemeinsamen Objekt statt. Mit zwei einfachen Zahlen (`int`) würde das nicht funktionieren: Die Funktion bekäme nur Kopien der Werte.',
              { frames: [main()], heap: heap([2, 1]) },
            );
            return;
          }

          const zeiger = lang === 'c' || lang === 'rust';
          const tp = lang === 'c' ? 'int*' : lang === 'rust' ? '&mut i32' : 'int&';
          const main = (x: number, y: number): Frame => ({ name: 'main', vars: { x, y } });
          const fn = (extra: Frame['vars'] = {}): Frame => ({
            name: 'tausche',
            vars: { a: { ref: 'main.x', type: tp }, b: { ref: 'main.y', type: tp }, ...extra },
          });
          t.step('init', 'Zwei gewöhnliche Variablen in `main`, beide auf dem Stack.', { frames: [main(1, 2)] });
          t.step(
            'def',
            lang === 'c'
              ? '`&x` liefert die **Adresse** von `x`: die Nummer der Speicherstelle, an der `x` liegt. Die Funktion bekommt also nicht die Werte 1 und 2, sondern zwei Adressen. `a` und `b` sind **Zeiger** – Variablen, die eine Adresse enthalten.'
              : lang === 'cpp'
                ? 'Die Parameter sind **Referenzen** (`int&`): Sie sind keine neuen Variablen mit kopiertem Wert, sondern neue **Namen** für `x` und `y`. Wer `a` ändert, ändert `x`.'
                : '`&mut x` erzeugt eine **veränderliche Referenz**: eine Erlaubnis, `x` vorübergehend zu verändern. Die Funktion bekommt zwei solche Referenzen. Solange sie existieren, darf niemand anderes auf `x` und `y` zugreifen.',
            { frames: [main(1, 2), fn()] },
          );
          t.step(
            'tmp',
            zeiger
              ? '`*a` heißt: „Geh zur Adresse in `a` und lies den Wert dort." Das Sternchen **dereferenziert** den Zeiger. `tmp` bekommt also 1.'
              : 'Über die Referenz wird der Wert von `x` gelesen und in `tmp` zwischengespeichert.',
            { frames: [main(1, 2), fn({ tmp: 1 })] },
          );
          t.step('a', zeiger ? '`*a = *b`: Lies den Wert hinter `b` (2) und schreibe ihn an die Stelle, auf die `a` zeigt. Das ändert `x` in `main`!' : '`a = b` schreibt in Wahrheit in `x`. Schau nach unten in den Bereich von `main`.', {
            frames: [main(2, 2), fn({ tmp: 1 })],
          });
          t.step('b', 'Der zwischengespeicherte Wert landet in `y`.', { frames: [main(2, 1), fn({ tmp: 1 })] });
          t.print('2 1');
          t.step('out', 'Die Funktion konnte die Variablen ihres Aufrufers verändern – weil sie wusste, **wo** sie liegen. Ohne Zeiger oder Referenz hätte sie nur Kopien getauscht.', {
            frames: [main(2, 1)],
          });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'kopie',
      title: 'Kopie statt Verweis',
      starterBroken: true,
      prompt:
        'Das Programm liest drei Zahlen in `original`. Dann soll eine **Kopie** entstehen, deren Elemente verdoppelt werden. Ausgegeben werden zuerst das Original, dann die Kopie.\n\nErwartet für `1 2 3`:\n\n`1 2 3`\n\n`2 4 6`\n\nDer Startcode erzeugt aber keine Kopie, sondern nur einen zweiten Verweis – und verändert so das Original mit (in Rust lässt der Compiler das gar nicht erst zu). Mach daraus eine echte Kopie.',
      tests: [
        { name: '1 2 3', stdin: '1 2 3\n', expected: '1 2 3\n2 4 6\n' },
        { name: '5 0 -4', stdin: '5 0 -4\n', expected: '5 0 -4\n10 0 -8\n' },
      ],
      hints: [
        'Nur eine Zeile muss sich ändern: die, in der `kopie` entsteht.',
        'Python: `list(original)` oder `original.copy()`. Java: `original.clone()`. C: eigenes Array anlegen und Element für Element kopieren. C++: das `&` weglassen. Rust: `original.clone()`.',
      ],
      code: {
        python: raw`
original = list(map(int, input().split()))

#:solution
kopie = list(original)
#:starter
kopie = original
#:end
for i in range(len(kopie)):
    kopie[i] = kopie[i] * 2

print(*original)
print(*kopie)
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int[] original = {in.nextInt(), in.nextInt(), in.nextInt()};

//:solution
        int[] kopie = original.clone();
//:starter
        int[] kopie = original;
//:end
        for (int i = 0; i < kopie.length; i++) {
            kopie[i] = kopie[i] * 2;
        }

        System.out.println(original[0] + " " + original[1] + " " + original[2]);
        System.out.println(kopie[0] + " " + kopie[1] + " " + kopie[2]);
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int original[3];
    scanf("%d %d %d", &original[0], &original[1], &original[2]);

//:solution
    int kopie[3];
    for (int i = 0; i < 3; i++) {
        kopie[i] = original[i];
    }
//:starter
    int *kopie = original;
//:end
    for (int i = 0; i < 3; i++) {
        kopie[i] = kopie[i] * 2;
    }

    printf("%d %d %d\n", original[0], original[1], original[2]);
    printf("%d %d %d\n", kopie[0], kopie[1], kopie[2]);
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> original(3);
    std::cin >> original[0] >> original[1] >> original[2];

//:solution
    std::vector<int> kopie = original;
//:starter
    std::vector<int> &kopie = original;
//:end
    for (int &wert : kopie) {
        wert = wert * 2;
    }

    std::cout << original[0] << " " << original[1] << " " << original[2] << "\n";
    std::cout << kopie[0] << " " << kopie[1] << " " << kopie[2] << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let original: Vec<i32> = zeile.split_whitespace().map(|z| z.parse().unwrap()).collect();

//:solution
    let mut kopie = original.clone();
//:starter
    let mut kopie = original;
//:end
    for wert in kopie.iter_mut() {
        *wert = *wert * 2;
    }

    println!("{} {} {}", original[0], original[1], original[2]);
    println!("{} {} {}", kopie[0], kopie[1], kopie[2]);
}
`,
      },
    },
    {
      kind: 'predict',
      id: 'alias',
      title: 'Zwei Namen, ein Objekt',
      code: 'alias',
      expected: '4\n4\n',
      explain: {
        python:
          '`b = a` kopiert nur den Verweis – `b` ist ein zweiter Name für dieselbe Liste. Deshalb wächst auch `a` auf 4 Elemente. `list(a)` dagegen erzeugt eine neue Liste; was mit `c` passiert, berührt `a` nicht mehr.',
        java: '`b = a` kopiert nur den Verweis – beide Variablen zeigen auf dieselbe Liste, die auf 4 Elemente wächst. `new ArrayList<>(a)` erzeugt eine neue Liste; `c` ist danach unabhängig.',
        c: '`b` zeigt auf dasselbe Array wie `a`. Über `b` geschriebene Werte stehen also in `a`. `memcpy` dagegen kopiert die Bytes in ein eigenes Array `c`, das unabhängig ist.',
        cpp: 'Die Referenz `b` ist nur ein zweiter Name für `a`, also wächst `a` auf 4 Elemente. `std::vector<int> c = a;` kopiert dagegen alle Elemente in einen neuen Vektor.',
        rust: '`b` ist eine veränderliche Referenz auf `a`: Das `push` landet in `a`. `clone()` erzeugt einen neuen, unabhängigen Vektor.',
      },
    },
    {
      kind: 'quiz',
      id: 'null',
      title: 'Ein Zeiger ins Nichts',
      question: 'Was ist ein **Null-Zeiger** (`NULL`, `nullptr`, `null`, `None`)?',
      options: [
        'Ein Zeiger auf die Zahl 0.',
        'Ein Verweis, der bewusst auf gar nichts zeigt. Ihn zu dereferenzieren ist ein Fehler.',
        'Ein Zeiger, der auf sich selbst zeigt.',
        'Ein besonders schneller Zeiger.',
      ],
      correct: 1,
      explain:
        'Null steht für „hier ist (noch) nichts". Wer trotzdem hinschaut, bekommt einen Absturz oder eine `NullPointerException`. Der Erfinder der Null-Referenz nannte sie später seinen „Milliarden-Dollar-Fehler". Rust hat deshalb gar keine Null-Referenzen: „vielleicht nichts" wird dort mit `Option` ausgedrückt, und der Compiler erzwingt, dass beide Fälle behandelt werden.',
    },
  ],
};

export default lesson;
