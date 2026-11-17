import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  // "block" scheitert in vier von fünf Sprachen absichtlich beim Kompilieren.
  noVerify: ['block'],

  snippets: {
    kopie: {
      python: raw`
def erhoehe(zahl):  #@def
    zahl = zahl + 1  #@lokal
    return zahl  #@ret

zahl = 10  #@main
neu = erhoehe(zahl)  #@call
print(zahl, neu)  #@out
`,
      java: raw`
public class Main {
    static int erhoehe(int zahl) {  //@def
        zahl = zahl + 1;  //@lokal
        return zahl;  //@ret
    }

    public static void main(String[] args) {
        int zahl = 10;  //@main
        int neu = erhoehe(zahl);  //@call
        System.out.println(zahl + " " + neu);  //@out
    }
}
`,
      c: raw`
#include <stdio.h>

int erhoehe(int zahl) {  //@def
    zahl = zahl + 1;  //@lokal
    return zahl;  //@ret
}

int main(void) {
    int zahl = 10;  //@main
    int neu = erhoehe(zahl);  //@call
    printf("%d %d\n", zahl, neu);  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int erhoehe(int zahl) {  //@def
    zahl = zahl + 1;  //@lokal
    return zahl;  //@ret
}

int main() {
    int zahl = 10;  //@main
    int neu = erhoehe(zahl);  //@call
    std::cout << zahl << " " << neu << "\n";  //@out
    return 0;
}
`,
      rust: raw`
fn erhoehe(mut zahl: i32) -> i32 {  //@def
    zahl = zahl + 1;  //@lokal
    return zahl;  //@ret
}

fn main() {
    let zahl = 10;  //@main
    let neu = erhoehe(zahl);  //@call
    println!("{} {}", zahl, neu);  //@out
}
`,
    },
    block: {
      python: raw`
if True:
    geheim = 42

print(geheim)  # klappt: Python kennt Bereiche nur für Funktionen
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        if (true) {
            int geheim = 42;
        }

        System.out.println(geheim);  // Fehler: geheim gibt es hier nicht mehr
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    if (1) {
        int geheim = 42;
    }

    printf("%d\n", geheim);  // Fehler: geheim gibt es hier nicht mehr
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    if (true) {
        int geheim = 42;
    }

    std::cout << geheim << "\n";  // Fehler: geheim gibt es hier nicht mehr
    return 0;
}
`,
      rust: raw`
fn main() {
    if true {
        let geheim = 42;
    }

    println!("{}", geheim);  // Fehler: geheim gibt es hier nicht mehr
}
`,
    },
    schatten: {
      python: raw`
def aendere():
    x = 99
    print(x)

x = 1
aendere()
print(x)
`,
      java: raw`
public class Main {
    static void aendere() {
        int x = 99;
        System.out.println(x);
    }

    public static void main(String[] args) {
        int x = 1;
        aendere();
        System.out.println(x);
    }
}
`,
      c: raw`
#include <stdio.h>

void aendere(void) {
    int x = 99;
    printf("%d\n", x);
}

int main(void) {
    int x = 1;
    aendere();
    printf("%d\n", x);
    return 0;
}
`,
      cpp: raw`
#include <iostream>

void aendere() {
    int x = 99;
    std::cout << x << "\n";
}

int main() {
    int x = 1;
    aendere();
    std::cout << x << "\n";
    return 0;
}
`,
      rust: raw`
fn aendere() {
    let x = 99;
    println!("{}", x);
}

fn main() {
    let x = 1;
    aendere();
    println!("{}", x);
}
`,
    },
  },

  scenes: {
    kopie: {
      title: 'Zwei Variablen, ein Name',
      code: 'kopie',
      build: () =>
        trace((t) => {
          t.step('main', 'In `main` entsteht die Variable `zahl` mit dem Wert 10.', { frames: [{ name: 'main', vars: { zahl: 10 } }] });
          t.step('call', '`erhoehe(zahl)` wird aufgerufen. Übergeben wird nicht die Variable selbst, sondern ihr **Wert**: die 10.', {
            frames: [{ name: 'main', vars: { zahl: 10 } }],
          });
          t.step('def', 'Die Funktion bekommt ihren eigenen Bereich. Ihr Parameter heißt zufällig auch `zahl` – es ist trotzdem eine **andere** Variable, die eine Kopie der 10 enthält.', {
            frames: [
              { name: 'main', vars: { zahl: 10 } },
              { name: 'erhoehe', vars: { zahl: 10 } },
            ],
          });
          t.step('lokal', 'Die Funktion ändert **ihre** `zahl` auf 11. Schau nach unten: Die `zahl` in `main` ist davon unberührt.', {
            frames: [
              { name: 'main', vars: { zahl: 10 } },
              { name: 'erhoehe', vars: { zahl: 11 } },
            ],
          });
          t.step('ret', 'Die 11 wird zurückgegeben. Der Bereich der Funktion wird abgeräumt, ihre `zahl` hört auf zu existieren.', {
            frames: [
              { name: 'main', vars: { zahl: 10 } },
              { name: 'erhoehe', vars: { zahl: 11 } },
            ],
          });
          t.step('call', 'Zurück in `main`: `neu` bekommt den Rückgabewert.', { frames: [{ name: 'main', vars: { zahl: 10, neu: 11 } }] });
          t.print('10 11');
          t.step('out', 'Die ursprüngliche `zahl` ist immer noch 10. Eine Funktion kann die Variablen ihres Aufrufers nicht versehentlich verändern.', {
            frames: [{ name: 'main', vars: { zahl: 10, neu: 11 } }],
          });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'summe-fix',
      title: 'Finde den Fehler',
      starterBroken: true,
      prompt:
        'Dieses Programm soll `n` Zahlen einlesen und ihre Summe ausgeben. Es tut das nicht – je nach Sprache liefert es ein falsches Ergebnis oder lässt sich gar nicht erst übersetzen.\n\nDer Fehler hat mit dem Thema dieser Lektion zu tun: Eine Variable lebt am falschen Ort. Behebe ihn.',
      tests: [
        { name: 'Drei Zahlen', stdin: '3\n4\n5\n6\n', expected: '15\n' },
        { name: 'Eine Zahl', stdin: '1\n42\n', expected: '42\n' },
        { name: 'Fünf Zahlen', stdin: '5\n1\n1\n1\n1\n1\n', expected: '5\n' },
        { name: 'Gar keine Zahl', stdin: '0\n', expected: '0\n' },
      ],
      hints: [
        'Wo wird `summe` angelegt? Wie oft läuft diese Zeile?',
        'Eine Variable, die in der Schleife angelegt wird, beginnt in jedem Durchlauf neu – und existiert hinter der Schleife nicht mehr. Lege `summe` vor der Schleife an.',
      ],
      code: {
        python: raw`
n = int(input())

#:solution
summe = 0
for i in range(n):
    zahl = int(input())
    summe = summe + zahl
#:starter
for i in range(n):
    summe = 0
    zahl = int(input())
    summe = summe + zahl
#:end

print(summe)
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();

//:solution
        int summe = 0;
        for (int i = 0; i < n; i++) {
            int zahl = in.nextInt();
            summe = summe + zahl;
        }
//:starter
        for (int i = 0; i < n; i++) {
            int summe = 0;
            int zahl = in.nextInt();
            summe = summe + zahl;
        }
//:end

        System.out.println(summe);
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

//:solution
    int summe = 0;
    for (int i = 0; i < n; i++) {
        int zahl;
        scanf("%d", &zahl);
        summe = summe + zahl;
    }
//:starter
    for (int i = 0; i < n; i++) {
        int summe = 0;
        int zahl;
        scanf("%d", &zahl);
        summe = summe + zahl;
    }
//:end

    printf("%d\n", summe);
    return 0;
}
`,
        cpp: raw`
#include <iostream>

int main() {
    int n;
    std::cin >> n;

//:solution
    int summe = 0;
    for (int i = 0; i < n; i++) {
        int zahl;
        std::cin >> zahl;
        summe = summe + zahl;
    }
//:starter
    for (int i = 0; i < n; i++) {
        int summe = 0;
        int zahl;
        std::cin >> zahl;
        summe = summe + zahl;
    }
//:end

    std::cout << summe << "\n";
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut zahlen = eingabe.split_whitespace().map(|z| z.parse::<i32>().unwrap());
    let n = zahlen.next().unwrap();

//:solution
    let mut summe = 0;
    for _ in 0..n {
        let zahl = zahlen.next().unwrap();
        summe = summe + zahl;
    }
//:starter
    for _ in 0..n {
        let mut summe = 0;
        let zahl = zahlen.next().unwrap();
        summe = summe + zahl;
    }
//:end

    println!("{}", summe);
}
`,
      },
    },
    {
      kind: 'predict',
      id: 'schatten',
      title: 'Gleicher Name, anderer Ort',
      code: 'schatten',
      expected: '99\n1\n',
      explain:
        'Das `x` in der Funktion ist eine eigene, lokale Variable. Sie hat mit dem `x` außerhalb nichts zu tun, auch wenn sie gleich heißt. Die Funktion gibt ihr eigenes `x` aus (99); das äußere bleibt 1.',
    },
    {
      kind: 'quiz',
      id: 'lebensdauer',
      title: 'Lebensdauer',
      question: 'Eine Funktion legt eine lokale Variable an. Was passiert mit dieser Variable, wenn die Funktion zurückkehrt?',
      options: [
        'Sie behält ihren Wert bis zum nächsten Aufruf der Funktion.',
        'Sie wird zu einer Variable des Aufrufers.',
        'Sie hört auf zu existieren; beim nächsten Aufruf entsteht eine neue.',
        'Sie bleibt bestehen, bis das Programm endet.',
      ],
      correct: 2,
      explain:
        'Lokale Variablen leben nur so lange wie der Aufruf, in dem sie entstanden sind. Jeder Aufruf beginnt mit einem leeren Blatt. Soll ein Wert überleben, muss die Funktion ihn zurückgeben.',
    },
  ],
};

export default lesson;
