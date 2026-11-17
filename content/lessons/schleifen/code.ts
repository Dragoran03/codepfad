import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  stdin: { summe: '4\n' },

  snippets: {
    countdown: {
      python: raw`
zahl = 3
while zahl > 0:
    print(zahl)
    zahl = zahl - 1
print("Start!")
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int zahl = 3;
        while (zahl > 0) {
            System.out.println(zahl);
            zahl = zahl - 1;
        }
        System.out.println("Start!");
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int zahl = 3;
    while (zahl > 0) {
        printf("%d\n", zahl);
        zahl = zahl - 1;
    }
    printf("Start!\n");
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    int zahl = 3;
    while (zahl > 0) {
        std::cout << zahl << "\n";
        zahl = zahl - 1;
    }
    std::cout << "Start!\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    let mut zahl = 3;
    while zahl > 0 {
        println!("{}", zahl);
        zahl = zahl - 1;
    }
    println!("Start!");
}
`,
    },
    summe: {
      python: raw`
n = int(input())  #@lesen
summe = 0  #@init

for i in range(1, n + 1):  #@kopf
    summe = summe + i  #@rumpf

print(summe)  #@out
`,
      java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();  //@lesen
        int summe = 0;  //@init

        for (int i = 1; i <= n; i++) {  //@kopf
            summe = summe + i;  //@rumpf
        }

        System.out.println(summe);  //@out
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);  //@lesen
    int summe = 0;  //@init

    for (int i = 1; i <= n; i++) {  //@kopf
        summe = summe + i;  //@rumpf
    }

    printf("%d\n", summe);  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    int n;
    std::cin >> n;  //@lesen
    int summe = 0;  //@init

    for (int i = 1; i <= n; i++) {  //@kopf
        summe = summe + i;  //@rumpf
    }

    std::cout << summe << "\n";  //@out
    return 0;
}
`,
      rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let n: i32 = zeile.trim().parse().unwrap();  //@lesen
    let mut summe = 0;  //@init

    for i in 1..=n {  //@kopf
        summe = summe + i;  //@rumpf
    }

    println!("{}", summe);  //@out
}
`,
    },
    sprung: {
      python: raw`
for i in range(1, 7):
    if i == 3:
        continue
    if i == 5:
        break
    print(i)
print("Ende")
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        for (int i = 1; i < 7; i++) {
            if (i == 3) {
                continue;
            }
            if (i == 5) {
                break;
            }
            System.out.println(i);
        }
        System.out.println("Ende");
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    for (int i = 1; i < 7; i++) {
        if (i == 3) {
            continue;
        }
        if (i == 5) {
            break;
        }
        printf("%d\n", i);
    }
    printf("Ende\n");
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    for (int i = 1; i < 7; i++) {
        if (i == 3) {
            continue;
        }
        if (i == 5) {
            break;
        }
        std::cout << i << "\n";
    }
    std::cout << "Ende\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    for i in 1..7 {
        if i == 3 {
            continue;
        }
        if i == 5 {
            break;
        }
        println!("{}", i);
    }
    println!("Ende");
}
`,
    },
  },

  scenes: {
    summe: {
      title: 'Die Zahlen von 1 bis n addieren',
      code: 'summe',
      params: [{ name: 'n', label: 'n', min: 1, max: 8, value: 4 }],
      build: (p, lang) =>
        trace((t) => {
          const n = p.n;
          const classic = lang === 'java' || lang === 'c' || lang === 'cpp';
          let summe = 0;
          t.step('lesen', `Die Eingabe wird gelesen: \`n\` ist ${n}.`, { frames: [{ name: 'main', vars: { n } }] });
          t.step('init', 'Die Summe startet bei 0. Diese Variable muss **vor** der Schleife angelegt werden, damit sie alle Durchläufe überlebt.', {
            frames: [{ name: 'main', vars: { n, summe } }],
          });
          for (let i = 1; i <= n; i++) {
            t.step(
              'kopf',
              i === 1
                ? classic
                  ? `Der Schleifenkopf hat drei Teile: Start (\`i = 1\`), Bedingung (\`i <= n\`) und Schritt (\`i++\`, also „i um 1 erhöhen"). Zuerst der Start: \`i\` ist 1. Ist 1 <= ${n}? Ja – hinein in den Rumpf.`
                  : `Die Schleife nimmt sich der Reihe nach jede Zahl von 1 bis ${n} vor. Im ersten Durchlauf ist \`i\` gleich 1.`
                : classic
                  ? `Schritt: \`i\` wird auf ${i} erhöht. Bedingung: Ist ${i} <= ${n}? Ja – noch ein Durchlauf.`
                  : `Nächster Durchlauf: \`i\` ist jetzt ${i}.`,
              { frames: [{ name: 'main', vars: { n, summe, i } }] },
            );
            const alt = summe;
            summe += i;
            t.step('rumpf', `Der Rumpf läuft: ${alt} + ${i} = ${summe}.`, { frames: [{ name: 'main', vars: { n, summe, i } }] });
          }
          t.step(
            'kopf',
            classic
              ? `Schritt: \`i\` wird ${n + 1}. Bedingung: Ist ${n + 1} <= ${n}? **Nein.** Die Schleife ist beendet.`
              : `Es gibt keine weitere Zahl mehr. Die Schleife ist beendet.`,
            { frames: [{ name: 'main', vars: classic ? { n, summe, i: n + 1 } : { n, summe } }] },
          );
          t.print(summe);
          t.step('out', `Weiter geht es hinter der Schleife. Der Rumpf lief genau ${n}-mal.`, { frames: [{ name: 'main', vars: { n, summe } }] });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'einmaleins',
      title: 'Einmaleins-Reihe',
      prompt:
        'Das Programm liest eine Zahl `n`. Gib ihre Einmaleins-Reihe von 1 bis 10 aus, eine Rechnung pro Zeile:\n\n`7 x 1 = 7`\n\n`7 x 2 = 14`\n\nund so weiter bis `7 x 10 = 70`.',
      tests: [
        {
          name: 'Reihe der 7',
          stdin: '7\n',
          expected: '7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70\n',
        },
        {
          name: 'Reihe der 3',
          stdin: '3\n',
          expected: '3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30\n',
        },
      ],
      hints: [
        'Die vorhandene Zeile gibt die erste Rechnung aus. Sie muss zehnmal laufen – mit einem Zähler, der von 1 bis 10 geht.',
        'Ersetze die feste `1` in der Ausgabe durch die Schleifenvariable.',
      ],
      code: {
        python: raw`
n = int(input())

#:solution
for i in range(1, 11):
    print(n, "x", i, "=", n * i)
#:starter
print(n, "x", 1, "=", n * 1)
#:end
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();

//:solution
        for (int i = 1; i <= 10; i++) {
            System.out.println(n + " x " + i + " = " + n * i);
        }
//:starter
        System.out.println(n + " x " + 1 + " = " + n * 1);
//:end
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

//:solution
    for (int i = 1; i <= 10; i++) {
        printf("%d x %d = %d\n", n, i, n * i);
    }
//:starter
    printf("%d x %d = %d\n", n, 1, n * 1);
//:end
    return 0;
}
`,
        cpp: raw`
#include <iostream>

int main() {
    int n;
    std::cin >> n;

//:solution
    for (int i = 1; i <= 10; i++) {
        std::cout << n << " x " << i << " = " << n * i << "\n";
    }
//:starter
    std::cout << n << " x " << 1 << " = " << n * 1 << "\n";
//:end
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let n: i32 = zeile.trim().parse().unwrap();

//:solution
    for i in 1..=10 {
        println!("{} x {} = {}", n, i, n * i);
    }
//:starter
    println!("{} x {} = {}", n, 1, n * 1);
//:end
}
`,
      },
    },
    {
      kind: 'code',
      id: 'quersumme',
      title: 'Quersumme',
      prompt:
        'Die Quersumme einer Zahl ist die Summe ihrer Ziffern: Aus `1234` wird 1 + 2 + 3 + 4 = `10`.\n\nBerechne die Quersumme der eingelesenen Zahl. Du weißt vorher nicht, wie viele Ziffern sie hat – ein Fall für `while`.',
      tests: [
        { name: '1234', stdin: '1234\n', expected: '10\n' },
        { name: '7', stdin: '7\n', expected: '7\n' },
        { name: '90909', stdin: '90909\n', expected: '27\n' },
        { name: '100000', stdin: '100000\n', expected: '1\n' },
      ],
      hints: [
        '`zahl % 10` liefert die letzte Ziffer. Die ganzzahlige Division durch 10 schneidet sie ab.',
        'Wiederhole beides, solange die Zahl größer als 0 ist: letzte Ziffer zur Summe addieren, dann die Zahl durch 10 teilen.',
      ],
      code: {
        python: raw`
zahl = int(input())
summe = 0

#:solution
while zahl > 0:
    summe = summe + zahl % 10
    zahl = zahl // 10
#:starter
# Addiere Ziffer für Ziffer zu summe.
#:end

print(summe)
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int zahl = in.nextInt();
        int summe = 0;

//:solution
        while (zahl > 0) {
            summe = summe + zahl % 10;
            zahl = zahl / 10;
        }
//:starter
        // Addiere Ziffer für Ziffer zu summe.
//:end

        System.out.println(summe);
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int zahl;
    scanf("%d", &zahl);
    int summe = 0;

//:solution
    while (zahl > 0) {
        summe = summe + zahl % 10;
        zahl = zahl / 10;
    }
//:starter
    // Addiere Ziffer für Ziffer zu summe.
//:end

    printf("%d\n", summe);
    return 0;
}
`,
        cpp: raw`
#include <iostream>

int main() {
    int zahl;
    std::cin >> zahl;
    int summe = 0;

//:solution
    while (zahl > 0) {
        summe = summe + zahl % 10;
        zahl = zahl / 10;
    }
//:starter
    // Addiere Ziffer für Ziffer zu summe.
//:end

    std::cout << summe << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let mut zahl: i32 = zeile.trim().parse().unwrap();
    let mut summe = 0;

//:solution
    while zahl > 0 {
        summe = summe + zahl % 10;
        zahl = zahl / 10;
    }
//:starter
    // Addiere Ziffer für Ziffer zu summe.
    zahl = zahl + 0;
    summe = summe + 0;
//:end

    println!("{}", summe);
}
`,
      },
    },
    {
      kind: 'predict',
      id: 'sprung',
      title: 'Überspringen und abbrechen',
      code: 'sprung',
      expected: '1\n2\n4\nEnde\n',
      explain:
        '`continue` bricht nur den **aktuellen Durchlauf** ab und springt zum nächsten – deshalb fehlt die 3. `break` verlässt die **ganze Schleife**: Bei 5 ist Schluss, die 6 kommt nie an die Reihe.',
    },
  ],
};

export default lesson;
