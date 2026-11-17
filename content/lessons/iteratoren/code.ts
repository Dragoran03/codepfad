import { raw } from '../../types.ts';
import type { ArrayView, Lang, LessonCode, Step } from '../../types.ts';
import { trace } from '../../util.ts';

const WERTE = [3, 8, 1, 6, 5, 4];

const LAZY: Record<Lang, string> = {
  python: 'Der Generator-Ausdruck in Klammern ist **träge** (lazy): Er erzeugt keine Zwischenlisten, sondern reicht jedes Element einzeln durch die ganze Kette.',
  java: 'Streams sind **träge** (lazy): Erst `sum()` setzt die Kette in Gang, und dann wandert jedes Element einzeln durch alle Stufen.',
  c: 'C hat keine Iterator-Ketten – hier macht eine Schleife mit `if` genau dasselbe. Die Animation zeigt, wie die Pipeline in den anderen Sprachen arbeitet.',
  cpp: 'Die `views` aus `<ranges>` sind **träge** (lazy): Sie legen keine Zwischenlisten an. Erst die Schleife zieht Element für Element durch die Kette.',
  rust: 'Iteratoren in Rust sind **träge** (lazy): Ohne `sum()` am Ende würde gar nichts passieren. Und der Compiler macht daraus genauso schnellen Code wie eine handgeschriebene Schleife.',
  sql: '',
  bash: '',
};

const lesson: LessonCode = {
  snippets: {
    pipeline: {
      python: raw`
werte = [3, 8, 1, 6, 5, 4]  #@init
ergebnis = sum(  #@sum
    w * w  #@map
    for w in werte  #@next
    if w % 2 == 0  #@filter
)
print(ergebnis)  #@out
`,
      java: raw`
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] werte = {3, 8, 1, 6, 5, 4};  //@init
        int ergebnis = Arrays.stream(werte)  //@next
            .filter(w -> w % 2 == 0)  //@filter
            .map(w -> w * w)  //@map
            .sum();  //@sum
        System.out.println(ergebnis);  //@out
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int werte[] = {3, 8, 1, 6, 5, 4};  //@init
    int ergebnis = 0;
    for (int i = 0; i < 6; i++) {  //@next
        int w = werte[i];
        if (w % 2 == 0) {  //@filter
            ergebnis += w * w;  //@map,sum
        }
    }
    printf("%d\n", ergebnis);  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <ranges>
#include <vector>

int main() {
    std::vector<int> werte = {3, 8, 1, 6, 5, 4};  //@init
    auto kette = werte  //@next
        | std::views::filter([](int w) { return w % 2 == 0; })  //@filter
        | std::views::transform([](int w) { return w * w; });  //@map
    int ergebnis = 0;
    for (int x : kette) {
        ergebnis += x;  //@sum
    }
    std::cout << ergebnis << "\n";  //@out
    return 0;
}
`,
      rust: raw`
fn main() {
    let werte = [3, 8, 1, 6, 5, 4];  //@init
    let ergebnis: i32 = werte
        .iter()  //@next
        .filter(|w| *w % 2 == 0)  //@filter
        .map(|w| w * w)  //@map
        .sum();  //@sum
    println!("{}", ergebnis);  //@out
}
`,
    },
  },

  scenes: {
    pipeline: {
      title: 'Ein Element nach dem anderen durch die Kette',
      code: 'pipeline',
      build: (_p, lang): Step[] =>
        trace((t) => {
          const gefiltert: number[] = [];
          const quadriert: number[] = [];
          let summe = 0;
          const view = (i?: number, stage?: 'f' | 'm'): { array: ArrayView[]; frames: { name: string; vars: Record<string, number> }[] } => ({
            array: [
              { label: 'werte', cells: WERTE, hi: i === undefined ? [] : [i], done: i === undefined ? [] : WERTE.map((_, k) => k).filter((k) => k < i), showIndex: false },
              { label: 'nach filter (gerade?)', cells: [...gefiltert], hi: stage === 'f' ? [gefiltert.length - 1] : [], showIndex: false },
              { label: 'nach map (quadriert)', cells: [...quadriert], hi: stage === 'm' ? [quadriert.length - 1] : [], showIndex: false },
            ],
            frames: [{ name: 'sum', vars: { summe } }],
          });
          t.step('init', `Eine Kette aus drei Stufen: **filter** behält nur gerade Zahlen, **map** quadriert sie, **sum** addiert alles. ${LAZY[lang]}`, view());
          WERTE.forEach((w, i) => {
            t.step('next', `Das nächste Element kommt aus der Quelle: ${w}.`, view(i));
            if (w % 2 !== 0) {
              t.step('filter', `filter: ${w} ist ungerade – das Element ist raus. Map und sum bekommen es nie zu sehen.`, view(i));
              return;
            }
            gefiltert.push(w);
            t.step('filter', `filter: ${w} ist gerade – darf weiter.`, view(i, 'f'));
            quadriert.push(w * w);
            t.step('map', `map: ${w} wird zu ${w * w}.`, view(i, 'm'));
            summe += w * w;
            t.step('sum', `sum: Zwischenstand ${summe}.`, view(i));
          });
          t.print(summe);
          t.step('out', 'Fertig. Die Zwischenlisten oben dienen nur der Anschauung – tatsächlich wird jedes Element sofort weitergereicht und nichts zwischengespeichert. Deshalb funktionieren solche Ketten sogar mit unendlichen Datenquellen.', view());
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'lange-woerter',
      title: 'Lange Wörter herausfiltern',
      prompt:
        'Das Programm liest eine Zeile Wörter. Gib alle Wörter mit **mindestens 4 Buchstaben** in **Großbuchstaben** aus, durch Leerzeichen getrennt, in der ursprünglichen Reihenfolge.\n\nAus `der hund bellt laut` wird `HUND BELLT LAUT`.\n\nVersuche es als Kette aus filter und map – in C mit einer Schleife.',
      tests: [
        { name: 'Ein Satz', stdin: 'der hund bellt laut\n', expected: 'HUND BELLT LAUT\n' },
        { name: 'Nur kurze Wörter', stdin: 'ich bin da\n', expected: '\n' },
        { name: 'Genau vier', stdin: 'baum ast blatt\n', expected: 'BAUM BLATT\n' },
      ],
      hints: [
        'Filter: Länge des Worts `>= 4`. Map: in Großbuchstaben umwandeln.',
        'Python: `" ".join(w.upper() for w in woerter if len(w) >= 4)`. Java: `Arrays.stream(...).filter(...).map(String::toUpperCase).collect(Collectors.joining(" "))`. Rust: `.filter(...).map(|w| w.to_uppercase()).collect::<Vec<_>>().join(" ")`.',
      ],
      code: {
        python: raw`
woerter = input().split()

#:solution
ergebnis = " ".join(w.upper() for w in woerter if len(w) >= 4)
#:starter
ergebnis = " ".join(woerter)
#:end

print(ergebnis)
`,
        java: raw`
import java.util.Arrays;
import java.util.Scanner;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        String zeile = new Scanner(System.in).nextLine();
        String[] woerter = zeile.trim().split("\\s+");

//:solution
        String ergebnis = Arrays.stream(woerter)
            .filter(w -> w.length() >= 4)
            .map(String::toUpperCase)
            .collect(Collectors.joining(" "));
//:starter
        String ergebnis = Arrays.stream(woerter)
            .collect(Collectors.joining(" "));
//:end

        System.out.println(ergebnis);
    }
}
`,
        c: raw`
#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    char wort[100];
    bool erstes = true;
    while (scanf("%99s", wort) == 1) {
//:solution
        if (strlen(wort) < 4) {
            continue;
        }
        for (int i = 0; wort[i] != '\0'; i++) {
            wort[i] = toupper((unsigned char) wort[i]);
        }
//:starter
        // Filtern und umwandeln
//:end
        printf("%s%s", erstes ? "" : " ", wort);
        erstes = false;
    }
    printf("\n");
    return 0;
}
`,
        cpp: raw`
#include <algorithm>
#include <cctype>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> woerter;
    for (std::string w; std::cin >> w;) {
        woerter.push_back(w);
    }

    std::vector<std::string> ergebnis;
//:solution
    for (std::string w : woerter) {
        if (w.size() < 4) {
            continue;
        }
        std::transform(w.begin(), w.end(), w.begin(), [](unsigned char c) { return std::toupper(c); });
        ergebnis.push_back(w);
    }
//:starter
    ergebnis = woerter;
//:end

    for (std::size_t i = 0; i < ergebnis.size(); i++) {
        std::cout << (i ? " " : "") << ergebnis[i];
    }
    std::cout << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();

//:solution
    let ergebnis: Vec<String> = zeile
        .split_whitespace()
        .filter(|w| w.chars().count() >= 4)
        .map(|w| w.to_uppercase())
        .collect();
//:starter
    let ergebnis: Vec<String> = zeile
        .split_whitespace()
        .map(|w| w.to_string())
        .collect();
//:end

    println!("{}", ergebnis.join(" "));
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'reduce',
      title: 'Die dritte Grundoperation',
      question: '`map` verwandelt jedes Element, `filter` wählt Elemente aus. Was macht `reduce` (auch `fold` genannt)?',
      options: [
        'Es entfernt doppelte Elemente.',
        'Es fasst alle Elemente schrittweise zu einem einzigen Ergebnis zusammen – etwa einer Summe, einem Maximum oder einem Text.',
        'Es sortiert die Elemente.',
        'Es halbiert die Liste.',
      ],
      correct: 1,
      explain:
        '`reduce` nimmt einen Startwert und eine Funktion, die aus „bisherigem Ergebnis" und „nächstem Element" ein neues Ergebnis macht. `sum`, `max`, `count` und `join` sind alles Sonderfälle davon. Mit map, filter und reduce lassen sich erstaunlich viele Schleifen ausdrücken – oft kürzer und mit weniger Gelegenheit für Off-by-one-Fehler.',
    },
  ],
};

export default lesson;
