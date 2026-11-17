import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  // "typfehler" scheitert absichtlich (in Python zur Laufzeit, sonst beim Kompilieren).
  noVerify: ['typfehler'],

  snippets: {
    typfehler: {
      python: raw`
def verdopple(x):
    return x * 2

print(verdopple(21))
print(verdopple("21"))   # kein Fehler – aber ein überraschendes Ergebnis
print(verdopple(None))   # Fehler, sobald diese Zeile läuft
`,
      java: raw`
public class Main {
    static int verdopple(int x) {
        return x * 2;
    }

    public static void main(String[] args) {
        System.out.println(verdopple(21));
        System.out.println(verdopple("21"));
    }
}
`,
      c: raw`
#include <stdio.h>

int verdopple(int x) {
    return x * 2;
}

int main(void) {
    printf("%d\n", verdopple(21));
    printf("%d\n", verdopple("21"));
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int verdopple(int x) {
    return x * 2;
}

int main() {
    std::cout << verdopple(21) << "\n";
    std::cout << verdopple("21") << "\n";
    return 0;
}
`,
      rust: raw`
fn verdopple(x: i32) -> i32 {
    x * 2
}

fn main() {
    println!("{}", verdopple(21));
    println!("{}", verdopple("21"));
}
`,
    },
    umwandeln: {
      python: raw`
print(int(3.99))
print(7 // 2)
print(7 / 2)
print(ord("A") + 1)
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        System.out.println((int) 3.99);
        System.out.println(7 / 2);
        System.out.println(7 / 2.0);
        System.out.println('A' + 1);
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    printf("%d\n", (int) 3.99);
    printf("%d\n", 7 / 2);
    printf("%.1f\n", 7 / 2.0);
    printf("%d\n", 'A' + 1);
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    std::cout << static_cast<int>(3.99) << "\n";
    std::cout << 7 / 2 << "\n";
    std::cout << 7 / 2.0 << "\n";
    std::cout << 'A' + 1 << "\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    println!("{}", 3.99_f64 as i32);
    println!("{}", 7 / 2);
    println!("{}", 7.0 / 2.0);
    println!("{}", 'A' as u32 + 1);
}
`,
    },
  },

  scenes: {
    wann: {
      title: 'Wann fällt ein Typfehler auf?',
      build: (_p, lang): Step[] => {
        if (lang === 'python') {
          const stages = [
            { label: 'Programm startet', sub: 'keine Prüfung vorab', kind: 'run' as const },
            { label: 'verdopple(21)', sub: '42 – passt', kind: 'tool' as const },
            { label: 'verdopple("21")', sub: '"2121" – kein Fehler!', kind: 'tool' as const },
            { label: 'verdopple(None)', sub: 'TypeError', kind: 'out' as const },
          ];
          return [
            { note: 'Python startet das Programm sofort. Ob die Typen zusammenpassen, prüft es erst, wenn eine Zeile tatsächlich ausgeführt wird.', pipeline: { stages, active: 0 } },
            { note: 'Der erste Aufruf funktioniert wie gedacht.', pipeline: { stages, active: 1 } },
            { note: 'Der zweite Aufruf ist wahrscheinlich ein Versehen. Aber `*` ist auch für Text definiert („wiederhole") – also kein Fehler, nur ein falsches Ergebnis, das sich unbemerkt weiter durchs Programm schleppt.', pipeline: { stages, active: 2 } },
            { note: 'Erst hier knallt es, mitten im Lauf. Läge diese Zeile in einem selten benutzten Zweig, könnte der Fehler monatelang unentdeckt bleiben. Dafür war das Schreiben schnell und flexibel.', pipeline: { stages, active: 3 } },
          ];
        }
        const stages = [
          { label: 'Quelltext', sub: 'verdopple("21")', kind: 'file' as const },
          { label: 'Compiler', sub: 'prüft alle Typen', kind: 'tool' as const },
          { label: 'Fehler', sub: 'Text ist kein int', kind: 'out' as const },
          { label: 'Programm', sub: 'startet nie', kind: 'run' as const },
        ];
        return [
          { note: 'Im Quelltext steht ein Aufruf mit Text, obwohl die Funktion eine ganze Zahl erwartet.', pipeline: { stages, active: 0 } },
          { note: 'Der Compiler kennt die Typen aller Variablen, Parameter und Rückgabewerte. Er prüft jede Zeile – auch die, die nur in seltenen Fällen laufen würden.', pipeline: { stages, active: 1 } },
          { note: 'Der Widerspruch fällt auf, bevor irgendetwas läuft. Die Fehlermeldung nennt Datei, Zeile und die beiden unverträglichen Typen.', pipeline: { stages, active: 2 } },
          { note: 'Ein Programm mit Typfehler wird gar nicht erst erzeugt. Dafür musst du beim Schreiben Typen angeben oder der Compiler muss sie herleiten können.', pipeline: { stages, active: 3 } },
        ];
      },
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'durchschnitt',
      title: 'Durchschnitt mit Nachkommastellen',
      prompt:
        'Das Programm liest `n` ganze Zahlen und gibt ihren Durchschnitt mit zwei Nachkommastellen aus. Für `1 2` sollte `1.50` herauskommen – der Startcode liefert aber `1.00`.\n\nFinde heraus, an welcher Stelle der Nachkommateil verloren geht, und sorge mit einer Typumwandlung dafür, dass mit Kommazahlen gerechnet wird.',
      tests: [
        { name: '1 und 2', stdin: '2\n1 2\n', expected: '1.50\n' },
        { name: '4, 4, 5', stdin: '3\n4 4 5\n', expected: '4.33\n' },
        { name: 'Nur 7', stdin: '1\n7\n', expected: '7.00\n' },
        { name: 'Negative Zahlen', stdin: '4\n-1 -2 -3 -4\n', expected: '-2.50\n' },
      ],
      hints: [
        'Summe und Anzahl sind ganze Zahlen. Was ergibt die Division zweier ganzer Zahlen?',
        'Wandle mindestens eine Seite **vor** der Division in eine Kommazahl um. Danach umzuwandeln ist zu spät – der Nachkommateil ist dann schon weg.',
      ],
      code: {
        python: raw`
n = int(input())
zahlen = list(map(int, input().split()))
summe = sum(zahlen)

#:solution
schnitt = summe / n
#:starter
schnitt = summe // n
#:end
print(f"{schnitt:.2f}")
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int summe = 0;
        for (int i = 0; i < n; i++) {
            summe += in.nextInt();
        }

//:solution
        double schnitt = (double) summe / n;
//:starter
        double schnitt = summe / n;
//:end
        System.out.println(String.format("%.2f", schnitt));
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int summe = 0;
    for (int i = 0; i < n; i++) {
        int z;
        scanf("%d", &z);
        summe += z;
    }

//:solution
    double schnitt = (double) summe / n;
//:starter
    double schnitt = summe / n;
//:end
    printf("%.2f\n", schnitt);
    return 0;
}
`,
        cpp: raw`
#include <iomanip>
#include <iostream>

int main() {
    int n;
    std::cin >> n;
    int summe = 0;
    for (int i = 0; i < n; i++) {
        int z;
        std::cin >> z;
        summe += z;
    }

//:solution
    double schnitt = static_cast<double>(summe) / n;
//:starter
    double schnitt = summe / n;
//:end
    std::cout << std::fixed << std::setprecision(2) << schnitt << "\n";
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut z = eingabe.split_whitespace().map(|t| t.parse::<i32>().unwrap());
    let n = z.next().unwrap();
    let summe: i32 = z.take(n as usize).sum();

//:solution
    let schnitt = summe as f64 / n as f64;
//:starter
    let schnitt = (summe / n) as f64;
//:end
    println!("{:.2}", schnitt);
}
`,
      },
    },
    {
      kind: 'predict',
      id: 'umwandeln',
      title: 'Vier Umwandlungen',
      code: 'umwandeln',
      expected: '3\n3\n3.5\n66\n',
      explain:
        'Beim Umwandeln einer Kommazahl in eine ganze Zahl wird abgeschnitten, nicht gerundet: aus 3,99 wird 3. Zwei ganze Zahlen ergeben bei der Division eine ganze Zahl. Sobald eine Kommazahl beteiligt ist, wird mit Komma gerechnet. Und ein Zeichen ist intern eine Zahl – `A` hat den Code 65.',
    },
    {
      kind: 'quiz',
      id: 'streng',
      title: 'Statisch heißt nicht streng',
      question: 'Python ist dynamisch typisiert. Trotzdem ergibt `"5" + 3` in Python einen Fehler, während JavaScript daraus stillschweigend `"53"` macht. Wie nennt man diesen Unterschied?',
      options: [
        'Kompiliert gegen interpretiert',
        'Starke gegen schwache Typisierung: Wie bereitwillig wandelt eine Sprache Typen von selbst um?',
        'Objektorientiert gegen funktional',
        'Es gibt keinen Unterschied, beide Sprachen verhalten sich gleich.',
      ],
      correct: 1,
      explain:
        'Es gibt zwei unabhängige Fragen. **Statisch oder dynamisch:** Wird beim Kompilieren oder erst zur Laufzeit geprüft? **Stark oder schwach:** Werden unpassende Typen abgelehnt oder automatisch umgewandelt? Python ist dynamisch und stark, Java statisch und ziemlich stark, C statisch, aber eher schwach (es wandelt viel stillschweigend um), Rust statisch und sehr stark.',
    },
  ],
};

export default lesson;
