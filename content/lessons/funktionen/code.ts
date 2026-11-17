import { raw } from '../../types.ts';
import type { Frame, LessonCode } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  snippets: {
    quadrat: {
      python: raw`
def quadrat(x):  #@def
    ergebnis = x * x  #@calc
    return ergebnis  #@ret

a = quadrat(3)  #@call1
b = quadrat(a + 1)  #@call2
print(a + b)  #@out
`,
      java: raw`
public class Main {
    static int quadrat(int x) {  //@def
        int ergebnis = x * x;  //@calc
        return ergebnis;  //@ret
    }

    public static void main(String[] args) {
        int a = quadrat(3);  //@call1
        int b = quadrat(a + 1);  //@call2
        System.out.println(a + b);  //@out
    }
}
`,
      c: raw`
#include <stdio.h>

int quadrat(int x) {  //@def
    int ergebnis = x * x;  //@calc
    return ergebnis;  //@ret
}

int main(void) {
    int a = quadrat(3);  //@call1
    int b = quadrat(a + 1);  //@call2
    printf("%d\n", a + b);  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int quadrat(int x) {  //@def
    int ergebnis = x * x;  //@calc
    return ergebnis;  //@ret
}

int main() {
    int a = quadrat(3);  //@call1
    int b = quadrat(a + 1);  //@call2
    std::cout << a + b << "\n";  //@out
    return 0;
}
`,
      rust: raw`
fn quadrat(x: i32) -> i32 {  //@def
    let ergebnis = x * x;  //@calc
    return ergebnis;  //@ret
}

fn main() {
    let a = quadrat(3);  //@call1
    let b = quadrat(a + 1);  //@call2
    println!("{}", a + b);  //@out
}
`,
    },
    verkettet: {
      python: raw`
def verdopple(x):
    return x * 2

def plus_eins(x):
    return x + 1

print(verdopple(plus_eins(3)))
print(plus_eins(verdopple(3)))
`,
      java: raw`
public class Main {
    static int verdopple(int x) {
        return x * 2;
    }

    static int plusEins(int x) {
        return x + 1;
    }

    public static void main(String[] args) {
        System.out.println(verdopple(plusEins(3)));
        System.out.println(plusEins(verdopple(3)));
    }
}
`,
      c: raw`
#include <stdio.h>

int verdopple(int x) {
    return x * 2;
}

int plus_eins(int x) {
    return x + 1;
}

int main(void) {
    printf("%d\n", verdopple(plus_eins(3)));
    printf("%d\n", plus_eins(verdopple(3)));
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int verdopple(int x) {
    return x * 2;
}

int plus_eins(int x) {
    return x + 1;
}

int main() {
    std::cout << verdopple(plus_eins(3)) << "\n";
    std::cout << plus_eins(verdopple(3)) << "\n";
    return 0;
}
`,
      rust: raw`
fn verdopple(x: i32) -> i32 {
    x * 2
}

fn plus_eins(x: i32) -> i32 {
    x + 1
}

fn main() {
    println!("{}", verdopple(plus_eins(3)));
    println!("{}", plus_eins(verdopple(3)));
}
`,
    },
  },

  scenes: {
    quadrat: {
      title: 'Ein Funktionsaufruf von innen',
      code: 'quadrat',
      build: (_p, lang) =>
        trace((t) => {
          const main = (vars: Frame['vars']): Frame => ({ name: 'main', vars });
          const anruf = (name: string, x: number, a: Frame['vars'], extra: Frame['vars'] = {}) => [main(a), { name, vars: { x, ...extra } }];
          const start = lang === 'python' ? 'Python liest zuerst die Definition von `quadrat` und merkt sie sich, ohne sie auszuführen. Das Programm beginnt mit der ersten Zeile außerhalb der Funktion.' : 'Das Programm beginnt in `main`. Die Definition von `quadrat` darüber wird nur gemerkt, nicht ausgeführt.';
          t.step('call1', `${start} Rechts vom \`=\` steht ein **Aufruf**: \`quadrat(3)\`. Bevor \`a\` einen Wert bekommt, muss die Funktion laufen.`, { frames: [main({})] });
          t.step('def', 'Der Computer springt in die Funktion. Sie bekommt einen eigenen Bereich für ihre Variablen. Der **Parameter** `x` erhält den übergebenen Wert 3.', {
            frames: anruf('quadrat', 3, {}),
          });
          t.step('calc', 'Der Rumpf läuft wie jedes andere Stück Code: 3 · 3 = 9.', { frames: anruf('quadrat', 3, {}, { ergebnis: 9 }) });
          t.step('ret', '`return` beendet die Funktion und schickt den Wert 9 zurück an die Stelle des Aufrufs.', { frames: anruf('quadrat', 3, {}, { ergebnis: 9 }) });
          t.step('call1', 'Zurück in `main`: Der Aufruf `quadrat(3)` wird durch sein Ergebnis ersetzt, `a` ist 9. Die Variablen der Funktion (`x`, `ergebnis`) sind verschwunden.', {
            frames: [main({ a: 9 })],
          });
          t.step('call2', 'Zweiter Aufruf. Das **Argument** ist diesmal ein Ausdruck. Er wird zuerst ausgerechnet: 9 + 1 = 10. Übergeben wird die 10, nicht „a + 1".', { frames: [main({ a: 9 })] });
          t.step('def', 'Wieder ein frischer Bereich, diesmal mit `x` gleich 10. Vom ersten Aufruf ist nichts übrig.', { frames: anruf('quadrat', 10, { a: 9 }) });
          t.step('calc', '10 · 10 = 100.', { frames: anruf('quadrat', 10, { a: 9 }, { ergebnis: 100 }) });
          t.step('ret', 'Der Wert 100 geht zurück.', { frames: anruf('quadrat', 10, { a: 9 }, { ergebnis: 100 }) });
          t.step('call2', '`b` ist 100.', { frames: [main({ a: 9, b: 100 })] });
          t.print(109);
          t.step('out', 'Dieselbe Funktion, zweimal benutzt, mit verschiedenen Werten. Genau dafür sind Funktionen da.', { frames: [main({ a: 9, b: 100 })] });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'maximum',
      title: 'Die größte von drei Zahlen',
      prompt:
        'Vervollständige die Funktion `groesste`. Sie bekommt drei ganze Zahlen und soll die größte davon **zurückgeben** (nicht ausgeben – das Ausgeben erledigt der vorhandene Code).',
      tests: [
        { name: '3, 9, 5', stdin: '3 9 5\n', expected: '9\n' },
        { name: '7, 2, 1', stdin: '7 2 1\n', expected: '7\n' },
        { name: '4, 4, 8', stdin: '4 4 8\n', expected: '8\n' },
        { name: 'Negative Zahlen', stdin: '-5 -2 -9\n', expected: '-2\n' },
      ],
      hints: [
        'Merke dir in einer Variable den bisher größten Wert. Starte mit `a`.',
        'Vergleiche erst mit `b`, dann mit `c`. Ist eine der beiden größer als dein Merker, überschreibe ihn. Am Ende gibst du den Merker zurück.',
      ],
      code: {
        python: raw`
def groesste(a, b, c):
#:solution
    bisher = a
    if b > bisher:
        bisher = b
    if c > bisher:
        bisher = c
    return bisher
#:starter
    # Gib die größte der drei Zahlen zurück.
    return a
#:end

a, b, c = map(int, input().split())
print(groesste(a, b, c))
`,
        java: raw`
import java.util.Scanner;

public class Main {
    static int groesste(int a, int b, int c) {
//:solution
        int bisher = a;
        if (b > bisher) {
            bisher = b;
        }
        if (c > bisher) {
            bisher = c;
        }
        return bisher;
//:starter
        // Gib die größte der drei Zahlen zurück.
        return a;
//:end
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int a = in.nextInt();
        int b = in.nextInt();
        int c = in.nextInt();
        System.out.println(groesste(a, b, c));
    }
}
`,
        c: raw`
#include <stdio.h>

int groesste(int a, int b, int c) {
//:solution
    int bisher = a;
    if (b > bisher) {
        bisher = b;
    }
    if (c > bisher) {
        bisher = c;
    }
    return bisher;
//:starter
    // Gib die größte der drei Zahlen zurück.
    (void)b;
    (void)c;
    return a;
//:end
}

int main(void) {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    printf("%d\n", groesste(a, b, c));
    return 0;
}
`,
        cpp: raw`
#include <iostream>

int groesste(int a, int b, int c) {
//:solution
    int bisher = a;
    if (b > bisher) {
        bisher = b;
    }
    if (c > bisher) {
        bisher = c;
    }
    return bisher;
//:starter
    // Gib die größte der drei Zahlen zurück.
    (void)b;
    (void)c;
    return a;
//:end
}

int main() {
    int a, b, c;
    std::cin >> a >> b >> c;
    std::cout << groesste(a, b, c) << "\n";
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn groesste(a: i32, b: i32, c: i32) -> i32 {
//:solution
    let mut bisher = a;
    if b > bisher {
        bisher = b;
    }
    if c > bisher {
        bisher = c;
    }
    bisher
//:starter
    // Gib die größte der drei Zahlen zurück.
    let _ = (b, c);
    a
//:end
}

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut zahlen = eingabe.split_whitespace().map(|z| z.parse::<i32>().unwrap());
    let a = zahlen.next().unwrap();
    let b = zahlen.next().unwrap();
    let c = zahlen.next().unwrap();
    println!("{}", groesste(a, b, c));
}
`,
      },
    },
    {
      kind: 'predict',
      id: 'verkettet',
      title: 'Von innen nach außen',
      code: 'verkettet',
      expected: '8\n7\n',
      explain:
        'Verschachtelte Aufrufe werden von innen nach außen ausgewertet. Erste Zeile: 3 + 1 = 4, dann 4 · 2 = 8. Zweite Zeile: 3 · 2 = 6, dann 6 + 1 = 7.',
    },
    {
      kind: 'quiz',
      id: 'rueckgabe',
      title: 'Zurückgeben oder ausgeben?',
      question: 'Eine Funktion berechnet einen Preis. Was ist der Unterschied, ob sie ihn am Ende **ausgibt** oder **zurückgibt**?',
      options: [
        'Keiner – beides zeigt den Wert an.',
        'Ein zurückgegebener Wert kann vom Aufrufer weiterverwendet werden; ein ausgegebener steht nur auf dem Bildschirm.',
        'Zurückgeben funktioniert nur mit Zahlen, Ausgeben auch mit Text.',
        'Ausgeben ist schneller.',
      ],
      correct: 1,
      explain:
        'Eine Ausgabe ist eine Sackgasse: Der Wert ist für das restliche Programm verloren. Ein Rückgabewert dagegen lässt sich speichern, vergleichen, weiterrechnen oder an die nächste Funktion geben. Faustregel: Funktionen berechnen und geben zurück – ausgegeben wird an einer Stelle ganz außen.',
    },
  ],
};

export default lesson;
