import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';
import { trace } from '../../util.ts';

const START = [5, 2, 8, 1, 9, 3];

const lesson: LessonCode = {
  snippets: {
    bubble: {
      python: raw`
werte = [5, 2, 8, 1, 9, 3]  #@init
n = len(werte)
for runde in range(n - 1):  #@runde
    for i in range(n - 1 - runde):  #@loop
        if werte[i] > werte[i + 1]:  #@cmp
            werte[i], werte[i + 1] = werte[i + 1], werte[i]  #@swap
print(*werte)  #@out
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int[] werte = {5, 2, 8, 1, 9, 3};  //@init
        int n = werte.length;
        for (int runde = 0; runde < n - 1; runde++) {  //@runde
            for (int i = 0; i < n - 1 - runde; i++) {  //@loop
                if (werte[i] > werte[i + 1]) {  //@cmp
                    int tmp = werte[i];  //@swap
                    werte[i] = werte[i + 1];  //@swap
                    werte[i + 1] = tmp;  //@swap
                }
            }
        }
        for (int w : werte) {  //@out
            System.out.print(w + " ");  //@out
        }
        System.out.println();
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int werte[] = {5, 2, 8, 1, 9, 3};  //@init
    int n = 6;
    for (int runde = 0; runde < n - 1; runde++) {  //@runde
        for (int i = 0; i < n - 1 - runde; i++) {  //@loop
            if (werte[i] > werte[i + 1]) {  //@cmp
                int tmp = werte[i];  //@swap
                werte[i] = werte[i + 1];  //@swap
                werte[i + 1] = tmp;  //@swap
            }
        }
    }
    for (int i = 0; i < n; i++) {  //@out
        printf("%d ", werte[i]);  //@out
    }
    printf("\n");
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::vector<int> werte = {5, 2, 8, 1, 9, 3};  //@init
    std::size_t n = werte.size();
    for (std::size_t runde = 0; runde < n - 1; runde++) {  //@runde
        for (std::size_t i = 0; i < n - 1 - runde; i++) {  //@loop
            if (werte[i] > werte[i + 1]) {  //@cmp
                std::swap(werte[i], werte[i + 1]);  //@swap
            }
        }
    }
    for (int w : werte) {  //@out
        std::cout << w << " ";  //@out
    }
    std::cout << "\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    let mut werte = [5, 2, 8, 1, 9, 3];  //@init
    let n = werte.len();
    for runde in 0..n - 1 {  //@runde
        for i in 0..n - 1 - runde {  //@loop
            if werte[i] > werte[i + 1] {  //@cmp
                werte.swap(i, i + 1);  //@swap
            }
        }
    }
    for w in werte {  //@out
        print!("{} ", w);  //@out
    }
    println!();
}
`,
    },
    insertion: {
      python: raw`
werte = [5, 2, 8, 1, 9, 3]  #@init
for i in range(1, len(werte)):  #@outer
    aktuell = werte[i]  #@take
    j = i - 1
    while j >= 0 and werte[j] > aktuell:  #@cmp
        werte[j + 1] = werte[j]  #@shift
        j -= 1
    werte[j + 1] = aktuell  #@insert
print(*werte)  #@out
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int[] werte = {5, 2, 8, 1, 9, 3};  //@init
        for (int i = 1; i < werte.length; i++) {  //@outer
            int aktuell = werte[i];  //@take
            int j = i - 1;
            while (j >= 0 && werte[j] > aktuell) {  //@cmp
                werte[j + 1] = werte[j];  //@shift
                j--;
            }
            werte[j + 1] = aktuell;  //@insert
        }
        for (int w : werte) {  //@out
            System.out.print(w + " ");  //@out
        }
        System.out.println();
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int werte[] = {5, 2, 8, 1, 9, 3};  //@init
    int n = 6;
    for (int i = 1; i < n; i++) {  //@outer
        int aktuell = werte[i];  //@take
        int j = i - 1;
        while (j >= 0 && werte[j] > aktuell) {  //@cmp
            werte[j + 1] = werte[j];  //@shift
            j--;
        }
        werte[j + 1] = aktuell;  //@insert
    }
    for (int i = 0; i < n; i++) {  //@out
        printf("%d ", werte[i]);  //@out
    }
    printf("\n");
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> werte = {5, 2, 8, 1, 9, 3};  //@init
    for (int i = 1; i < static_cast<int>(werte.size()); i++) {  //@outer
        int aktuell = werte[i];  //@take
        int j = i - 1;
        while (j >= 0 && werte[j] > aktuell) {  //@cmp
            werte[j + 1] = werte[j];  //@shift
            j--;
        }
        werte[j + 1] = aktuell;  //@insert
    }
    for (int w : werte) {  //@out
        std::cout << w << " ";  //@out
    }
    std::cout << "\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    let mut werte = [5, 2, 8, 1, 9, 3];  //@init
    for i in 1..werte.len() {  //@outer
        let aktuell = werte[i];  //@take
        let mut j = i;
        while j > 0 && werte[j - 1] > aktuell {  //@cmp
            werte[j] = werte[j - 1];  //@shift
            j -= 1;
        }
        werte[j] = aktuell;  //@insert
    }
    for w in werte {  //@out
        print!("{} ", w);  //@out
    }
    println!();
}
`,
    },
  },

  scenes: {
    bubble: {
      title: 'Bubble Sort: Große Werte steigen auf',
      code: 'bubble',
      build: (): Step[] =>
        trace((t) => {
          const werte = [...START];
          const ids = werte.map((_, i) => i);
          const n = werte.length;
          let vergleiche = 0;
          let tausche = 0;
          const done: number[] = [];
          const view = (hi: number[] = [], note = 'werte') => ({
            array: { label: note, cells: [...werte], ids: [...ids], bars: true, hi, done: [...done] },
          });
          t.step('init', 'Sechs unsortierte Werte. Bubble Sort vergleicht immer zwei **Nachbarn** und tauscht sie, wenn sie falsch herum stehen.', view());
          for (let runde = 0; runde < n - 1; runde++) {
            t.step('runde', `Runde ${runde + 1}: einmal von links nach rechts durch den noch unsortierten Teil.`, view());
            for (let i = 0; i < n - 1 - runde; i++) {
              vergleiche++;
              const falsch = werte[i] > werte[i + 1];
              t.step('cmp', `Vergleiche ${werte[i]} und ${werte[i + 1]}: ${falsch ? 'falsch herum.' : 'passt, nichts zu tun.'}`, view([i, i + 1]));
              if (falsch) {
                tausche++;
                [werte[i], werte[i + 1]] = [werte[i + 1], werte[i]];
                [ids[i], ids[i + 1]] = [ids[i + 1], ids[i]];
                t.step('swap', 'Tauschen.', view([i, i + 1]));
              }
            }
            done.push(n - 1 - runde);
            t.step('loop', `Ende der Runde. Der größte Wert des unsortierten Teils ist ganz nach rechts „aufgestiegen" wie eine Blase – er steht endgültig richtig.`, view());
          }
          done.push(0);
          t.print(werte.join(' '));
          t.step('out', `Sortiert, mit ${vergleiche} Vergleichen und ${tausche} Vertauschungen. Bei n Werten sind es etwa n²/2 Vergleiche – bei 10.000 Werten also rund 50 Millionen.`, view());
        }),
    },
    insertion: {
      title: 'Insertion Sort: Einsortieren wie Spielkarten',
      code: 'insertion',
      build: (): Step[] =>
        trace((t) => {
          const werte = [...START];
          const ids = werte.map((_, i) => i);
          let vergleiche = 0;
          const view = (sortedUpTo: number, hi: number[] = []) => ({
            array: {
              label: 'werte',
              cells: [...werte],
              ids: [...ids],
              bars: true,
              hi,
              done: werte.map((_, k) => k).filter((k) => k <= sortedUpTo && !hi.includes(k)),
            },
          });
          t.step('init', 'Stell dir die Werte als Spielkarten vor. Die erste Karte allein ist schon „sortiert" (grün).', view(0));
          for (let i = 1; i < werte.length; i++) {
            const aktuell = werte[i];
            t.step('outer', `Die nächste Karte kommt dran: ${aktuell}.`, view(i - 1, [i]));
            t.step('take', `\`aktuell\` merkt sich die ${aktuell}. Sie wird jetzt so weit nach links geschoben, bis links von ihr nichts Größeres mehr steht.`, view(i - 1, [i]));
            let j = i;
            while (j > 0) {
              vergleiche++;
              if (werte[j - 1] > aktuell) {
                t.step('cmp', `${werte[j - 1]} ist größer als ${aktuell} …`, view(i, [j - 1, j]));
                [werte[j - 1], werte[j]] = [werte[j], werte[j - 1]];
                [ids[j - 1], ids[j]] = [ids[j], ids[j - 1]];
                t.step('shift', `… also rückt ${werte[j]} eine Stelle nach rechts.`, view(i, [j - 1]));
                j--;
              } else {
                t.step('cmp', `${werte[j - 1]} ist nicht größer als ${aktuell}. Hier ist der richtige Platz.`, view(i, [j - 1, j]));
                break;
              }
            }
            t.step('insert', `${aktuell} ist eingefügt. Die ersten ${i + 1} Werte sind jetzt sortiert.`, view(i));
          }
          t.print(werte.join(' '));
          t.step('out', `Fertig nach ${vergleiche} Vergleichen. Insertion Sort ist besonders schnell, wenn die Daten schon fast sortiert sind: Dann muss kaum eine Karte weit wandern.`, view(werte.length));
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'mischen',
      title: 'Zwei sortierte Listen verschmelzen',
      prompt:
        'Gegeben sind zwei **bereits sortierte** Listen. Füge sie zu einer sortierten Liste zusammen, ohne einfach alles neu zu sortieren.\n\nDie Idee: Zwei Zeiger stehen am Anfang der beiden Listen. Nimm jeweils den kleineren der beiden vorderen Werte, hänge ihn an das Ergebnis und rücke in dieser Liste eins weiter. Ist eine Liste leer, kommt der Rest der anderen dazu.\n\nDieser Schritt ist das Herz von **Merge Sort**, einem der schnellsten Sortierverfahren.',
      tests: [
        { name: 'Ineinander verzahnt', stdin: '1 4 7\n2 3 8 9\n', expected: '1 2 3 4 7 8 9\n' },
        { name: 'Erst die eine, dann die andere', stdin: '1 2\n5 6\n', expected: '1 2 5 6\n' },
        { name: 'Gleiche Werte', stdin: '3 3\n3\n', expected: '3 3 3\n' },
      ],
      hints: [
        'Zwei Indizes `i` und `j`, beide starten bei 0. Schleife, solange **beide** Listen noch Elemente haben.',
        'Nach der Schleife ist mindestens eine Liste aufgebraucht. Hänge den Rest der anderen an (zwei kleine Schleifen hintereinander).',
      ],
      code: {
        python: raw`
a = list(map(int, input().split()))
b = list(map(int, input().split()))

ergebnis = []
#:solution
i = j = 0
while i < len(a) and j < len(b):
    if a[i] <= b[j]:
        ergebnis.append(a[i])
        i += 1
    else:
        ergebnis.append(b[j])
        j += 1
ergebnis.extend(a[i:])
ergebnis.extend(b[j:])
#:starter
ergebnis = a + b
#:end

print(*ergebnis)
`,
        java: raw`
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class Main {
    static List<Integer> lies(String zeile) {
        List<Integer> liste = new ArrayList<>();
        for (String t : zeile.trim().split("\\s+")) {
            liste.add(Integer.parseInt(t));
        }
        return liste;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        List<Integer> a = lies(in.nextLine());
        List<Integer> b = lies(in.nextLine());

        List<Integer> ergebnis = new ArrayList<>();
//:solution
        int i = 0, j = 0;
        while (i < a.size() && j < b.size()) {
            if (a.get(i) <= b.get(j)) {
                ergebnis.add(a.get(i++));
            } else {
                ergebnis.add(b.get(j++));
            }
        }
        while (i < a.size()) {
            ergebnis.add(a.get(i++));
        }
        while (j < b.size()) {
            ergebnis.add(b.get(j++));
        }
//:starter
        ergebnis.addAll(a);
        ergebnis.addAll(b);
//:end

        StringBuilder sb = new StringBuilder();
        for (int x : ergebnis) {
            sb.append(x).append(' ');
        }
        System.out.println(sb.toString().trim());
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

int lies(int ziel[]) {
    char zeile[2000];
    int anzahl = 0;
    if (!fgets(zeile, sizeof zeile, stdin)) {
        return 0;
    }
    for (char *t = strtok(zeile, " \n"); t; t = strtok(NULL, " \n")) {
        sscanf(t, "%d", &ziel[anzahl++]);
    }
    return anzahl;
}

int main(void) {
    int a[200], b[200], ergebnis[400];
    int na = lies(a);
    int nb = lies(b);
    int n = 0;

//:solution
    int i = 0, j = 0;
    while (i < na && j < nb) {
        if (a[i] <= b[j]) {
            ergebnis[n++] = a[i++];
        } else {
            ergebnis[n++] = b[j++];
        }
    }
    while (i < na) {
        ergebnis[n++] = a[i++];
    }
    while (j < nb) {
        ergebnis[n++] = b[j++];
    }
//:starter
    for (int i = 0; i < na; i++) {
        ergebnis[n++] = a[i];
    }
    for (int j = 0; j < nb; j++) {
        ergebnis[n++] = b[j];
    }
//:end

    for (int k = 0; k < n; k++) {
        printf("%d ", ergebnis[k]);
    }
    printf("\n");
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

std::vector<int> lies() {
    std::string zeile;
    std::getline(std::cin, zeile);
    std::istringstream z(zeile);
    std::vector<int> v;
    for (int x; z >> x;) {
        v.push_back(x);
    }
    return v;
}

int main() {
    std::vector<int> a = lies();
    std::vector<int> b = lies();
    std::vector<int> ergebnis;

//:solution
    std::size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i] <= b[j]) {
            ergebnis.push_back(a[i++]);
        } else {
            ergebnis.push_back(b[j++]);
        }
    }
    while (i < a.size()) {
        ergebnis.push_back(a[i++]);
    }
    while (j < b.size()) {
        ergebnis.push_back(b[j++]);
    }
//:starter
    ergebnis.insert(ergebnis.end(), a.begin(), a.end());
    ergebnis.insert(ergebnis.end(), b.begin(), b.end());
//:end

    for (int x : ergebnis) {
        std::cout << x << " ";
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
    let mut zeilen = eingabe.lines();
    let mut lies = || -> Vec<i32> { zeilen.next().unwrap().split_whitespace().map(|t| t.parse().unwrap()).collect() };
    let a = lies();
    let b = lies();
    let mut ergebnis: Vec<i32> = Vec::new();

//:solution
    let (mut i, mut j) = (0, 0);
    while i < a.len() && j < b.len() {
        if a[i] <= b[j] {
            ergebnis.push(a[i]);
            i += 1;
        } else {
            ergebnis.push(b[j]);
            j += 1;
        }
    }
    ergebnis.extend_from_slice(&a[i..]);
    ergebnis.extend_from_slice(&b[j..]);
//:starter
    ergebnis.extend_from_slice(&a);
    ergebnis.extend_from_slice(&b);
//:end

    let teile: Vec<String> = ergebnis.iter().map(|x| x.to_string()).collect();
    println!("{}", teile.join(" "));
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'welches',
      title: 'Welches Verfahren?',
      question: 'Du sollst in einem echten Programm eine Liste mit einer Million Einträgen sortieren. Was ist die beste Wahl?',
      options: [
        'Bubble Sort selbst schreiben – er ist am einfachsten.',
        'Die Sortierfunktion der Standardbibliothek benutzen.',
        'Insertion Sort, weil er in dieser Lektion vorkam.',
        'Die Liste von Hand sortieren.',
      ],
      correct: 1,
      explain:
        'Bubble und Insertion Sort brauchen etwa n² Schritte – bei einer Million Einträgen Billionen. Die Bibliotheksfunktionen (`sorted`/`list.sort` in Python, `Arrays.sort`/`Collections.sort` in Java, `qsort` in C, `std::sort` in C++, `sort`/`sort_unstable` in Rust) nutzen Verfahren mit etwa n · log n Schritten, sind hochoptimiert und gründlich getestet. Selbst schreibt man Sortierverfahren, um sie zu verstehen – nicht, um sie zu benutzen.',
    },
    {
      kind: 'quiz',
      id: 'stabil',
      title: 'Stabil sortieren',
      question: 'Eine Liste von Personen ist bereits nach Namen sortiert. Jetzt wird sie nach Alter sortiert. Was garantiert ein **stabiles** Sortierverfahren?',
      options: [
        'Dass das Programm nicht abstürzt.',
        'Dass Personen mit gleichem Alter in ihrer bisherigen Reihenfolge bleiben – also weiterhin nach Namen sortiert sind.',
        'Dass die Liste danach nicht mehr verändert werden kann.',
        'Dass immer gleich viele Vergleiche gebraucht werden.',
      ],
      correct: 1,
      explain:
        'Stabilität heißt: Gleichwertige Elemente behalten ihre relative Reihenfolge. Damit lässt sich nach mehreren Kriterien sortieren, indem man nacheinander sortiert. Bubble, Insertion und Merge Sort sind stabil, Quicksort normalerweise nicht.',
    },
  ],
};

export default lesson;
