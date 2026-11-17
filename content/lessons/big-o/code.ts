import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';

const lesson: LessonCode = {
  snippets: {
    zaehlen: {
      python: raw`
n = 4
schritte = 0
for i in range(n):
    for j in range(n):
        schritte += 1
print(schritte)

schritte = 0
for i in range(n):
    for j in range(i + 1, n):
        schritte += 1
print(schritte)

schritte = 0
k = n
while k > 1:
    k //= 2
    schritte += 1
print(schritte)
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int n = 4;
        int schritte = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                schritte++;
            }
        }
        System.out.println(schritte);

        schritte = 0;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                schritte++;
            }
        }
        System.out.println(schritte);

        schritte = 0;
        for (int k = n; k > 1; k /= 2) {
            schritte++;
        }
        System.out.println(schritte);
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int n = 4;
    int schritte = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            schritte++;
        }
    }
    printf("%d\n", schritte);

    schritte = 0;
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            schritte++;
        }
    }
    printf("%d\n", schritte);

    schritte = 0;
    for (int k = n; k > 1; k /= 2) {
        schritte++;
    }
    printf("%d\n", schritte);
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    int n = 4;
    int schritte = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            schritte++;
        }
    }
    std::cout << schritte << "\n";

    schritte = 0;
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            schritte++;
        }
    }
    std::cout << schritte << "\n";

    schritte = 0;
    for (int k = n; k > 1; k /= 2) {
        schritte++;
    }
    std::cout << schritte << "\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    let n = 4;
    let mut schritte = 0;
    for _i in 0..n {
        for _j in 0..n {
            schritte += 1;
        }
    }
    println!("{}", schritte);

    schritte = 0;
    for i in 0..n {
        for _j in i + 1..n {
            schritte += 1;
        }
    }
    println!("{}", schritte);

    schritte = 0;
    let mut k = n;
    while k > 1 {
        k /= 2;
        schritte += 1;
    }
    println!("{}", schritte);
}
`,
    },
  },

  exercises: [
    {
      kind: 'predict',
      id: 'zaehlen',
      title: 'Schritte zählen',
      code: 'zaehlen',
      expected: '16\n6\n2\n',
      explain:
        'Zwei vollständig geschachtelte Schleifen laufen n · n = 16-mal: **O(n²)**. Startet die innere Schleife erst hinter `i`, werden nur die Paare gezählt – 3 + 2 + 1 + 0 = 6, also n(n−1)/2. Das ist zwar weniger, wächst aber immer noch quadratisch: ebenfalls **O(n²)**, denn konstante Faktoren wie ½ zählen nicht. Die dritte Schleife halbiert `k` jedes Mal: 4 → 2 → 1, zwei Schritte. Das ist **O(log n)**.',
    },
    {
      kind: 'code',
      id: 'duplikat',
      title: 'Doppelte Werte finden – aber schnell',
      prompt:
        'Das Programm liest `n` Zahlen und soll `ja` ausgeben, wenn mindestens eine Zahl doppelt vorkommt, sonst `nein`.\n\nDer naheliegende Weg vergleicht jedes Paar: O(n²). Schaffst du es in einem einzigen Durchlauf? Merke dir alle bisher gesehenen Zahlen in einer **Menge** (Set) oder Map – dort ist „Kenne ich die schon?" eine Frage von O(1).',
      tests: [
        { name: 'Mit Duplikat', stdin: '5\n3 8 1 8 4\n', expected: 'ja\n' },
        { name: 'Ohne Duplikat', stdin: '4\n1 2 3 4\n', expected: 'nein\n' },
        { name: 'Eine Zahl', stdin: '1\n7\n', expected: 'nein\n' },
        { name: 'Duplikat ganz hinten', stdin: '6\n10 20 30 40 50 10\n', expected: 'ja\n' },
      ],
      hints: [
        'Python: `gesehen = set()`, dann `if z in gesehen` und `gesehen.add(z)`. Java: `HashSet<Integer>`. C++: `std::unordered_set<int>`. Rust: `HashSet` – `insert` liefert `false`, wenn der Wert schon drin war.',
        'In C gibt es kein Set. Weil die Zahlen hier klein sind (unter 1000), reicht ein Array `bool gesehen[1000]`, in dem die Zahl selbst der Index ist.',
      ],
      code: {
        python: raw`
n = int(input())
zahlen = list(map(int, input().split()))

doppelt = False
#:solution
gesehen = set()
for z in zahlen:
    if z in gesehen:
        doppelt = True
        break
    gesehen.add(z)
#:starter
# Finde heraus, ob eine Zahl mehrfach vorkommt.
#:end

print("ja" if doppelt else "nein")
`,
        java: raw`
import java.util.HashSet;
import java.util.Scanner;
import java.util.Set;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] zahlen = new int[n];
        for (int i = 0; i < n; i++) {
            zahlen[i] = in.nextInt();
        }

        boolean doppelt = false;
//:solution
        Set<Integer> gesehen = new HashSet<>();
        for (int z : zahlen) {
            if (!gesehen.add(z)) {
                doppelt = true;
                break;
            }
        }
//:starter
        // Finde heraus, ob eine Zahl mehrfach vorkommt.
//:end

        System.out.println(doppelt ? "ja" : "nein");
    }
}
`,
        c: raw`
#include <stdbool.h>
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int zahlen[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &zahlen[i]);
    }

    bool doppelt = false;
    bool gesehen[1000] = {false};  // gesehen[z] ist true, sobald z vorkam
//:solution
    for (int i = 0; i < n; i++) {
        if (gesehen[zahlen[i]]) {
            doppelt = true;
            break;
        }
        gesehen[zahlen[i]] = true;
    }
//:starter
    // Finde heraus, ob eine Zahl mehrfach vorkommt.
    (void)gesehen;
//:end

    printf("%s\n", doppelt ? "ja" : "nein");
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <unordered_set>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> zahlen(n);
    for (int &z : zahlen) {
        std::cin >> z;
    }

    bool doppelt = false;
//:solution
    std::unordered_set<int> gesehen;
    for (int z : zahlen) {
        if (!gesehen.insert(z).second) {
            doppelt = true;
            break;
        }
    }
//:starter
    // Finde heraus, ob eine Zahl mehrfach vorkommt.
//:end

    std::cout << (doppelt ? "ja" : "nein") << "\n";
    return 0;
}
`,
        rust: raw`
use std::collections::HashSet;
use std::io::{self, Read};

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut t = eingabe.split_whitespace().map(|x| x.parse::<i32>().unwrap());
    let n = t.next().unwrap() as usize;
    let zahlen: Vec<i32> = t.take(n).collect();

    let mut doppelt = false;
//:solution
    let mut gesehen = HashSet::new();
    for z in &zahlen {
        if !gesehen.insert(*z) {
            doppelt = true;
            break;
        }
    }
//:starter
    // Finde heraus, ob eine Zahl mehrfach vorkommt.
    let _ = (&zahlen, &mut doppelt);
    let _: HashSet<i32> = HashSet::new();
//:end

    println!("{}", if doppelt { "ja" } else { "nein" });
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'klasse',
      title: 'Welche Klasse?',
      question: 'Ein Programm geht eine Liste einmal komplett durch und schlägt dabei für jedes Element etwas in einer Hash-Map nach. Welche Laufzeitklasse hat das insgesamt?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      correct: 2,
      explain:
        'n Durchläufe, in jedem ein Nachschlagen in O(1): zusammen n · 1 = **O(n)**. Hätte man stattdessen in jedem Durchlauf eine Liste linear durchsucht, wären es n · n = O(n²) gewesen. Die Wahl der Datenstruktur entscheidet hier über die Laufzeitklasse.',
    },
  ],
};

export default lesson;
