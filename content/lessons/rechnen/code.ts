import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  stdin: { eingabe: 'Mia\n16\n', uhr: '135\n' },

  snippets: {
    division: {
      python: raw`
print(7 // 2)   # ganzzahlig teilen
print(7 % 2)    # Rest
print(7 / 2)    # mit Nachkommastellen
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        System.out.println(7 / 2);    // ganzzahlig teilen
        System.out.println(7 % 2);    // Rest
        System.out.println(7 / 2.0);  // mit Nachkommastellen
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    printf("%d\n", 7 / 2);      // ganzzahlig teilen
    printf("%d\n", 7 % 2);      // Rest
    printf("%.1f\n", 7 / 2.0);  // mit Nachkommastellen
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    std::cout << 7 / 2 << "\n";    // ganzzahlig teilen
    std::cout << 7 % 2 << "\n";    // Rest
    std::cout << 7 / 2.0 << "\n";  // mit Nachkommastellen
    return 0;
}
`,
      rust: raw`
fn main() {
    println!("{}", 7 / 2);      // ganzzahlig teilen
    println!("{}", 7 % 2);      // Rest
    println!("{}", 7.0 / 2.0);  // mit Nachkommastellen
}
`,
    },
    eingabe: {
      python: raw`
name = input()
alter = int(input())

print("Hallo", name)
print("Nächstes Jahr bist du", alter + 1)
`,
      java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String name = in.nextLine();
        int alter = in.nextInt();

        System.out.println("Hallo " + name);
        System.out.println("Nächstes Jahr bist du " + (alter + 1));
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    char name[50];
    int alter;
    scanf("%49s", name);
    scanf("%d", &alter);

    printf("Hallo %s\n", name);
    printf("Nächstes Jahr bist du %d\n", alter + 1);
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <string>

int main() {
    std::string name;
    int alter;
    std::cin >> name;
    std::cin >> alter;

    std::cout << "Hallo " << name << "\n";
    std::cout << "Nächstes Jahr bist du " << alter + 1 << "\n";
    return 0;
}
`,
      rust: raw`
use std::io;

fn main() {
    let mut name = String::new();
    io::stdin().read_line(&mut name).unwrap();
    let name = name.trim();

    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let alter: i32 = zeile.trim().parse().unwrap();

    println!("Hallo {}", name);
    println!("Nächstes Jahr bist du {}", alter + 1);
}
`,
    },
    uhr: {
      python: raw`
minuten = int(input())  #@lesen
stunden = minuten // 60  #@div
rest = minuten % 60  #@mod
print(stunden, "h", rest, "min")  #@out
`,
      java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int minuten = in.nextInt();  //@lesen
        int stunden = minuten / 60;  //@div
        int rest = minuten % 60;  //@mod
        System.out.println(stunden + " h " + rest + " min");  //@out
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int minuten;
    scanf("%d", &minuten);  //@lesen
    int stunden = minuten / 60;  //@div
    int rest = minuten % 60;  //@mod
    printf("%d h %d min\n", stunden, rest);  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    int minuten;
    std::cin >> minuten;  //@lesen
    int stunden = minuten / 60;  //@div
    int rest = minuten % 60;  //@mod
    std::cout << stunden << " h " << rest << " min\n";  //@out
    return 0;
}
`,
      rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let minuten: i32 = zeile.trim().parse().unwrap();  //@lesen
    let stunden = minuten / 60;  //@div
    let rest = minuten % 60;  //@mod
    println!("{} h {} min", stunden, rest);  //@out
}
`,
    },
    vorrang: {
      python: raw`
print(17 // 5)
print(17 % 5)
print(2 + 3 * 4)
print((2 + 3) * 4)
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        System.out.println(17 / 5);
        System.out.println(17 % 5);
        System.out.println(2 + 3 * 4);
        System.out.println((2 + 3) * 4);
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    printf("%d\n", 17 / 5);
    printf("%d\n", 17 % 5);
    printf("%d\n", 2 + 3 * 4);
    printf("%d\n", (2 + 3) * 4);
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    std::cout << 17 / 5 << "\n";
    std::cout << 17 % 5 << "\n";
    std::cout << 2 + 3 * 4 << "\n";
    std::cout << (2 + 3) * 4 << "\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    println!("{}", 17 / 5);
    println!("{}", 17 % 5);
    println!("{}", 2 + 3 * 4);
    println!("{}", (2 + 3) * 4);
}
`,
    },
  },

  scenes: {
    uhr: {
      title: 'Minuten in Stunden und Minuten zerlegen',
      code: 'uhr',
      params: [{ name: 'minuten', label: 'Eingabe', min: 0, max: 300, value: 135 }],
      build: (p, lang) =>
        trace((t) => {
          const m = p.minuten;
          const h = Math.floor(m / 60);
          const r = m % 60;
          const div = lang === 'python' ? '//' : '/';
          t.step('lesen', `Das Programm liest die Eingabe \`${m}\` und wandelt den Text in eine ganze Zahl um.`, {
            frames: [{ name: 'main', vars: { minuten: m } }],
          });
          t.step(
            'div',
            `Ganzzahlige Division: Wie oft passt 60 **vollständig** in ${m}? ${h}-mal. Alles hinter dem Komma fällt weg – es wird nicht gerundet.${lang === 'python' ? '' : ' Weil beide Seiten ganze Zahlen sind, rechnet `/` hier automatisch ganzzahlig.'}`,
            { frames: [{ name: 'main', vars: { minuten: m, stunden: h } }] },
          );
          t.step('mod', `Der Rest-Operator \`%\` liefert, was bei dieser Division übrig bleibt: ${m} − ${h} · 60 = ${r}.`, {
            frames: [{ name: 'main', vars: { minuten: m, stunden: h, rest: r } }],
          });
          t.print(`${h} h ${r} min`);
          t.step('out', `\`${div}\` und \`%\` gehören zusammen: Das eine liefert die ganzen Pakete, das andere den Rest. Verschiebe oben den Regler und beobachte beide Werte.`, {
            frames: [{ name: 'main', vars: { minuten: m, stunden: h, rest: r } }],
          });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'wechselgeld',
      title: 'Cent in Euro umrechnen',
      prompt:
        'Das Programm liest einen Betrag in Cent ein. Zerlege ihn in ganze Euro und übrige Cent.\n\nBeispiel: Aus `345` wird `3 Euro und 45 Cent`.',
      tests: [
        { name: '345 Cent', stdin: '345\n', expected: '3 Euro und 45 Cent\n' },
        { name: '99 Cent', stdin: '99\n', expected: '0 Euro und 99 Cent\n' },
        { name: '1200 Cent', stdin: '1200\n', expected: '12 Euro und 0 Cent\n' },
      ],
      hints: [
        'Ein Euro sind 100 Cent. Wie oft passt 100 vollständig in den Betrag?',
        'Ganzzahlige Division liefert die Euro, der Rest-Operator `%` die übrigen Cent.',
      ],
      code: {
        python: raw`
betrag = int(input())

#:solution
euro = betrag // 100
cent = betrag % 100
#:starter
# Berechne euro und cent aus betrag.
euro = 0
cent = 0
#:end

print(euro, "Euro und", cent, "Cent")
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int betrag = in.nextInt();

//:solution
        int euro = betrag / 100;
        int cent = betrag % 100;
//:starter
        // Berechne euro und cent aus betrag.
        int euro = 0;
        int cent = 0;
//:end

        System.out.println(euro + " Euro und " + cent + " Cent");
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int betrag;
    scanf("%d", &betrag);

//:solution
    int euro = betrag / 100;
    int cent = betrag % 100;
//:starter
    // Berechne euro und cent aus betrag.
    int euro = 0;
    int cent = 0;
//:end

    printf("%d Euro und %d Cent\n", euro, cent);
    return 0;
}
`,
        cpp: raw`
#include <iostream>

int main() {
    int betrag;
    std::cin >> betrag;

//:solution
    int euro = betrag / 100;
    int cent = betrag % 100;
//:starter
    // Berechne euro und cent aus betrag.
    int euro = 0;
    int cent = 0;
//:end

    std::cout << euro << " Euro und " << cent << " Cent\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let betrag: i32 = zeile.trim().parse().unwrap();

//:solution
    let euro = betrag / 100;
    let cent = betrag % 100;
//:starter
    // Berechne euro und cent aus betrag.
    let euro = 0;
    let cent = 0;
//:end

    println!("{} Euro und {} Cent", euro, cent);
}
`,
      },
    },
    {
      kind: 'predict',
      id: 'vorrang',
      title: 'Vier Rechnungen',
      code: 'vorrang',
      expected: '3\n2\n14\n20\n',
      explain:
        '17 geteilt durch 5 ist 3 Rest 2. Wie in der Schule gilt Punkt vor Strich: `2 + 3 * 4` rechnet zuerst 3 · 4. Klammern ändern die Reihenfolge.',
    },
    {
      kind: 'quiz',
      id: 'ganzzahl',
      title: 'Halbe Sachen',
      question: 'In Java, C, C++ und Rust: Was ergibt `7 / 2`, wenn beide Zahlen ganze Zahlen sind?',
      options: ['`3.5`', '`3`', '`4`', 'Einen Fehler'],
      correct: 1,
      explain:
        'Zwei ganze Zahlen ergeben wieder eine ganze Zahl – der Nachkommateil wird abgeschnitten, nicht gerundet. Soll `3.5` herauskommen, muss mindestens eine Seite eine Kommazahl sein: `7 / 2.0`. Python trennt die beiden Fälle mit zwei Operatoren: `/` rechnet immer mit Komma, `//` immer ganzzahlig.',
    },
  ],
};

export default lesson;
