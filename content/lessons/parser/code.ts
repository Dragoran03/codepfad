import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';

const lesson: LessonCode = {
  // "syntaxfehler" scheitert absichtlich.
  noVerify: ['syntaxfehler'],

  snippets: {
    syntaxfehler: {
      python: raw`
preis = (2 + 3 * 4
print(preis)
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int preis = (2 + 3 * 4;
        System.out.println(preis);
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int preis = (2 + 3 * 4;
    printf("%d\n", preis);
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    int preis = (2 + 3 * 4;
    std::cout << preis << "\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    let preis = (2 + 3 * 4;
    println!("{}", preis);
}
`,
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'punkt-vor-strich',
      title: 'Punkt vor Strich',
      prompt:
        'Das Programm bekommt einen Ausdruck aus ganzen Zahlen, `+` und `*`, alles durch Leerzeichen getrennt, und soll ihn ausrechnen. Der Startcode rechnet stur von links nach rechts – `2 + 3 * 4` ergibt dann 20 statt 14.\n\nDer Parser löst das, indem er den Ausdruck als **Summe von Produkten** liest: erst alle Produkte, dann deren Summe. Baue das nach.',
      tests: [
        { name: '2 + 3 * 4', stdin: '2 + 3 * 4\n', expected: '14\n' },
        { name: '2 * 3 + 4 * 5', stdin: '2 * 3 + 4 * 5\n', expected: '26\n' },
        { name: 'Nur Plus', stdin: '1 + 2 + 3\n', expected: '6\n' },
        { name: 'Nur Mal', stdin: '2 * 3 * 4\n', expected: '24\n' },
        { name: 'Eine Zahl', stdin: '7\n', expected: '7\n' },
      ],
      hints: [
        'Merke dir zwei Werte: die `summe` der schon abgeschlossenen Produkte und das `produkt`, an dem du gerade rechnest.',
        'Bei `*` wird das laufende Produkt weiter multipliziert. Bei `+` ist das Produkt abgeschlossen: Es kommt zur Summe, und mit der nächsten Zahl beginnt ein neues. Am Ende das letzte Produkt nicht vergessen.',
      ],
      code: {
        python: raw`
teile = input().split()
#:solution
summe = 0
produkt = int(teile[0])
for i in range(1, len(teile), 2):
    op, zahl = teile[i], int(teile[i + 1])
    if op == "*":
        produkt *= zahl
    else:
        summe += produkt
        produkt = zahl
print(summe + produkt)
#:starter
ergebnis = int(teile[0])
for i in range(1, len(teile), 2):
    op, zahl = teile[i], int(teile[i + 1])
    if op == "*":
        ergebnis *= zahl
    else:
        ergebnis += zahl
print(ergebnis)
#:end
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        String[] teile = new Scanner(System.in).nextLine().trim().split("\\s+");
//:solution
        long summe = 0;
        long produkt = Long.parseLong(teile[0]);
        for (int i = 1; i < teile.length; i += 2) {
            long zahl = Long.parseLong(teile[i + 1]);
            if (teile[i].equals("*")) {
                produkt *= zahl;
            } else {
                summe += produkt;
                produkt = zahl;
            }
        }
        System.out.println(summe + produkt);
//:starter
        long ergebnis = Long.parseLong(teile[0]);
        for (int i = 1; i < teile.length; i += 2) {
            long zahl = Long.parseLong(teile[i + 1]);
            if (teile[i].equals("*")) {
                ergebnis *= zahl;
            } else {
                ergebnis += zahl;
            }
        }
        System.out.println(ergebnis);
//:end
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    long long zahl;
    char op[4];
    scanf("%lld", &zahl);
//:solution
    long long summe = 0;
    long long produkt = zahl;
    while (scanf("%3s %lld", op, &zahl) == 2) {
        if (op[0] == '*') {
            produkt *= zahl;
        } else {
            summe += produkt;
            produkt = zahl;
        }
    }
    printf("%lld\n", summe + produkt);
//:starter
    long long ergebnis = zahl;
    while (scanf("%3s %lld", op, &zahl) == 2) {
        if (op[0] == '*') {
            ergebnis *= zahl;
        } else {
            ergebnis += zahl;
        }
    }
    printf("%lld\n", ergebnis);
//:end
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <string>

int main() {
    long long zahl;
    std::string op;
    std::cin >> zahl;
//:solution
    long long summe = 0;
    long long produkt = zahl;
    while (std::cin >> op >> zahl) {
        if (op == "*") {
            produkt *= zahl;
        } else {
            summe += produkt;
            produkt = zahl;
        }
    }
    std::cout << summe + produkt << "\n";
//:starter
    long long ergebnis = zahl;
    while (std::cin >> op >> zahl) {
        if (op == "*") {
            ergebnis *= zahl;
        } else {
            ergebnis += zahl;
        }
    }
    std::cout << ergebnis << "\n";
//:end
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let teile: Vec<&str> = zeile.split_whitespace().collect();
//:solution
    let mut summe: i64 = 0;
    let mut produkt: i64 = teile[0].parse().unwrap();
    let mut i = 1;
    while i < teile.len() {
        let zahl: i64 = teile[i + 1].parse().unwrap();
        if teile[i] == "*" {
            produkt *= zahl;
        } else {
            summe += produkt;
            produkt = zahl;
        }
        i += 2;
    }
    println!("{}", summe + produkt);
//:starter
    let mut ergebnis: i64 = teile[0].parse().unwrap();
    let mut i = 1;
    while i < teile.len() {
        let zahl: i64 = teile[i + 1].parse().unwrap();
        if teile[i] == "*" {
            ergebnis *= zahl;
        } else {
            ergebnis += zahl;
        }
        i += 2;
    }
    println!("{}", ergebnis);
//:end
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'baum',
      title: 'Wo stehen die Klammern?',
      question: 'Im Syntaxbaum von `(2 + 3) * 4` – wo tauchen die Klammern auf?',
      options: [
        'Als eigene Knoten über der 2 und der 3.',
        'Gar nicht: Sie haben nur bestimmt, dass `+` tiefer im Baum hängt als `*`. Danach steckt ihre Bedeutung allein in der Form des Baums.',
        'Als Blätter ganz unten.',
        'Am obersten Knoten.',
      ],
      correct: 1,
      explain:
        'Klammern, Semikolons und Schlüsselwörter sind Hilfen für den Parser. Ist der Baum einmal gebaut, steckt die Struktur in den Kanten: Der Knoten `*` hat als linkes Kind den Knoten `+`. Deshalb heißt der Baum **abstrakter** Syntaxbaum (AST) – er lässt alles weg, was nur der Schreibweise diente.',
    },
  ],
};

export default lesson;
