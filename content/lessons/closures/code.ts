import { raw } from '../../types.ts';
import type { Frame, HeapObj, LessonCode, Step } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  snippets: {
    lambda: {
      python: raw`
def verdopple(x):
    return x * 2

f = verdopple                 # eine Funktion in einer Variable
print(f(5))

quadrat = lambda x: x * x     # eine Funktion ohne Namen
print(quadrat(5))

werte = [3, 1, 2]
print(sorted(werte, key=lambda x: -x))   # Funktion als Argument
`,
      java: raw`
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.function.IntUnaryOperator;

public class Main {
    static int verdopple(int x) {
        return x * 2;
    }

    public static void main(String[] args) {
        IntUnaryOperator f = Main::verdopple;      // eine Methode in einer Variable
        System.out.println(f.applyAsInt(5));

        IntUnaryOperator quadrat = x -> x * x;     // eine Funktion ohne Namen
        System.out.println(quadrat.applyAsInt(5));

        List<Integer> werte = new ArrayList<>(List.of(3, 1, 2));
        werte.sort(Comparator.comparing(x -> -x)); // Funktion als Argument
        System.out.println(werte);
    }
}
`,
      c: raw`
#include <stdio.h>
#include <stdlib.h>

int verdopple(int x) {
    return x * 2;
}

int quadrat(int x) {
    return x * x;
}

int absteigend(const void *a, const void *b) {
    return *(const int *)b - *(const int *)a;
}

int main(void) {
    int (*f)(int) = verdopple;   // ein Zeiger auf eine Funktion
    printf("%d\n", f(5));

    f = quadrat;                 // C kennt keine namenlosen Funktionen
    printf("%d\n", f(5));

    int werte[] = {3, 1, 2};
    qsort(werte, 3, sizeof(int), absteigend);   // Funktion als Argument
    printf("[%d, %d, %d]\n", werte[0], werte[1], werte[2]);
    return 0;
}
`,
      cpp: raw`
#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>

int verdopple(int x) {
    return x * 2;
}

int main() {
    std::function<int(int)> f = verdopple;    // eine Funktion in einer Variable
    std::cout << f(5) << "\n";

    auto quadrat = [](int x) { return x * x; };  // eine Funktion ohne Namen
    std::cout << quadrat(5) << "\n";

    std::vector<int> werte = {3, 1, 2};
    std::sort(werte.begin(), werte.end(), [](int a, int b) { return a > b; });  // Funktion als Argument
    std::cout << "[" << werte[0] << ", " << werte[1] << ", " << werte[2] << "]\n";
    return 0;
}
`,
      rust: raw`
fn verdopple(x: i32) -> i32 {
    x * 2
}

fn main() {
    let f = verdopple;              // eine Funktion in einer Variable
    println!("{}", f(5));

    let quadrat = |x: i32| x * x;   // eine Funktion ohne Namen
    println!("{}", quadrat(5));

    let mut werte = vec![3, 1, 2];
    werte.sort_by_key(|x| -x);      // Funktion als Argument
    println!("{:?}", werte);
}
`,
    },
    zaehler: {
      python: raw`
def mache_zaehler():  #@def
    stand = 0  #@init
    def zaehle():  #@inner
        nonlocal stand
        stand += 1  #@inc
        return stand
    return zaehle  #@ret

z = mache_zaehler()  #@make
print(z())  #@c1
print(z())  #@c2
`,
      java: raw`
import java.util.function.IntSupplier;

public class Main {
    static IntSupplier macheZaehler() {  //@def
        int[] stand = {0};  //@init
        IntSupplier zaehle = () -> ++stand[0];  //@inner,inc
        return zaehle;  //@ret
    }

    public static void main(String[] args) {
        IntSupplier z = macheZaehler();  //@make
        System.out.println(z.getAsInt());  //@c1
        System.out.println(z.getAsInt());  //@c2
    }
}
`,
      c: raw`
#include <stdio.h>

// C hat keine Closures. Man baut sie nach: Daten und Funktion getrennt,
// die Daten werden bei jedem Aufruf ausdrücklich mitgegeben.
struct Zaehler {
    int stand;
};

struct Zaehler mache_zaehler(void) {  //@def
    struct Zaehler z = {0};  //@init,inner
    return z;  //@ret
}

int zaehle(struct Zaehler *z) {
    z->stand += 1;  //@inc
    return z->stand;
}

int main(void) {
    struct Zaehler z = mache_zaehler();  //@make
    printf("%d\n", zaehle(&z));  //@c1
    printf("%d\n", zaehle(&z));  //@c2
    return 0;
}
`,
      cpp: raw`
#include <iostream>

auto mache_zaehler() {  //@def
    int stand = 0;  //@init
    auto zaehle = [stand]() mutable {  //@inner
        stand += 1;  //@inc
        return stand;
    };
    return zaehle;  //@ret
}

int main() {
    auto z = mache_zaehler();  //@make
    std::cout << z() << "\n";  //@c1
    std::cout << z() << "\n";  //@c2
    return 0;
}
`,
      rust: raw`
fn mache_zaehler() -> impl FnMut() -> i32 {  //@def
    let mut stand = 0;  //@init
    let zaehle = move || {  //@inner
        stand += 1;  //@inc
        stand
    };
    zaehle  //@ret
}

fn main() {
    let mut z = mache_zaehler();  //@make
    println!("{}", z());  //@c1
    println!("{}", z());  //@c2
}
`,
    },
  },

  scenes: {
    zaehler: {
      title: 'Eine Funktion mit Gedächtnis',
      code: 'zaehler',
      build: (_p, lang): Step[] =>
        trace((t) => {
          const fname = lang === 'java' ? 'macheZaehler' : 'mache_zaehler';
          const main = (vars: Frame['vars']): Frame => ({ name: 'main', vars });
          const fac = (vars: Frame['vars']): Frame => ({ name: fname, vars });

          if (lang === 'c') {
            t.step('make', '`main` ruft die Funktion auf, die einen Zähler herstellt.', { frames: [main({})] });
            t.step('init', 'Der Zähler ist ein Struct mit dem Stand 0.', { frames: [main({}), fac({ 'z.stand': 0 })] });
            t.step('ret', 'Das Struct wird an `main` zurückgegeben (kopiert).', { frames: [main({ 'z.stand': 0 })] });
            for (const [tag, n] of [['c1', 1], ['c2', 2]] as const) {
              t.step(tag, 'Aufruf von `zaehle` – mit der Adresse der Daten als ausdrücklichem Argument.', { frames: [main({ 'z.stand': n - 1 }), { name: 'zaehle', vars: { z: { ref: 'main.z.stand', type: 'struct Zaehler*' } } }] });
              t.step('inc', `Der Stand wird über den Zeiger erhöht: ${n}.`, { frames: [main({ 'z.stand': n }), { name: 'zaehle', vars: { z: { ref: 'main.z.stand', type: 'struct Zaehler*' } } }] });
              t.print(n);
              t.step(tag, `Ausgabe: ${n}.`, { frames: [main({ 'z.stand': n })] });
            }
            t.step('c2', 'Funktion und Daten bleiben in C getrennt – in anderen Sprachen verschmilzt beides zu einer **Closure**: einer Funktion, die ihre Umgebung mitnimmt. Wechsle die Sprache, um den Unterschied zu sehen.', { frames: [main({ 'z.stand': 2 })] });
            return;
          }

          const kind = lang === 'python' ? 'Funktion' : lang === 'java' ? 'Lambda' : 'Closure';
          const closure = (stand: number): HeapObj[] => [{ id: 'cl', label: `${kind}: zaehle`, cells: ['Code', `stand: ${stand}`] }];
          const r = { ref: 'cl', type: kind };
          t.step('make', '`main` ruft eine Funktion auf, die einen Zähler herstellen soll.', { frames: [main({})], heap: [] });
          t.step('init', '`stand` ist eine ganz normale lokale Variable der äußeren Funktion.', { frames: [main({}), fac({ stand: 0 })], heap: [] });
          t.step(
            'inner',
            lang === 'cpp'
              ? 'Ein Lambda entsteht. `[stand]` legt fest: Es nimmt eine **Kopie** von `stand` mit. `mutable` erlaubt, diese Kopie zu verändern.'
              : lang === 'rust'
                ? 'Eine Closure entsteht. `move` heißt: Sie übernimmt `stand` in ihren eigenen Besitz.'
                : lang === 'java'
                  ? 'Ein Lambda entsteht und **fängt** `stand` ein. Java erlaubt nur, Variablen einzufangen, die sich nicht mehr ändern – deshalb steckt der Zähler in einem Array mit einem Element: Der Verweis bleibt gleich, nur der Inhalt ändert sich.'
                  : 'Eine innere Funktion entsteht. Sie benutzt `stand` aus der äußeren Funktion – sie **fängt** die Variable ein.',
            { frames: [main({}), fac({ stand: 0, zaehle: r })], heap: closure(0) },
          );
          t.step('ret', 'Die äußere Funktion endet. Normalerweise wäre `stand` jetzt verschwunden …', { frames: [main({}), fac({ stand: 0, zaehle: r })], heap: closure(0) });
          t.step('make', '… aber die zurückgegebene Funktion hat `stand` mitgenommen. Code plus eingefangene Variablen: Das ist eine **Closure**.', { frames: [main({ z: r })], heap: closure(0) });
          for (const [tag, n] of [['c1', 1], ['c2', 2]] as const) {
            t.step(tag, `\`z\` wird aufgerufen.`, { frames: [main({ z: r }), { name: 'zaehle', vars: {} }], heap: closure(n - 1) });
            t.step('inc', `Sie erhöht **ihren** \`stand\` auf ${n}.`, { frames: [main({ z: r }), { name: 'zaehle', vars: {} }], heap: closure(n) });
            t.print(n);
            t.step(tag, n === 1 ? 'Ausgabe: 1.' : 'Ausgabe: 2. Der Zustand überlebt zwischen den Aufrufen – ohne globale Variable, und unsichtbar für den Rest des Programms.', { frames: [main({ z: r })], heap: closure(n) });
          }
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'zaehle-wenn',
      title: 'Zählen nach Regel',
      prompt:
        'Schreibe die Funktion `zaehle_wenn`: Sie bekommt eine Liste und eine **Bedingung** (eine Funktion, die für ein Element wahr oder falsch liefert) und zählt, für wie viele Elemente die Bedingung gilt.\n\nDas Hauptprogramm ruft sie zweimal auf: einmal mit „ist gerade" und einmal mit „ist größer als die eingelesene Grenze". Die zweite Bedingung ist eine Closure – sie fängt die Grenze ein.',
      tests: [
        { name: 'Grenze 4', stdin: '1 2 3 4 5 6\n4\n', expected: '3\n2\n' },
        { name: 'Grenze 0', stdin: '7 9 11\n0\n', expected: '0\n3\n' },
        { name: 'Grenze 100', stdin: '10 20\n100\n', expected: '2\n0\n' },
      ],
      hints: [
        'Eine Schleife über die Liste, ein Zähler, und für jedes Element: Rufe `bedingung(element)` auf wie jede andere Funktion.',
        'In C bekommt die Bedingung zusätzlich einen `kontext`-Zeiger. Gib ihn beim Aufruf einfach weiter: `bedingung(werte[i], kontext)`.',
      ],
      code: {
        python: raw`
def zaehle_wenn(liste, bedingung):
#:solution
    anzahl = 0
    for element in liste:
        if bedingung(element):
            anzahl += 1
    return anzahl
#:starter
    return 0
#:end

werte = list(map(int, input().split()))
grenze = int(input())

print(zaehle_wenn(werte, lambda x: x % 2 == 0))
print(zaehle_wenn(werte, lambda x: x > grenze))
`,
        java: raw`
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;
import java.util.function.IntPredicate;

public class Main {
    static int zaehleWenn(List<Integer> liste, IntPredicate bedingung) {
//:solution
        int anzahl = 0;
        for (int element : liste) {
            if (bedingung.test(element)) {
                anzahl++;
            }
        }
        return anzahl;
//:starter
        // bedingung.test(x) liefert true oder false.
        return 0;
//:end
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        List<Integer> werte = new ArrayList<>();
        for (String t : in.nextLine().trim().split("\\s+")) {
            werte.add(Integer.parseInt(t));
        }
        int grenze = in.nextInt();

        System.out.println(zaehleWenn(werte, x -> x % 2 == 0));
        System.out.println(zaehleWenn(werte, x -> x > grenze));
    }
}
`,
        c: raw`
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

// C hat keine Closures: Die Bedingung bekommt ihre "eingefangenen" Daten
// über einen zusätzlichen Zeiger namens kontext.
typedef bool (*Bedingung)(int wert, const void *kontext);

int zaehle_wenn(const int werte[], int anzahl, Bedingung bedingung, const void *kontext) {
//:solution
    int treffer = 0;
    for (int i = 0; i < anzahl; i++) {
        if (bedingung(werte[i], kontext)) {
            treffer++;
        }
    }
    return treffer;
//:starter
    (void)werte;
    (void)anzahl;
    (void)bedingung;
    (void)kontext;
    return 0;
//:end
}

bool ist_gerade(int wert, const void *kontext) {
    (void)kontext;
    return wert % 2 == 0;
}

bool groesser_als(int wert, const void *kontext) {
    int grenze = *(const int *)kontext;
    return wert > grenze;
}

int main(void) {
    char zeile[2000];
    int werte[200];
    int anzahl = 0;
    fgets(zeile, sizeof zeile, stdin);
    for (char *t = strtok(zeile, " \n"); t; t = strtok(NULL, " \n")) {
        sscanf(t, "%d", &werte[anzahl++]);
    }
    int grenze;
    scanf("%d", &grenze);

    printf("%d\n", zaehle_wenn(werte, anzahl, ist_gerade, NULL));
    printf("%d\n", zaehle_wenn(werte, anzahl, groesser_als, &grenze));
    return 0;
}
`,
        cpp: raw`
#include <functional>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int zaehle_wenn(const std::vector<int> &liste, const std::function<bool(int)> &bedingung) {
//:solution
    int anzahl = 0;
    for (int element : liste) {
        if (bedingung(element)) {
            anzahl++;
        }
    }
    return anzahl;
//:starter
    (void)liste;
    (void)bedingung;
    return 0;
//:end
}

int main() {
    std::string zeile;
    std::getline(std::cin, zeile);
    std::istringstream z(zeile);
    std::vector<int> werte;
    for (int x; z >> x;) {
        werte.push_back(x);
    }
    int grenze;
    std::cin >> grenze;

    std::cout << zaehle_wenn(werte, [](int x) { return x % 2 == 0; }) << "\n";
    std::cout << zaehle_wenn(werte, [grenze](int x) { return x > grenze; }) << "\n";
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn zaehle_wenn(liste: &[i32], bedingung: impl Fn(i32) -> bool) -> usize {
//:solution
    let mut anzahl = 0;
    for &element in liste {
        if bedingung(element) {
            anzahl += 1;
        }
    }
    anzahl
//:starter
    let _ = (liste, bedingung);
    0
//:end
}

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut zeilen = eingabe.lines();
    let werte: Vec<i32> = zeilen.next().unwrap().split_whitespace().map(|t| t.parse().unwrap()).collect();
    let grenze: i32 = zeilen.next().unwrap().trim().parse().unwrap();

    println!("{}", zaehle_wenn(&werte, |x| x % 2 == 0));
    println!("{}", zaehle_wenn(&werte, |x| x > grenze));
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'warum',
      title: 'Wozu Funktionen als Werte?',
      question: 'Was ist der größte Vorteil, einer Funktion wie `sortiere` oder `zaehle_wenn` eine andere Funktion als Argument zu geben?',
      options: [
        'Das Programm wird automatisch schneller.',
        'Der allgemeine Ablauf (sortieren, zählen) wird einmal geschrieben; das, was sich von Fall zu Fall unterscheidet, wird hineingereicht.',
        'Man braucht keine Variablen mehr.',
        'Funktionen als Argumente sind in allen Sprachen verboten.',
      ],
      correct: 1,
      explain:
        'Funktionen, die Funktionen annehmen oder zurückgeben, heißen **Funktionen höherer Ordnung**. Sie trennen das Allgemeine vom Besonderen: `sort` weiß, wie man sortiert, du sagst nur, wonach. Das ist die Grundlage für Iterator-Pipelines (nächste Lektion), für Ereignisbehandlung in Oberflächen („wenn geklickt, dann …") und für vieles mehr.',
    },
  ],
};

export default lesson;
