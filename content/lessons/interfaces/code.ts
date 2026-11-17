import { raw } from '../../types.ts';
import type { Lang, LessonCode, Step } from '../../types.ts';
import { trace } from '../../util.ts';

const FORMEN = [
  { art: 'Kreis', label: 'Kreis r=1', flaeche: 3.14159, tag: 'k' },
  { art: 'Rechteck', label: 'Rechteck 2×3', flaeche: 6, tag: 'r' },
  { art: 'Kreis', label: 'Kreis r=2', flaeche: 12.56636, tag: 'k' },
];

const DISPATCH: Record<Lang, string> = {
  python: 'Python schaut zur Laufzeit nach, welche Klasse das Objekt hat, und ruft deren `flaeche` auf.',
  java: 'Die JVM schaut zur Laufzeit nach, welche Klasse das Objekt wirklich hat, und ruft deren Methode auf. Im Code steht nur der Typ `Form`.',
  c: 'In C steckt die Entscheidung in einem **Funktionszeiger**: Jede Form trägt die Adresse ihrer eigenen Flächenfunktion mit sich.',
  cpp: 'Weil `flaeche` als `virtual` markiert ist, schaut C++ zur Laufzeit in einer Tabelle des Objekts nach (der *vtable*), welche Methode zuständig ist.',
  rust: '`dyn Form` heißt: Der genaue Typ wird erst zur Laufzeit bekannt. Rust schaut in einer Tabelle nach, welche Implementierung des Traits gilt.',
  sql: '',
  bash: '',
};

const lesson: LessonCode = {
  snippets: {
    formen: {
      python: raw`
import math

class Kreis:
    def __init__(self, r):
        self.r = r

    def flaeche(self):
        return math.pi * self.r ** 2  #@k

class Rechteck:
    def __init__(self, b, h):
        self.b, self.h = b, h

    def flaeche(self):
        return self.b * self.h  #@r

formen = [Kreis(1), Rechteck(2, 3), Kreis(2)]  #@liste
gesamt = 0
for form in formen:  #@loop
    gesamt += form.flaeche()  #@call
print(f"{gesamt:.2f}")  #@out
`,
      java: raw`
import java.util.List;

public class Main {
    interface Form {
        double flaeche();
    }

    record Kreis(double r) implements Form {
        public double flaeche() {
            return Math.PI * r * r;  //@k
        }
    }

    record Rechteck(double b, double h) implements Form {
        public double flaeche() {
            return b * h;  //@r
        }
    }

    public static void main(String[] args) {
        List<Form> formen = List.of(new Kreis(1), new Rechteck(2, 3), new Kreis(2));  //@liste
        double gesamt = 0;
        for (Form form : formen) {  //@loop
            gesamt += form.flaeche();  //@call
        }
        System.out.println(String.format("%.2f", gesamt));  //@out
    }
}
`,
      c: raw`
#include <math.h>
#include <stdio.h>

struct Form {
    double a, b;
    double (*flaeche)(const struct Form *form);  // Zeiger auf eine Funktion
};

double kreis_flaeche(const struct Form *f) {
    return M_PI * f->a * f->a;  //@k
}

double rechteck_flaeche(const struct Form *f) {
    return f->a * f->b;  //@r
}

int main(void) {
    struct Form formen[] = {  //@liste
        {1, 0, kreis_flaeche},
        {2, 3, rechteck_flaeche},
        {2, 0, kreis_flaeche},
    };
    double gesamt = 0;
    for (int i = 0; i < 3; i++) {  //@loop
        gesamt += formen[i].flaeche(&formen[i]);  //@call
    }
    printf("%.2f\n", gesamt);  //@out
    return 0;
}
`,
      cpp: raw`
#include <cmath>
#include <cstdio>
#include <memory>
#include <numbers>
#include <vector>

class Form {
public:
    virtual ~Form() = default;
    virtual double flaeche() const = 0;  // muss jede Unterklasse liefern
};

class Kreis : public Form {
public:
    explicit Kreis(double r) : r_(r) {}
    double flaeche() const override {
        return std::numbers::pi * r_ * r_;  //@k
    }
private:
    double r_;
};

class Rechteck : public Form {
public:
    Rechteck(double b, double h) : b_(b), h_(h) {}
    double flaeche() const override {
        return b_ * h_;  //@r
    }
private:
    double b_, h_;
};

int main() {
    std::vector<std::unique_ptr<Form>> formen;  //@liste
    formen.push_back(std::make_unique<Kreis>(1));
    formen.push_back(std::make_unique<Rechteck>(2, 3));
    formen.push_back(std::make_unique<Kreis>(2));

    double gesamt = 0;
    for (const auto &form : formen) {  //@loop
        gesamt += form->flaeche();  //@call
    }
    std::printf("%.2f\n", gesamt);  //@out
    return 0;
}
`,
      rust: raw`
use std::f64::consts::PI;

trait Form {
    fn flaeche(&self) -> f64;
}

struct Kreis {
    r: f64,
}

struct Rechteck {
    b: f64,
    h: f64,
}

impl Form for Kreis {
    fn flaeche(&self) -> f64 {
        PI * self.r * self.r  //@k
    }
}

impl Form for Rechteck {
    fn flaeche(&self) -> f64 {
        self.b * self.h  //@r
    }
}

fn main() {
    let formen: Vec<Box<dyn Form>> = vec![  //@liste
        Box::new(Kreis { r: 1.0 }),
        Box::new(Rechteck { b: 2.0, h: 3.0 }),
        Box::new(Kreis { r: 2.0 }),
    ];
    let mut gesamt = 0.0;
    for form in &formen {  //@loop
        gesamt += form.flaeche();  //@call
    }
    println!("{:.2}", gesamt);  //@out
}
`,
    },
  },

  scenes: {
    formen: {
      title: 'Ein Aufruf, verschiedene Methoden',
      code: 'formen',
      build: (_p, lang): Step[] =>
        trace((t) => {
          const cells = FORMEN.map((f) => f.label);
          let gesamt = 0;
          const g = () => ({ frames: [{ name: 'main', vars: { gesamt: Number(gesamt.toFixed(2)) } }] });
          t.step('liste', 'Eine Liste mit Formen verschiedener Art. Für den Rest des Programms sind sie alle einfach „eine Form": Sie versprechen, eine Methode `flaeche` zu haben.', {
            array: { label: 'formen', cells },
            ...g(),
          });
          FORMEN.forEach((f, i) => {
            t.step('loop', `Die Schleife nimmt sich Element ${i} vor. Der Code dort weiß nicht, ob es ein Kreis oder ein Rechteck ist – und muss es auch nicht wissen.`, {
              array: { label: 'formen', cells, hi: [i], pointers: { form: i } },
              ...g(),
            });
            t.step('call', i === 0 ? `Aufruf von \`flaeche\`. Welche Methode läuft? ${DISPATCH[lang]}` : 'Derselbe Aufruf, dieselbe Zeile …', {
              array: { label: 'formen', cells, hi: [i], pointers: { form: i } },
              ...g(),
            });
            gesamt += f.flaeche;
            t.step(f.tag, `… und weil es ein **${f.art}** ist, landet er in der ${f.art}-Variante. Ergebnis: ${f.flaeche.toFixed(2)}.`, {
              array: { label: 'formen', cells, hi: [i], pointers: { form: i } },
              ...g(),
            });
          });
          t.print(gesamt.toFixed(2));
          t.step('out', 'Kommt morgen ein Dreieck dazu, schreibt man eine neue Klasse. Die Schleife bleibt, wie sie ist. Das ist **Polymorphie**: ein Aufruf, viele mögliche Ausprägungen.', {
            array: { label: 'formen', cells },
            ...g(),
          });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'dreieck',
      title: 'Ein Dreieck dazubauen',
      prompt:
        'Das Programm kennt Rechtecke und Quadrate. Es liest Zeilen wie `rechteck 2 3`, `quadrat 4` oder `dreieck 4 5`, gibt die Fläche jeder Form mit einer Nachkommastelle aus und am Ende die Summe.\n\nDie Klasse für Dreiecke existiert schon, liefert aber immer 0. Vervollständige ihre Flächenmethode: Grundseite mal Höhe durch 2.\n\nBeachte, dass du dafür **nichts** an der Schleife ändern musst.',
      tests: [
        { name: 'Ein Dreieck', stdin: 'dreieck 4 5\n', expected: '10.0\nSumme: 10.0\n' },
        { name: 'Gemischt', stdin: 'rechteck 2 3\nquadrat 4\ndreieck 3 3\n', expected: '6.0\n16.0\n4.5\nSumme: 26.5\n' },
        { name: 'Ohne Dreieck', stdin: 'quadrat 1\n', expected: '1.0\nSumme: 1.0\n' },
      ],
      hints: ['Die Felder heißen `g` (Grundseite) und `h` (Höhe). Achte darauf, mit Kommazahlen zu rechnen, damit 4,5 nicht zu 4 wird.'],
      code: {
        python: raw`
import sys

class Rechteck:
    def __init__(self, b, h):
        self.b, self.h = b, h

    def flaeche(self):
        return self.b * self.h

class Quadrat:
    def __init__(self, s):
        self.s = s

    def flaeche(self):
        return self.s * self.s

class Dreieck:
    def __init__(self, g, h):
        self.g, self.h = g, h

    def flaeche(self):
#:solution
        return self.g * self.h / 2
#:starter
        return 0
#:end

formen = []
for zeile in sys.stdin:
    teile = zeile.split()
    if not teile:
        continue
    zahlen = [float(x) for x in teile[1:]]
    if teile[0] == "rechteck":
        formen.append(Rechteck(*zahlen))
    elif teile[0] == "quadrat":
        formen.append(Quadrat(*zahlen))
    elif teile[0] == "dreieck":
        formen.append(Dreieck(*zahlen))

summe = 0
for form in formen:
    print(f"{form.flaeche():.1f}")
    summe += form.flaeche()
print(f"Summe: {summe:.1f}")
`,
        java: raw`
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class Main {
    interface Form {
        double flaeche();
    }

    record Rechteck(double b, double h) implements Form {
        public double flaeche() {
            return b * h;
        }
    }

    record Quadrat(double s) implements Form {
        public double flaeche() {
            return s * s;
        }
    }

    record Dreieck(double g, double h) implements Form {
        public double flaeche() {
//:solution
            return g * h / 2;
//:starter
            return 0;
//:end
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        List<Form> formen = new ArrayList<>();
        while (in.hasNext()) {
            String art = in.next();
            switch (art) {
                case "rechteck" -> formen.add(new Rechteck(in.nextDouble(), in.nextDouble()));
                case "quadrat" -> formen.add(new Quadrat(in.nextDouble()));
                case "dreieck" -> formen.add(new Dreieck(in.nextDouble(), in.nextDouble()));
                default -> { }
            }
        }

        double summe = 0;
        for (Form form : formen) {
            System.out.println(String.format("%.1f", form.flaeche()));
            summe += form.flaeche();
        }
        System.out.println(String.format("Summe: %.1f", summe));
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

struct Form {
    double a, b;
    double (*flaeche)(const struct Form *form);
};

double rechteck_flaeche(const struct Form *f) {
    return f->a * f->b;
}

double quadrat_flaeche(const struct Form *f) {
    return f->a * f->a;
}

// a ist die Grundseite, b die Höhe.
double dreieck_flaeche(const struct Form *f) {
//:solution
    return f->a * f->b / 2;
//:starter
    (void)f;
    return 0;
//:end
}

int main(void) {
    struct Form formen[50];
    int anzahl = 0;
    char art[20];
    while (scanf("%19s", art) == 1 && anzahl < 50) {
        struct Form *f = &formen[anzahl];
        f->b = 0;
        if (strcmp(art, "rechteck") == 0) {
            scanf("%lf %lf", &f->a, &f->b);
            f->flaeche = rechteck_flaeche;
        } else if (strcmp(art, "quadrat") == 0) {
            scanf("%lf", &f->a);
            f->flaeche = quadrat_flaeche;
        } else if (strcmp(art, "dreieck") == 0) {
            scanf("%lf %lf", &f->a, &f->b);
            f->flaeche = dreieck_flaeche;
        } else {
            continue;
        }
        anzahl++;
    }

    double summe = 0;
    for (int i = 0; i < anzahl; i++) {
        double wert = formen[i].flaeche(&formen[i]);
        printf("%.1f\n", wert);
        summe += wert;
    }
    printf("Summe: %.1f\n", summe);
    return 0;
}
`,
        cpp: raw`
#include <cstdio>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Form {
public:
    virtual ~Form() = default;
    virtual double flaeche() const = 0;
};

class Rechteck : public Form {
public:
    Rechteck(double b, double h) : b_(b), h_(h) {}
    double flaeche() const override { return b_ * h_; }
private:
    double b_, h_;
};

class Quadrat : public Form {
public:
    explicit Quadrat(double s) : s_(s) {}
    double flaeche() const override { return s_ * s_; }
private:
    double s_;
};

class Dreieck : public Form {
public:
    Dreieck(double g, double h) : g_(g), h_(h) {}
    double flaeche() const override {
//:solution
        return g_ * h_ / 2;
//:starter
        return 0;
//:end
    }
private:
    double g_, h_;
};

int main() {
    std::vector<std::unique_ptr<Form>> formen;
    std::string art;
    while (std::cin >> art) {
        double a = 0, b = 0;
        if (art == "rechteck") {
            std::cin >> a >> b;
            formen.push_back(std::make_unique<Rechteck>(a, b));
        } else if (art == "quadrat") {
            std::cin >> a;
            formen.push_back(std::make_unique<Quadrat>(a));
        } else if (art == "dreieck") {
            std::cin >> a >> b;
            formen.push_back(std::make_unique<Dreieck>(a, b));
        }
    }

    double summe = 0;
    for (const auto &form : formen) {
        std::printf("%.1f\n", form->flaeche());
        summe += form->flaeche();
    }
    std::printf("Summe: %.1f\n", summe);
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

trait Form {
    fn flaeche(&self) -> f64;
}

struct Rechteck { b: f64, h: f64 }
struct Quadrat { s: f64 }
struct Dreieck { g: f64, h: f64 }

impl Form for Rechteck {
    fn flaeche(&self) -> f64 { self.b * self.h }
}

impl Form for Quadrat {
    fn flaeche(&self) -> f64 { self.s * self.s }
}

impl Form for Dreieck {
    fn flaeche(&self) -> f64 {
//:solution
        self.g * self.h / 2.0
//:starter
        let _ = (self.g, self.h);
        0.0
//:end
    }
}

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut woerter = eingabe.split_whitespace();
    let mut formen: Vec<Box<dyn Form>> = Vec::new();
    let zahl = |w: &mut std::str::SplitWhitespace| -> f64 { w.next().unwrap().parse().unwrap() };
    while let Some(art) = woerter.next() {
        match art {
            "rechteck" => {
                let b = zahl(&mut woerter);
                let h = zahl(&mut woerter);
                formen.push(Box::new(Rechteck { b, h }));
            }
            "quadrat" => {
                let s = zahl(&mut woerter);
                formen.push(Box::new(Quadrat { s }));
            }
            "dreieck" => {
                let g = zahl(&mut woerter);
                let h = zahl(&mut woerter);
                formen.push(Box::new(Dreieck { g, h }));
            }
            _ => {}
        }
    }

    let mut summe = 0.0;
    for form in &formen {
        println!("{:.1}", form.flaeche());
        summe += form.flaeche();
    }
    println!("Summe: {:.1}", summe);
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'vererbung',
      title: 'Ist-ein oder hat-ein?',
      question:
        'Eine Klasse `Auto` soll einen Motor haben. Ein Kollege schlägt vor, `Auto` von `Motor` erben zu lassen, damit es dessen Methoden bekommt. Was ist davon zu halten?',
      options: [
        'Gute Idee – Vererbung ist immer der beste Weg, Code wiederzuverwenden.',
        'Keine gute Idee: Ein Auto **ist** kein Motor, es **hat** einen. Besser bekommt `Auto` ein Feld vom Typ `Motor`.',
        'Das ist technisch unmöglich.',
        'Nur in Rust erlaubt.',
      ],
      correct: 1,
      explain:
        'Vererbung drückt eine „ist-ein"-Beziehung aus: Ein Kreis **ist eine** Form. Für „hat-ein" nimmt man **Komposition**: Das Objekt enthält ein anderes als Feld. Die Faustregel „Komposition vor Vererbung" ist so verbreitet, dass Rust und Go Vererbung von Klassen gar nicht erst anbieten – dort gibt es nur Schnittstellen (Traits, Interfaces) und Komposition.',
    },
    {
      kind: 'quiz',
      id: 'vertrag',
      title: 'Was ist ein Interface?',
      question: 'Was beschreibt ein Interface (Java), eine abstrakte Klasse mit rein virtuellen Methoden (C++) oder ein Trait (Rust) am besten?',
      options: [
        'Eine Klasse, von der man besonders viele Objekte erzeugen kann.',
        'Einen Vertrag: eine Liste von Fähigkeiten, die ein Typ anbieten muss – ohne festzulegen, wie.',
        'Eine grafische Benutzeroberfläche.',
        'Eine Sammlung globaler Variablen.',
      ],
      correct: 1,
      explain:
        'Ein Interface legt fest, **was** ein Typ kann, nicht **wie**. Code, der nur das Interface kennt, funktioniert mit jedem Typ, der den Vertrag erfüllt – auch mit solchen, die erst Jahre später geschrieben werden. Python braucht dafür kein eigenes Sprachmittel: Hat ein Objekt die passende Methode, funktioniert der Aufruf („Duck Typing": Wenn es quakt wie eine Ente …).',
    },
  ],
};

export default lesson;
