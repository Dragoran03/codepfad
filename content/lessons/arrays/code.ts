import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  snippets: {
    liste: {
      python: raw`
punkte = [12, 7, 20]
punkte.append(15)       # hinten anhängen

print(len(punkte))
print(punkte[0])        # erstes Element
print(punkte[3])        # viertes Element

punkte[1] = 8           # Element ersetzen
for p in punkte:
    print(p)
`,
      java: raw`
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> punkte = new ArrayList<>();
        punkte.add(12);
        punkte.add(7);
        punkte.add(20);
        punkte.add(15);                     // hinten anhängen

        System.out.println(punkte.size());
        System.out.println(punkte.get(0));  // erstes Element
        System.out.println(punkte.get(3));  // viertes Element

        punkte.set(1, 8);                   // Element ersetzen
        for (int p : punkte) {
            System.out.println(p);
        }
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int punkte[10] = {12, 7, 20};  // Platz für 10, benutzt sind 3
    int anzahl = 3;

    punkte[anzahl] = 15;           // hinten anhängen – von Hand
    anzahl++;

    printf("%d\n", anzahl);
    printf("%d\n", punkte[0]);     // erstes Element
    printf("%d\n", punkte[3]);     // viertes Element

    punkte[1] = 8;                 // Element ersetzen
    for (int i = 0; i < anzahl; i++) {
        printf("%d\n", punkte[i]);
    }
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> punkte = {12, 7, 20};
    punkte.push_back(15);             // hinten anhängen

    std::cout << punkte.size() << "\n";
    std::cout << punkte[0] << "\n";   // erstes Element
    std::cout << punkte[3] << "\n";   // viertes Element

    punkte[1] = 8;                    // Element ersetzen
    for (int p : punkte) {
        std::cout << p << "\n";
    }
    return 0;
}
`,
      rust: raw`
fn main() {
    let mut punkte = vec![12, 7, 20];
    punkte.push(15);            // hinten anhängen

    println!("{}", punkte.len());
    println!("{}", punkte[0]);  // erstes Element
    println!("{}", punkte[3]);  // viertes Element

    punkte[1] = 8;              // Element ersetzen
    for p in &punkte {
        println!("{}", p);
    }
}
`,
    },
    maximum: {
      python: raw`
werte = [4, 9, 2, 7, 5]  #@init
groesster = werte[0]  #@start

for i in range(1, len(werte)):  #@kopf
    if werte[i] > groesster:  #@if
        groesster = werte[i]  #@neu

print(groesster)  #@out
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int[] werte = {4, 9, 2, 7, 5};  //@init
        int groesster = werte[0];  //@start

        for (int i = 1; i < werte.length; i++) {  //@kopf
            if (werte[i] > groesster) {  //@if
                groesster = werte[i];  //@neu
            }
        }

        System.out.println(groesster);  //@out
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int werte[5] = {4, 9, 2, 7, 5};  //@init
    int groesster = werte[0];  //@start

    for (int i = 1; i < 5; i++) {  //@kopf
        if (werte[i] > groesster) {  //@if
            groesster = werte[i];  //@neu
        }
    }

    printf("%d\n", groesster);  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> werte = {4, 9, 2, 7, 5};  //@init
    int groesster = werte[0];  //@start

    for (std::size_t i = 1; i < werte.size(); i++) {  //@kopf
        if (werte[i] > groesster) {  //@if
            groesster = werte[i];  //@neu
        }
    }

    std::cout << groesster << "\n";  //@out
    return 0;
}
`,
      rust: raw`
fn main() {
    let werte = [4, 9, 2, 7, 5];  //@init
    let mut groesster = werte[0];  //@start

    for i in 1..werte.len() {  //@kopf
        if werte[i] > groesster {  //@if
            groesster = werte[i];  //@neu
        }
    }

    println!("{}", groesster);  //@out
}
`,
    },
  },

  scenes: {
    maximum: {
      title: 'Den größten Wert finden',
      code: 'maximum',
      build: () =>
        trace((t) => {
          const werte = [4, 9, 2, 7, 5];
          const label = 'werte';
          t.step('init', 'Fünf Werte liegen direkt nebeneinander im Speicher. Unter jedem steht sein Index. Über den Index kommt man ohne Suchen sofort an jedes Element.', {
            array: { label, cells: werte },
          });
          let g = werte[0];
          let gi = 0;
          t.step('start', 'Wir merken uns den bisher größten Wert. Am Anfang kennen wir nur das erste Element – also ist es das größte.', {
            array: { label, cells: werte, done: [gi] },
            frames: [{ name: 'main', vars: { groesster: g } }],
          });
          for (let i = 1; i < werte.length; i++) {
            t.step('kopf', `Die Schleife beginnt bei Index 1, denn Index 0 kennen wir schon. Jetzt ist \`i\` gleich ${i}.`, {
              array: { label, cells: werte, pointers: { i }, hi: [i], done: [gi] },
              frames: [{ name: 'main', vars: { groesster: g, i } }],
            });
            const ja = werte[i] > g;
            t.step('if', `Ist \`werte[${i}]\`, also ${werte[i]}, größer als ${g}? ${ja ? '**Ja.**' : 'Nein, der Merker bleibt.'}`, {
              array: { label, cells: werte, pointers: { i }, hi: [i], done: [gi] },
              frames: [{ name: 'main', vars: { groesster: g, i } }],
            });
            if (ja) {
              g = werte[i];
              gi = i;
              t.step('neu', `Ein neuer Spitzenreiter: Der Merker wird auf ${g} gesetzt.`, {
                array: { label, cells: werte, pointers: { i }, done: [gi] },
                frames: [{ name: 'main', vars: { groesster: g, i } }],
              });
            }
          }
          t.print(g);
          t.step('out', 'Jedes Element wurde genau einmal angesehen. Bei fünf Werten sind das vier Vergleiche, bei einer Million Werten 999.999 – schneller geht es bei unsortierten Daten nicht.', {
            array: { label, cells: werte, done: [gi] },
            frames: [{ name: 'main', vars: { groesster: g } }],
          });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'minimum',
      title: 'Den kleinsten Wert finden',
      prompt:
        'Das Programm liest erst die Anzahl `n` und dann `n` ganze Zahlen in ein Array. Gib die **kleinste** davon aus. Der Startcode gibt einfach das erste Element aus.',
      tests: [
        { name: 'Fünf Zahlen', stdin: '5\n4 9 2 7 5\n', expected: '2\n' },
        { name: 'Eine Zahl', stdin: '1\n42\n', expected: '42\n' },
        { name: 'Negative Zahlen', stdin: '4\n-3 -8 0 5\n', expected: '-8\n' },
        { name: 'Kleinste am Ende', stdin: '3\n9 8 7\n', expected: '7\n' },
      ],
      hints: [
        'Das ist die Animation von oben, nur mit umgedrehtem Vergleich.',
        'Gehe mit einer Schleife ab Index 1 durch das Array. Ist das aktuelle Element **kleiner** als dein Merker, überschreibe ihn.',
      ],
      code: {
        python: raw`
n = int(input())
zahlen = list(map(int, input().split()))

kleinste = zahlen[0]
#:solution
for i in range(1, n):
    if zahlen[i] < kleinste:
        kleinste = zahlen[i]
#:starter
# Durchsuche die übrigen Elemente.
#:end

print(kleinste)
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] zahlen = new int[n];
        for (int i = 0; i < n; i++) {
            zahlen[i] = in.nextInt();
        }

        int kleinste = zahlen[0];
//:solution
        for (int i = 1; i < n; i++) {
            if (zahlen[i] < kleinste) {
                kleinste = zahlen[i];
            }
        }
//:starter
        // Durchsuche die übrigen Elemente.
//:end

        System.out.println(kleinste);
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int zahlen[100];
    for (int i = 0; i < n; i++) {
        scanf("%d", &zahlen[i]);
    }

    int kleinste = zahlen[0];
//:solution
    for (int i = 1; i < n; i++) {
        if (zahlen[i] < kleinste) {
            kleinste = zahlen[i];
        }
    }
//:starter
    // Durchsuche die übrigen Elemente.
//:end

    printf("%d\n", kleinste);
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> zahlen(n);
    for (int i = 0; i < n; i++) {
        std::cin >> zahlen[i];
    }

    int kleinste = zahlen[0];
//:solution
    for (int i = 1; i < n; i++) {
        if (zahlen[i] < kleinste) {
            kleinste = zahlen[i];
        }
    }
//:starter
    // Durchsuche die übrigen Elemente.
//:end

    std::cout << kleinste << "\n";
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut teile = eingabe.split_whitespace().map(|z| z.parse::<i32>().unwrap());
    let n = teile.next().unwrap() as usize;
    let zahlen: Vec<i32> = teile.take(n).collect();

//:solution
    let mut kleinste = zahlen[0];
    for i in 1..n {
        if zahlen[i] < kleinste {
            kleinste = zahlen[i];
        }
    }
//:starter
    let kleinste = zahlen[0];
    // Durchsuche die übrigen Elemente (dafür muss kleinste veränderlich sein: let mut).
//:end

    println!("{}", kleinste);
}
`,
      },
    },
    {
      kind: 'code',
      id: 'rueckwaerts',
      title: 'Rückwärts ausgeben',
      prompt:
        'Das Programm liest `n` Zahlen in ein Array. Gib sie in **umgekehrter Reihenfolge** aus, durch Leerzeichen getrennt in einer Zeile.\n\nOhne Array ginge das nicht: Du musst alle Zahlen gesehen haben, bevor du die erste ausgeben kannst.',
      tests: [
        { name: 'Vier Zahlen', stdin: '4\n1 2 3 4\n', expected: '4 3 2 1\n' },
        { name: 'Eine Zahl', stdin: '1\n7\n', expected: '7\n' },
        { name: 'Drei Zahlen', stdin: '3\n10 -5 30\n', expected: '30 -5 10\n' },
      ],
      hints: [
        'Lass die Schleifenvariable rückwärts laufen: vom letzten Index bis hinunter zu 0.',
        'Der letzte Index ist `n - 1`, nicht `n`.',
      ],
      code: {
        python: raw`
n = int(input())
zahlen = list(map(int, input().split()))

#:solution
for i in range(n - 1, -1, -1):
    print(zahlen[i], end=" ")
#:starter
# range(start, stopp, schritt) kann auch rückwärts zählen.
for i in range(0, n):
    print(zahlen[i], end=" ")
#:end
print()
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] zahlen = new int[n];
        for (int i = 0; i < n; i++) {
            zahlen[i] = in.nextInt();
        }

//:solution
        for (int i = n - 1; i >= 0; i--) {
//:starter
        for (int i = 0; i < n; i++) {
//:end
            System.out.print(zahlen[i] + " ");
        }
        System.out.println();
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int zahlen[100];
    for (int i = 0; i < n; i++) {
        scanf("%d", &zahlen[i]);
    }

//:solution
    for (int i = n - 1; i >= 0; i--) {
//:starter
    for (int i = 0; i < n; i++) {
//:end
        printf("%d ", zahlen[i]);
    }
    printf("\n");
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> zahlen(n);
    for (int i = 0; i < n; i++) {
        std::cin >> zahlen[i];
    }

//:solution
    for (int i = n - 1; i >= 0; i--) {
//:starter
    for (int i = 0; i < n; i++) {
//:end
        std::cout << zahlen[i] << " ";
    }
    std::cout << "\n";
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut teile = eingabe.split_whitespace().map(|z| z.parse::<i32>().unwrap());
    let n = teile.next().unwrap() as usize;
    let zahlen: Vec<i32> = teile.take(n).collect();

//:solution
    for i in (0..n).rev() {
//:starter
    // Ein Bereich lässt sich mit .rev() umdrehen: (0..n).rev()
    for i in 0..n {
//:end
        print!("{} ", zahlen[i]);
    }
    println!();
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'grenzen',
      title: 'Über das Ende hinaus',
      question: 'Ein Array hat 5 Elemente. Was passiert beim Zugriff auf den Index 5?',
      options: [
        'Man bekommt das letzte Element.',
        'Das Array wird automatisch um ein Element vergrößert.',
        'Python, Java und Rust brechen mit einer Fehlermeldung ab; C und C++ greifen ungeprüft auf fremden Speicher zu.',
        'In allen Sprachen kommt 0 heraus.',
      ],
      correct: 2,
      explain:
        'Gültig sind nur die Indizes 0 bis 4. Die meisten Sprachen prüfen jeden Zugriff und brechen sauber ab. C und C++ verzichten aus Geschwindigkeitsgründen auf die Prüfung: Das Programm liest oder überschreibt dann, was zufällig dahinter im Speicher liegt. Hier auf der Plattform fängt ein Prüfwerkzeug (Sanitizer) viele dieser Fälle ab – in freier Wildbahn nicht.',
    },
  ],
};

export default lesson;
