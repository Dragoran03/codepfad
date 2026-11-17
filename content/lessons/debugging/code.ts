import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  // "absturz" stürzt absichtlich ab.
  noVerify: ['absturz'],

  snippets: {
    absturz: {
      python: raw`
def letzter_buchstabe(wort):
    return wort[len(wort)]

def initialen(namen):
    return [letzter_buchstabe(n) for n in namen]

print(initialen(["Ada", "Linus"]))
`,
      java: raw`
public class Main {
    static char letzterBuchstabe(String wort) {
        return wort.charAt(wort.length());
    }

    static void initialen(String[] namen) {
        for (String n : namen) {
            System.out.println(letzterBuchstabe(n));
        }
    }

    public static void main(String[] args) {
        initialen(new String[] {"Ada", "Linus"});
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    char name[4] = "Ada";
    int letzte_position = 4;   // eins zu viel: gültig sind 0 bis 3
    printf("%c\n", name[letzte_position]);
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <string>
#include <vector>

char letzter_buchstabe(const std::string &wort) {
    return wort.at(wort.size());
}

int main() {
    std::vector<std::string> namen = {"Ada", "Linus"};
    for (const auto &n : namen) {
        std::cout << letzter_buchstabe(n) << "\n";
    }
    return 0;
}
`,
      rust: raw`
fn letzter_buchstabe(wort: &str) -> char {
    let zeichen: Vec<char> = wort.chars().collect();
    zeichen[zeichen.len()]
}

fn main() {
    for n in ["Ada", "Linus"] {
        println!("{}", letzter_buchstabe(n));
    }
}
`,
    },
  },

  scenes: {
    bisect: {
      title: 'Fehlersuche durch Halbieren',
      params: [{ name: 'kaputt', label: 'Fehler kam mit Version', min: 2, max: 16, value: 11 }],
      build: (p): Step[] =>
        trace((t) => {
          const n = 16;
          const cells = Array.from({ length: n }, (_, i) => `v${i + 1}`);
          const good: number[] = [0];
          const bad: number[] = [n - 1];
          let lo = 0;
          let hi = n - 1;
          let tests = 0;
          const view = (probe?: number) => ({
            array: {
              label: 'Versionen (alt → neu)',
              cells,
              showIndex: false,
              done: [...good],
              hi: probe === undefined ? [...bad] : [probe],
              dim: cells.map((_, i) => i).filter((i) => i < lo || i > hi),
              pointers: (probe === undefined ? { ok: lo, kaputt: hi } : { ok: lo, teste: probe, kaputt: hi }) as Record<string, number>,
            },
          });
          t.step(undefined, 'Version 1 hat noch funktioniert (grün), Version 16 ist kaputt (markiert). Irgendwo dazwischen kam der Fehler hinein. Alle 15 Versionen der Reihe nach zu testen, wäre mühsam.', view());
          while (hi - lo > 1) {
            const mid = Math.floor((lo + hi) / 2);
            tests++;
            t.step(undefined, `Teste die Version in der Mitte: v${mid + 1}.`, view(mid));
            if (mid + 1 >= p.kaputt) {
              bad.push(mid);
              hi = mid;
              t.step(undefined, `v${mid + 1} ist **kaputt**. Der Fehler kam also bei v${mid + 1} oder davor. Alles danach ist uninteressant.`, view());
            } else {
              good.push(mid);
              lo = mid;
              t.step(undefined, `v${mid + 1} **funktioniert**. Der Fehler kam also erst danach.`, view());
            }
          }
          t.step(undefined, `Gefunden nach nur ${tests} Tests: Der Fehler kam mit **v${hi + 1}**. Jetzt muss man nur noch die Änderungen dieser einen Version ansehen. Git automatisiert genau dieses Verfahren mit \`git bisect\`.`, view());
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'letzte-k',
      title: 'Finde den Fehler',
      prompt:
        'Die Funktion soll den Durchschnitt der **letzten `k` Werte** einer Liste berechnen (gleitender Durchschnitt, wie bei Aktienkursen). Sie liefert aber falsche Ergebnisse.\n\nFühre das Programm aus und vergleiche mit den Tests. Wenn du den Fehler nicht siehst: Gib innerhalb der Schleife aus, welche Position und welcher Wert gerade addiert wird. Das ist die einfachste und älteste Debugging-Technik.',
      tests: [
        { name: 'Letzte 2 von 5', stdin: '1 2 3 4 5\n2\n', expected: '4.5\n' },
        { name: 'Alle 3', stdin: '10 20 30\n3\n', expected: '20.0\n' },
        { name: 'Ein einziger Wert', stdin: '7\n1\n', expected: '7.0\n' },
      ],
      hints: [
        'Welche Positionen gehören zu den letzten k Werten einer Liste der Länge n? Von `n - k` bis einschließlich `n - 1`.',
        'Schau dir die obere Grenze der Schleife genau an. Ist sie ein- oder ausschließlich?',
      ],
      code: {
        python: raw`
def durchschnitt_letzte(werte, k):
    summe = 0
    n = len(werte)
#:solution
    for i in range(n - k, n):
#:starter
    for i in range(n - k, n - 1):
#:end
        summe += werte[i]
    return summe / k

werte = list(map(int, input().split()))
k = int(input())
print(f"{durchschnitt_letzte(werte, k):.1f}")
`,
        java: raw`
import java.util.Arrays;
import java.util.Scanner;

public class Main {
    static double durchschnittLetzte(int[] werte, int k) {
        double summe = 0;
        int n = werte.length;
//:solution
        for (int i = n - k; i < n; i++) {
//:starter
        for (int i = n - k; i < n - 1; i++) {
//:end
            summe += werte[i];
        }
        return summe / k;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int[] werte = Arrays.stream(in.nextLine().trim().split("\\s+")).mapToInt(Integer::parseInt).toArray();
        int k = in.nextInt();
        System.out.println(String.format("%.1f", durchschnittLetzte(werte, k)));
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

double durchschnitt_letzte(const int werte[], int n, int k) {
    double summe = 0;
//:solution
    for (int i = n - k; i < n; i++) {
//:starter
    for (int i = n - k; i < n - 1; i++) {
//:end
        summe += werte[i];
    }
    return summe / k;
}

int main(void) {
    char zeile[2000];
    int werte[200];
    int n = 0;
    fgets(zeile, sizeof zeile, stdin);
    for (char *t = strtok(zeile, " \n"); t; t = strtok(NULL, " \n")) {
        sscanf(t, "%d", &werte[n++]);
    }
    int k;
    scanf("%d", &k);
    printf("%.1f\n", durchschnitt_letzte(werte, n, k));
    return 0;
}
`,
        cpp: raw`
#include <cstdio>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

double durchschnitt_letzte(const std::vector<int> &werte, int k) {
    double summe = 0;
    int n = static_cast<int>(werte.size());
//:solution
    for (int i = n - k; i < n; i++) {
//:starter
    for (int i = n - k; i < n - 1; i++) {
//:end
        summe += werte[i];
    }
    return summe / k;
}

int main() {
    std::string zeile;
    std::getline(std::cin, zeile);
    std::istringstream z(zeile);
    std::vector<int> werte;
    for (int x; z >> x;) {
        werte.push_back(x);
    }
    int k;
    std::cin >> k;
    std::printf("%.1f\n", durchschnitt_letzte(werte, k));
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn durchschnitt_letzte(werte: &[i32], k: usize) -> f64 {
    let mut summe = 0.0;
    let n = werte.len();
//:solution
    for i in n - k..n {
//:starter
    for i in n - k..n - 1 {
//:end
        summe += werte[i] as f64;
    }
    summe / k as f64
}

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut zeilen = eingabe.lines();
    let werte: Vec<i32> = zeilen.next().unwrap().split_whitespace().map(|t| t.parse().unwrap()).collect();
    let k: usize = zeilen.next().unwrap().trim().parse().unwrap();
    println!("{:.1}", durchschnitt_letzte(&werte, k));
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'stacktrace',
      title: 'Einen Stacktrace lesen',
      question: 'Ein Programm stürzt ab und zeigt einen Stacktrace mit zehn Zeilen aus deinem Code und aus Bibliotheken. Wo fängst du am besten an?',
      options: [
        'Bei der ersten Zeile, egal woher sie stammt.',
        'Bei der Fehlermeldung selbst und dann bei der obersten Zeile, die aus **deinem eigenen** Code stammt.',
        'Bei der letzten Zeile, denn dort steht immer `main`.',
        'Stacktraces kann man nicht lesen, man sollte neu starten.',
      ],
      correct: 1,
      explain:
        'Die Meldung sagt, **was** passiert ist (z. B. `IndexError: string index out of range`). Der Stacktrace sagt, **wo**: Er listet die Kette der Aufrufe auf, die zum Fehler geführt hat. Bibliotheksfunktionen sind selten schuld – meist haben sie aus deinem Code einen ungültigen Wert bekommen. Der interessanteste Ort ist deshalb die tiefste Stelle in deinem eigenen Code. Achtung: Python zeigt den tiefsten Aufruf unten, Java oben.',
    },
    {
      kind: 'quiz',
      id: 'quietscheente',
      title: 'Die Quietscheente',
      question: 'Warum hilft es so oft, einem anderen Menschen – oder einer Quietscheente auf dem Schreibtisch – den eigenen Code Zeile für Zeile zu erklären?',
      options: [
        'Weil Enten gute Programmierer sind.',
        'Weil man beim lauten Erklären gezwungen ist, jede Annahme auszusprechen – und dabei merkt, welche davon nicht stimmt.',
        'Weil der Code dadurch schneller läuft.',
        'Es hilft nicht, das ist ein Mythos.',
      ],
      correct: 1,
      explain:
        'Beim Lesen im Kopf überspringen wir Stellen, die „offensichtlich" stimmen. Beim Erklären nicht. Diese Technik heißt tatsächlich **Rubber Duck Debugging**. Verwandt damit: den Fehler auf ein möglichst kleines Beispiel eindampfen (minimales Beispiel). Oft findet man ihn schon dabei – und wenn nicht, kann jemand anders viel leichter helfen.',
    },
  ],
};

export default lesson;
