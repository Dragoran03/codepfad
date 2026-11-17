import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';
import { trace } from '../../util.ts';

const WERTE = [2, 5, 8, 12, 16, 23, 38, 42, 56, 61, 72, 85, 91, 97, 99];

const lesson: LessonCode = {
  stdin: { binaer: '72\n' },

  snippets: {
    binaer: {
      python: raw`
werte = [2, 5, 8, 12, 16, 23, 38, 42, 56, 61, 72, 85, 91, 97, 99]
ziel = int(input())

links, rechts = 0, len(werte) - 1  #@init
while links <= rechts:  #@loop
    mitte = (links + rechts) // 2  #@mitte
    if werte[mitte] == ziel:  #@cmp
        print(mitte)  #@found
        break
    elif werte[mitte] < ziel:  #@cmp
        links = mitte + 1  #@rechts
    else:
        rechts = mitte - 1  #@links
else:
    print(-1)  #@none
`,
      java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        int[] werte = {2, 5, 8, 12, 16, 23, 38, 42, 56, 61, 72, 85, 91, 97, 99};
        int ziel = new Scanner(System.in).nextInt();

        int links = 0, rechts = werte.length - 1;  //@init
        int gefunden = -1;
        while (links <= rechts) {  //@loop
            int mitte = (links + rechts) / 2;  //@mitte
            if (werte[mitte] == ziel) {  //@cmp
                gefunden = mitte;  //@found
                break;
            } else if (werte[mitte] < ziel) {  //@cmp
                links = mitte + 1;  //@rechts
            } else {
                rechts = mitte - 1;  //@links
            }
        }
        System.out.println(gefunden);  //@found,none
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int werte[] = {2, 5, 8, 12, 16, 23, 38, 42, 56, 61, 72, 85, 91, 97, 99};
    int ziel;
    scanf("%d", &ziel);

    int links = 0, rechts = 14;  //@init
    int gefunden = -1;
    while (links <= rechts) {  //@loop
        int mitte = (links + rechts) / 2;  //@mitte
        if (werte[mitte] == ziel) {  //@cmp
            gefunden = mitte;  //@found
            break;
        } else if (werte[mitte] < ziel) {  //@cmp
            links = mitte + 1;  //@rechts
        } else {
            rechts = mitte - 1;  //@links
        }
    }
    printf("%d\n", gefunden);  //@found,none
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> werte = {2, 5, 8, 12, 16, 23, 38, 42, 56, 61, 72, 85, 91, 97, 99};
    int ziel;
    std::cin >> ziel;

    int links = 0, rechts = static_cast<int>(werte.size()) - 1;  //@init
    int gefunden = -1;
    while (links <= rechts) {  //@loop
        int mitte = (links + rechts) / 2;  //@mitte
        if (werte[mitte] == ziel) {  //@cmp
            gefunden = mitte;  //@found
            break;
        } else if (werte[mitte] < ziel) {  //@cmp
            links = mitte + 1;  //@rechts
        } else {
            rechts = mitte - 1;  //@links
        }
    }
    std::cout << gefunden << "\n";  //@found,none
    return 0;
}
`,
      rust: raw`
use std::io;

fn main() {
    let werte = [2, 5, 8, 12, 16, 23, 38, 42, 56, 61, 72, 85, 91, 97, 99];
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let ziel: i32 = zeile.trim().parse().unwrap();

    let (mut links, mut rechts) = (0i32, werte.len() as i32 - 1);  //@init
    let mut gefunden = -1;
    while links <= rechts {  //@loop
        let mitte = (links + rechts) / 2;  //@mitte
        if werte[mitte as usize] == ziel {  //@cmp
            gefunden = mitte;  //@found
            break;
        } else if werte[mitte as usize] < ziel {  //@cmp
            links = mitte + 1;  //@rechts
        } else {
            rechts = mitte - 1;  //@links
        }
    }
    println!("{}", gefunden);  //@found,none
}
`,
    },
  },

  scenes: {
    binaer: {
      title: 'Binäre Suche: Halbieren statt Durchsuchen',
      code: 'binaer',
      params: [{ name: 'ziel', label: 'gesucht', min: 0, max: 100, value: 72 }],
      build: (p): Step[] =>
        trace((t) => {
          const ziel = p.ziel;
          const n = WERTE.length;
          let links = 0;
          let rechts = n - 1;
          let vergleiche = 0;
          const dimmed = () => WERTE.map((_, i) => i).filter((i) => i < links || i > rechts);
          const view = (extra: Partial<{ pointers: Record<string, number>; hi: number[]; done: number[] }> = {}) => ({
            array: { label: 'werte (sortiert)', cells: WERTE, dim: dimmed(), ...extra },
            frames: [{ name: 'main', vars: { ziel, links, rechts } }],
          });
          t.step('init', `Gesucht ist ${ziel}. Die Liste ist **sortiert** – das ist die Voraussetzung. Der Suchbereich umfasst zunächst alles: von \`links\` bis \`rechts\`.`, view({ pointers: { links, rechts } }));
          let gefunden = -1;
          while (links <= rechts) {
            const mitte = Math.floor((links + rechts) / 2);
            vergleiche++;
            t.step('mitte', `Wir schauen genau in die Mitte des Bereichs: Position ${mitte}, Wert ${WERTE[mitte]}.`, view({ pointers: { links, mitte, rechts }, hi: [mitte] }));
            if (WERTE[mitte] === ziel) {
              gefunden = mitte;
              t.step('found', `Treffer an Position ${mitte}, nach ${vergleiche} ${vergleiche === 1 ? 'Vergleich' : 'Vergleichen'}.`, view({ pointers: { mitte }, done: [mitte] }));
              break;
            }
            if (WERTE[mitte] < ziel) {
              t.step('cmp', `${WERTE[mitte]} ist kleiner als ${ziel}. Weil die Liste sortiert ist, sind auch **alle** Werte links davon zu klein. Die linke Hälfte fliegt raus.`, view({ pointers: { links, mitte, rechts }, hi: [mitte] }));
              links = mitte + 1;
              t.step('rechts', `Der Bereich beginnt jetzt bei Position ${links}. ${rechts - links + 1} Kandidaten übrig.`, view({ pointers: { links, rechts } }));
            } else {
              t.step('cmp', `${WERTE[mitte]} ist größer als ${ziel}. Also sind auch alle Werte rechts davon zu groß. Die rechte Hälfte fliegt raus.`, view({ pointers: { links, mitte, rechts }, hi: [mitte] }));
              rechts = mitte - 1;
              t.step('links', `Der Bereich endet jetzt bei Position ${rechts}. ${Math.max(0, rechts - links + 1)} Kandidaten übrig.`, view({ pointers: rechts >= links ? { links, rechts } : {} }));
            }
          }
          const linear = gefunden >= 0 ? gefunden + 1 : n;
          t.print(gefunden);
          if (gefunden < 0) {
            t.step('none', `Der Bereich ist leer: ${ziel} kommt nicht vor. Auch das steht nach nur ${vergleiche} Vergleichen fest. Die lineare Suche hätte alle ${n} Werte prüfen müssen.`, view());
          } else {
            t.step('found', `Zum Vergleich: Die lineare Suche von vorn hätte ${linear} Vergleiche gebraucht. Bei einer Million Einträgen sind es höchstens 20 gegen bis zu 1.000.000.`, view({ done: [gefunden] }));
          }
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'binaer',
      title: 'Binäre Suche selbst schreiben',
      prompt:
        'Schreibe die Funktion `suche`. Sie bekommt eine **sortierte** Liste und einen gesuchten Wert und liefert dessen Position – oder `-1`, wenn er nicht vorkommt. Benutze die binäre Suche aus der Animation.\n\nDas Programm liest erst die Liste, dann mehrere Suchanfragen, und gibt für jede das Ergebnis aus.',
      tests: [
        { name: 'Vorhandene Werte', stdin: '1 3 5 7 9 11\n7 1 11\n', expected: '3\n0\n5\n' },
        { name: 'Fehlende Werte', stdin: '1 3 5 7 9 11\n4 0 12\n', expected: '-1\n-1\n-1\n' },
        { name: 'Ein einziges Element', stdin: '42\n42 41\n', expected: '0\n-1\n' },
      ],
      hints: [
        'Zwei Grenzen `links` und `rechts`, eine Schleife „solange links <= rechts", darin die Mitte berechnen und vergleichen.',
        'Ist der Wert in der Mitte zu klein, geht es rechts davon weiter: `links = mitte + 1`. Ist er zu groß: `rechts = mitte - 1`.',
      ],
      code: {
        python: raw`
def suche(werte, ziel):
#:solution
    links, rechts = 0, len(werte) - 1
    while links <= rechts:
        mitte = (links + rechts) // 2
        if werte[mitte] == ziel:
            return mitte
        if werte[mitte] < ziel:
            links = mitte + 1
        else:
            rechts = mitte - 1
    return -1
#:starter
    return -1
#:end

werte = list(map(int, input().split()))
for ziel in map(int, input().split()):
    print(suche(werte, ziel))
`,
        java: raw`
import java.util.Arrays;
import java.util.Scanner;

public class Main {
    static int suche(int[] werte, int ziel) {
//:solution
        int links = 0, rechts = werte.length - 1;
        while (links <= rechts) {
            int mitte = (links + rechts) / 2;
            if (werte[mitte] == ziel) {
                return mitte;
            }
            if (werte[mitte] < ziel) {
                links = mitte + 1;
            } else {
                rechts = mitte - 1;
            }
        }
        return -1;
//:starter
        return -1;
//:end
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int[] werte = Arrays.stream(in.nextLine().trim().split("\\s+")).mapToInt(Integer::parseInt).toArray();
        for (String t : in.nextLine().trim().split("\\s+")) {
            System.out.println(suche(werte, Integer.parseInt(t)));
        }
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

int suche(const int werte[], int anzahl, int ziel) {
//:solution
    int links = 0, rechts = anzahl - 1;
    while (links <= rechts) {
        int mitte = (links + rechts) / 2;
        if (werte[mitte] == ziel) {
            return mitte;
        }
        if (werte[mitte] < ziel) {
            links = mitte + 1;
        } else {
            rechts = mitte - 1;
        }
    }
    return -1;
//:starter
    (void)werte;
    (void)anzahl;
    (void)ziel;
    return -1;
//:end
}

int main(void) {
    char zeile[2000];
    int werte[200];
    int anzahl = 0;
    fgets(zeile, sizeof zeile, stdin);
    for (char *t = strtok(zeile, " \n"); t; t = strtok(NULL, " \n")) {
        sscanf(t, "%d", &werte[anzahl++]);
    }
    int ziel;
    while (scanf("%d", &ziel) == 1) {
        printf("%d\n", suche(werte, anzahl, ziel));
    }
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int suche(const std::vector<int> &werte, int ziel) {
//:solution
    int links = 0, rechts = static_cast<int>(werte.size()) - 1;
    while (links <= rechts) {
        int mitte = (links + rechts) / 2;
        if (werte[mitte] == ziel) {
            return mitte;
        }
        if (werte[mitte] < ziel) {
            links = mitte + 1;
        } else {
            rechts = mitte - 1;
        }
    }
    return -1;
//:starter
    (void)werte;
    (void)ziel;
    return -1;
//:end
}

int main() {
    std::string zeile;
    std::getline(std::cin, zeile);
    std::istringstream z(zeile);
    std::vector<int> werte;
    for (int x; z >> x;) {
        werte.push_back(x);
    }
    for (int ziel; std::cin >> ziel;) {
        std::cout << suche(werte, ziel) << "\n";
    }
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn suche(werte: &[i32], ziel: i32) -> i32 {
//:solution
    let (mut links, mut rechts) = (0i32, werte.len() as i32 - 1);
    while links <= rechts {
        let mitte = (links + rechts) / 2;
        let wert = werte[mitte as usize];
        if wert == ziel {
            return mitte;
        }
        if wert < ziel {
            links = mitte + 1;
        } else {
            rechts = mitte - 1;
        }
    }
    -1
//:starter
    let _ = (werte, ziel);
    -1
//:end
}

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut zeilen = eingabe.lines();
    let werte: Vec<i32> = zeilen.next().unwrap().split_whitespace().map(|t| t.parse().unwrap()).collect();
    for t in zeilen.next().unwrap().split_whitespace() {
        println!("{}", suche(&werte, t.parse().unwrap()));
    }
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'voraussetzung',
      title: 'Die Bedingung',
      question: 'Warum funktioniert die binäre Suche bei einer unsortierten Liste nicht?',
      options: [
        'Weil unsortierte Listen nicht halbiert werden können.',
        'Weil man aus einem einzelnen Vergleich nicht mehr schließen kann, in welcher Hälfte der Wert liegen muss.',
        'Weil sie bei unsortierten Listen zu langsam ist.',
        'Sie funktioniert, liefert aber immer -1.',
      ],
      correct: 1,
      explain:
        'Der ganze Trick beruht auf dem Schluss „Ist die Mitte zu klein, ist auch alles links davon zu klein". Das gilt nur für sortierte Daten. Deshalb lohnt es sich, Daten einmal zu sortieren, wenn man oft darin suchen will – oder gleich eine Struktur wie eine Hash-Map zu verwenden.',
    },
    {
      kind: 'quiz',
      id: 'schritte',
      title: 'Wie oft halbieren?',
      question: 'Wie viele Vergleiche braucht die binäre Suche höchstens bei 1024 sortierten Einträgen?',
      options: ['Etwa 10 bis 11', '512', '100', '1024'],
      correct: 0,
      explain:
        'Jeder Vergleich halbiert den Bereich: 1024 → 512 → 256 → … → 1. Das sind 10 Halbierungen, plus der letzte Vergleich. Allgemein braucht man etwa log₂(n) Schritte. Bei einer Milliarde Einträgen sind es gerade einmal 30.',
    },
  ],
};

export default lesson;
