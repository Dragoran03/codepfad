import { raw } from '../../types.ts';
import type { Lang, LessonCode, PipelineView, Step } from '../../types.ts';

type Stage = PipelineView['stages'][number];

const WEGE: Record<Lang, { stages: Stage[]; notes: string[] }> = {
  python: {
    stages: [
      { label: 'erstes(liste)', sub: 'eine Funktion', kind: 'file' },
      { label: 'Aufruf mit int-Liste', sub: 'läuft einfach', kind: 'run' },
      { label: 'Aufruf mit str-Liste', sub: 'läuft auch', kind: 'run' },
    ],
    notes: [
      'In Python funktioniert jede Funktion von vornherein mit allen Typen, für die die benutzten Operationen existieren. Generics im engeren Sinn braucht es nicht.',
      'Beim Aufruf mit Zahlen wird nichts geprüft – die Funktion läuft einfach.',
      'Mit Text genauso. Typ-Hinweise wie `def erstes(liste: list[T]) -> T` dokumentieren die Absicht für Menschen und Prüfwerkzeuge, ändern aber nichts am Ablauf.',
    ],
  },
  java: {
    stages: [
      { label: 'erstes<T>', sub: 'mit Typparameter', kind: 'file' },
      { label: 'javac', sub: 'prüft jeden Aufruf', kind: 'tool' },
      { label: 'eine Version', sub: 'T wird zu Object', kind: 'file' },
      { label: 'JVM', sub: 'für alle Typen', kind: 'run' },
    ],
    notes: [
      'Die Methode bekommt einen **Typparameter** `T` – einen Platzhalter für einen Typ, der erst beim Aufruf feststeht.',
      'Der Compiler prüft jeden Aufruf: Bei `List<String>` liefert `erstes` garantiert einen `String`. Ein Aufruf, der nicht passt, wird abgelehnt.',
      'Danach wird `T` gelöscht (**Type Erasure**): Es entsteht genau eine Version, die mit `Object` arbeitet. Deshalb funktionieren Java-Generics nur mit Objekttypen – `List<int>` gibt es nicht, nur `List<Integer>`.',
      'Zur Laufzeit läuft dieselbe Methode für alle Typen.',
    ],
  },
  c: {
    stages: [
      { label: 'void *', sub: 'Zeiger auf irgendwas', kind: 'file' },
      { label: 'Größe mitgeben', sub: 'sizeof(T) von Hand', kind: 'tool' },
      { label: 'eine Funktion', sub: 'für alle Typen', kind: 'run' },
      { label: 'keine Prüfung', sub: 'Fehler zur Laufzeit', kind: 'out' },
    ],
    notes: [
      'C hat keine Generics. Der klassische Ausweg ist `void *`: ein Zeiger, der auf Daten beliebigen Typs zeigen darf.',
      'Weil die Funktion den Typ nicht kennt, muss man ihr die Größe eines Elements (und oft eine Vergleichsfunktion) mitgeben. So arbeitet auch `qsort` aus der Standardbibliothek.',
      'Eine einzige Funktion bedient alle Typen – ganz ohne Hilfe des Compilers.',
      'Der Preis: Der Compiler kann nichts prüfen. Gibt man die falsche Größe an, liest das Programm Unsinn. Alternativ werden Makros eingesetzt, die Code per Textersetzung erzeugen.',
    ],
  },
  cpp: {
    stages: [
      { label: 'template<T>', sub: 'eine Schablone', kind: 'file' },
      { label: 'Compiler', sub: 'sieht die Aufrufe', kind: 'tool' },
      { label: 'erstes<int>', sub: 'eigene Version', kind: 'file' },
      { label: 'erstes<string>', sub: 'eigene Version', kind: 'file' },
    ],
    notes: [
      'Ein **Template** ist eine Schablone, aus der der Compiler Code erzeugt.',
      'Der Compiler sieht, mit welchen Typen das Template benutzt wird.',
      'Für jeden Typ erzeugt er eine eigene, maßgeschneiderte Version der Funktion (**Monomorphisierung**). Sie ist genauso schnell, als hättest du sie von Hand für `int` geschrieben.',
      'Der Preis: mehr Maschinencode und längere Kompilierzeiten. Und Fehlermeldungen in Templates sind berüchtigt lang – C++20-**Concepts** machen sie lesbarer.',
    ],
  },
  rust: {
    stages: [
      { label: 'fn erstes<T>', sub: 'mit Typparameter', kind: 'file' },
      { label: 'rustc', sub: 'prüft Trait-Grenzen', kind: 'tool' },
      { label: 'erstes::<i32>', sub: 'eigene Version', kind: 'file' },
      { label: 'erstes::<&str>', sub: 'eigene Version', kind: 'file' },
    ],
    notes: [
      'Die Funktion bekommt einen **Typparameter** `T`.',
      'Rust prüft die generische Funktion **einmal für alle Typen**: Braucht sie einen Vergleich, muss das als Bedingung dastehen (`T: PartialOrd`). Ohne diese **Trait-Grenze** lehnt der Compiler ab – noch bevor jemand die Funktion aufruft.',
      'Wie in C++ erzeugt der Compiler für jeden benutzten Typ eine eigene Version (**Monomorphisierung**) – keine Kosten zur Laufzeit.',
      'Strenge Prüfung wie in Java, Geschwindigkeit wie in C++.',
    ],
  },
  sql: { stages: [], notes: [] },
  bash: { stages: [], notes: [] },
};

const lesson: LessonCode = {
  snippets: {
    erstes: {
      python: raw`
def erstes(liste):
    return liste[0]

print(erstes([42, 7]))
print(erstes(["Apfel", "Birne"]))
`,
      java: raw`
import java.util.List;

public class Main {
    static <T> T erstes(List<T> liste) {
        return liste.get(0);
    }

    public static void main(String[] args) {
        int zahl = erstes(List.of(42, 7));
        String wort = erstes(List.of("Apfel", "Birne"));
        System.out.println(zahl);
        System.out.println(wort);
    }
}
`,
      c: raw`
#include <stdio.h>
#include <string.h>

// Kopiert das erste Element (groesse Bytes) nach ziel.
void erstes(const void *liste, size_t groesse, void *ziel) {
    memcpy(ziel, liste, groesse);
}

int main(void) {
    int zahlen[] = {42, 7};
    const char *woerter[] = {"Apfel", "Birne"};

    int zahl;
    const char *wort;
    erstes(zahlen, sizeof(int), &zahl);
    erstes(woerter, sizeof(char *), &wort);
    printf("%d\n", zahl);
    printf("%s\n", wort);
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <string>
#include <vector>

template <typename T>
T erstes(const std::vector<T> &liste) {
    return liste[0];
}

int main() {
    std::cout << erstes(std::vector<int>{42, 7}) << "\n";
    std::cout << erstes(std::vector<std::string>{"Apfel", "Birne"}) << "\n";
    return 0;
}
`,
      rust: raw`
fn erstes<T: Copy>(liste: &[T]) -> T {
    liste[0]
}

fn main() {
    println!("{}", erstes(&[42, 7]));
    println!("{}", erstes(&["Apfel", "Birne"]));
}
`,
    },
  },

  scenes: {
    wege: {
      title: 'Ein Code, viele Typen – wie macht der Compiler das?',
      build: (_p, lang): Step[] => {
        const w = WEGE[lang];
        return w.stages.map((_, i) => ({ note: w.notes[i], pipeline: { stages: w.stages, active: i } }));
      },
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'maximum',
      title: 'Ein Maximum für alle',
      prompt:
        'Schreibe **eine** Funktion `max_von`, die das größte Element einer Liste liefert – egal ob die Liste Zahlen oder Wörter enthält (Wörter werden alphabetisch verglichen). Das Hauptprogramm ruft sie einmal mit Zahlen und einmal mit Wörtern auf.\n\nDie Signatur ist schon generisch. Der Startcode liefert immer das erste Element.',
      tests: [
        { name: 'Zahlen und Obst', stdin: '3 9 2\nbirne apfel zitrone\n', expected: '9\nzitrone\n' },
        { name: 'Maximum vorn', stdin: '8 1\nzebra affe\n', expected: '8\nzebra\n' },
        { name: 'Negative Zahlen', stdin: '-5 -1 -9\nb a c\n', expected: '-1\nc\n' },
      ],
      hints: [
        'Wie bei der Suche nach dem Maximum im Array: Merke dir das bisher größte Element und vergleiche der Reihe nach.',
        'Der Vergleich mit `>` funktioniert für Zahlen und für Texte – in C über die mitgegebene Vergleichsfunktion: `vergleich(a, b) > 0` heißt „a ist größer".',
      ],
      code: {
        python: raw`
def max_von(liste):
#:solution
    bester = liste[0]
    for element in liste[1:]:
        if element > bester:
            bester = element
    return bester
#:starter
    return liste[0]
#:end

zahlen = list(map(int, input().split()))
woerter = input().split()
print(max_von(zahlen))
print(max_von(woerter))
`,
        java: raw`
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class Main {
    static <T extends Comparable<T>> T maxVon(List<T> liste) {
//:solution
        T bester = liste.get(0);
        for (T element : liste) {
            if (element.compareTo(bester) > 0) {
                bester = element;
            }
        }
        return bester;
//:starter
        // Tipp: a.compareTo(b) > 0 heißt „a ist größer als b".
        return liste.get(0);
//:end
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        List<Integer> zahlen = new ArrayList<>();
        for (String t : in.nextLine().trim().split("\\s+")) {
            zahlen.add(Integer.parseInt(t));
        }
        List<String> woerter = List.of(in.nextLine().trim().split("\\s+"));
        System.out.println(maxVon(zahlen));
        System.out.println(maxVon(woerter));
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

// Liefert einen Zeiger auf das größte der anzahl Elemente (je groesse Bytes).
// vergleich(a, b) > 0 heißt: a ist größer als b.
const void *max_von(const void *daten, int anzahl, size_t groesse,
                    int (*vergleich)(const void *a, const void *b)) {
    const char *basis = daten;  // char*, damit man byteweise rechnen kann
//:solution
    const void *bester = basis;
    for (int i = 1; i < anzahl; i++) {
        const void *kandidat = basis + i * groesse;
        if (vergleich(kandidat, bester) > 0) {
            bester = kandidat;
        }
    }
    return bester;
//:starter
    // Element i liegt bei basis + i * groesse.
    (void)anzahl;
    (void)groesse;
    (void)vergleich;
    return basis;
//:end
}

int vergleiche_int(const void *a, const void *b) {
    return *(const int *)a - *(const int *)b;
}

int vergleiche_text(const void *a, const void *b) {
    return strcmp(*(char *const *)a, *(char *const *)b);
}

int main(void) {
    int zahlen[50];
    int anzahl_zahlen = 0;
    char zeile[1000];
    fgets(zeile, sizeof zeile, stdin);
    for (char *t = strtok(zeile, " \n"); t; t = strtok(NULL, " \n")) {
        sscanf(t, "%d", &zahlen[anzahl_zahlen++]);
    }

    static char speicher[50][30];
    char *woerter[50];
    int anzahl_woerter = 0;
    while (anzahl_woerter < 50 && scanf("%29s", speicher[anzahl_woerter]) == 1) {
        woerter[anzahl_woerter] = speicher[anzahl_woerter];
        anzahl_woerter++;
    }

    const int *z = max_von(zahlen, anzahl_zahlen, sizeof(int), vergleiche_int);
    char *const *w = max_von(woerter, anzahl_woerter, sizeof(char *), vergleiche_text);
    printf("%d\n", *z);
    printf("%s\n", *w);
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

template <typename T>
T max_von(const std::vector<T> &liste) {
//:solution
    T bester = liste[0];
    for (const T &element : liste) {
        if (element > bester) {
            bester = element;
        }
    }
    return bester;
//:starter
    return liste[0];
//:end
}

int main() {
    std::string zeile;
    std::getline(std::cin, zeile);
    std::istringstream z(zeile);
    std::vector<int> zahlen;
    for (int x; z >> x;) {
        zahlen.push_back(x);
    }

    std::vector<std::string> woerter;
    for (std::string w; std::cin >> w;) {
        woerter.push_back(w);
    }

    std::cout << max_von(zahlen) << "\n";
    std::cout << max_von(woerter) << "\n";
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn max_von<T: PartialOrd + Clone>(liste: &[T]) -> T {
//:solution
    let mut bester = &liste[0];
    for element in liste {
        if element > bester {
            bester = element;
        }
    }
    bester.clone()
//:starter
    liste[0].clone()
//:end
}

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut zeilen = eingabe.lines();
    let zahlen: Vec<i32> = zeilen.next().unwrap().split_whitespace().map(|t| t.parse().unwrap()).collect();
    let woerter: Vec<&str> = zeilen.next().unwrap().split_whitespace().collect();
    println!("{}", max_von(&zahlen));
    println!("{}", max_von(&woerter));
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'warum-generics',
      title: 'Wozu Typparameter?',
      question: 'Eine Liste könnte doch einfach „irgendwelche Objekte" enthalten (`List<Object>`). Was gewinnt man mit `List<String>`?',
      options: [
        'Nichts, es ist nur länger zu schreiben.',
        'Der Compiler weiß, dass nur Strings hineinkommen und herauskommen – Verwechslungen fallen beim Kompilieren auf, und man muss nicht bei jedem Zugriff umwandeln.',
        'Die Liste wird automatisch sortiert.',
        'Die Liste kann dann unbegrenzt wachsen.',
      ],
      correct: 1,
      explain:
        'Generics verbinden Wiederverwendbarkeit mit Typsicherheit. Der Code von `List` wird einmal geschrieben, aber jede konkrete Liste weiß, was sie enthält. Bevor Java 2004 Generics bekam, musste jeder gelesene Wert von `Object` zurück in den eigentlichen Typ gewandelt werden – und ein falscher Wert fiel erst zur Laufzeit auf.',
    },
  ],
};

export default lesson;
