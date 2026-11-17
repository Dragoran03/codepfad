import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  snippets: {
    punkt: {
      python: raw`
from dataclasses import dataclass

@dataclass
class Punkt:  #@typ
    x: int
    y: int

def abstand(a, b):  #@def
    return abs(a.x - b.x) + abs(a.y - b.y)  #@ret

start = Punkt(1, 2)  #@a
ziel = Punkt(4, 6)  #@b
ziel.x = 5  #@aendern
print(abstand(start, ziel))  #@out
`,
      java: raw`
public class Main {
    static class Punkt {  //@typ
        int x;
        int y;

        Punkt(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }

    static int abstand(Punkt a, Punkt b) {  //@def
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);  //@ret
    }

    public static void main(String[] args) {
        Punkt start = new Punkt(1, 2);  //@a
        Punkt ziel = new Punkt(4, 6);  //@b
        ziel.x = 5;  //@aendern
        System.out.println(abstand(start, ziel));  //@out
    }
}
`,
      c: raw`
#include <stdio.h>
#include <stdlib.h>

struct Punkt {  //@typ
    int x;
    int y;
};

int abstand(struct Punkt a, struct Punkt b) {  //@def
    return abs(a.x - b.x) + abs(a.y - b.y);  //@ret
}

int main(void) {
    struct Punkt start = {1, 2};  //@a
    struct Punkt ziel = {4, 6};  //@b
    ziel.x = 5;  //@aendern
    printf("%d\n", abstand(start, ziel));  //@out
    return 0;
}
`,
      cpp: raw`
#include <cstdlib>
#include <iostream>

struct Punkt {  //@typ
    int x;
    int y;
};

int abstand(Punkt a, Punkt b) {  //@def
    return std::abs(a.x - b.x) + std::abs(a.y - b.y);  //@ret
}

int main() {
    Punkt start{1, 2};  //@a
    Punkt ziel{4, 6};  //@b
    ziel.x = 5;  //@aendern
    std::cout << abstand(start, ziel) << "\n";  //@out
    return 0;
}
`,
      rust: raw`
struct Punkt {  //@typ
    x: i32,
    y: i32,
}

fn abstand(a: &Punkt, b: &Punkt) -> i32 {  //@def
    (a.x - b.x).abs() + (a.y - b.y).abs()  //@ret
}

fn main() {
    let start = Punkt { x: 1, y: 2 };  //@a
    let mut ziel = Punkt { x: 4, y: 6 };  //@b
    ziel.x = 5;  //@aendern
    println!("{}", abstand(&start, &ziel));  //@out
}
`,
    },
  },

  scenes: {
    punkt: {
      title: 'Zwei Werte, die zusammengehören',
      code: 'punkt',
      build: (_p, lang) =>
        trace((t) => {
          const wort = lang === 'python' || lang === 'java' ? 'Klasse' : 'Struct';
          t.step('typ', `Hier entsteht noch kein Wert, sondern ein **Bauplan**: ein neuer Datentyp namens \`Punkt\`, der aus zwei ganzen Zahlen \`x\` und \`y\` besteht. Die einzelnen Bestandteile heißen **Felder**.`, {
            frames: [{ name: 'main', vars: {} }],
          });
          t.step('a', `Nach dem Bauplan wird ein Punkt gebaut. \`start\` ist **eine** Variable, die zwei Werte enthält.`, {
            frames: [{ name: 'main', vars: { 'start.x': 1, 'start.y': 2 } }],
          });
          t.step('b', 'Ein zweiter Punkt nach demselben Bauplan, mit eigenen Werten.', {
            frames: [{ name: 'main', vars: { 'start.x': 1, 'start.y': 2, 'ziel.x': 4, 'ziel.y': 6 } }],
          });
          t.step('aendern', 'Mit dem Punkt-Operator greifst du auf ein einzelnes Feld zu: erst die Variable, dann ein Punkt, dann der Feldname.', {
            frames: [{ name: 'main', vars: { 'start.x': 1, 'start.y': 2, 'ziel.x': 5, 'ziel.y': 6 } }],
          });
          t.step('out', `Die Funktion bekommt zwei Punkte statt vier loser Zahlen. Niemand kann versehentlich das x des einen mit dem y des anderen verwechseln.`, {
            frames: [{ name: 'main', vars: { 'start.x': 1, 'start.y': 2, 'ziel.x': 5, 'ziel.y': 6 } }],
          });
          t.step('def', `In der Funktion heißen die beiden Punkte \`a\` und \`b\`.`, {
            frames: [
              { name: 'main', vars: { 'start.x': 1, 'start.y': 2, 'ziel.x': 5, 'ziel.y': 6 } },
              { name: 'abstand', vars: { 'a.x': 1, 'a.y': 2, 'b.x': 5, 'b.y': 6 } },
            ],
          });
          t.step('ret', 'Der Abstand „über Eck" (wie auf einem Schachbrett ohne Diagonalen): |1 − 5| + |2 − 6| = 4 + 4 = 8.', {
            frames: [
              { name: 'main', vars: { 'start.x': 1, 'start.y': 2, 'ziel.x': 5, 'ziel.y': 6 } },
              { name: 'abstand', vars: { 'a.x': 1, 'a.y': 2, 'b.x': 5, 'b.y': 6 } },
            ],
          });
          t.print(8);
          t.step('out', `Ein eigener Typ macht aus „zwei Zahlen" einen Begriff, mit dem sich denken und arbeiten lässt. Ein solcher Typ heißt hier **${wort}**.`, {
            frames: [{ name: 'main', vars: { 'start.x': 1, 'start.y': 2, 'ziel.x': 5, 'ziel.y': 6 } }],
          });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'rechteck-vergleich',
      title: 'Welches Rechteck ist größer?',
      prompt:
        'Der Typ `Rechteck` und das Einlesen zweier Rechtecke sind vorgegeben. Vervollständige die Funktion `flaeche`, die die Fläche (Breite mal Höhe) eines Rechtecks zurückgibt.\n\nDas Programm gibt dann `Erstes`, `Zweites` oder `Gleich` aus.',
      tests: [
        { name: '3×4 gegen 2×5', stdin: '3 4 2 5\n', expected: 'Erstes\n' },
        { name: '1×1 gegen 2×2', stdin: '1 1 2 2\n', expected: 'Zweites\n' },
        { name: '2×6 gegen 3×4', stdin: '2 6 3 4\n', expected: 'Gleich\n' },
      ],
      hints: ['Auf die Felder greifst du mit dem Punkt zu: `r.breite` und `r.hoehe`.'],
      code: {
        python: raw`
from dataclasses import dataclass

@dataclass
class Rechteck:
    breite: int
    hoehe: int

def flaeche(r):
#:solution
    return r.breite * r.hoehe
#:starter
    # Gib die Fläche von r zurück.
    return 0
#:end

b1, h1, b2, h2 = map(int, input().split())
erstes = Rechteck(b1, h1)
zweites = Rechteck(b2, h2)

if flaeche(erstes) > flaeche(zweites):
    print("Erstes")
elif flaeche(erstes) < flaeche(zweites):
    print("Zweites")
else:
    print("Gleich")
`,
        java: raw`
import java.util.Scanner;

public class Main {
    static class Rechteck {
        int breite;
        int hoehe;

        Rechteck(int breite, int hoehe) {
            this.breite = breite;
            this.hoehe = hoehe;
        }
    }

    static int flaeche(Rechteck r) {
//:solution
        return r.breite * r.hoehe;
//:starter
        // Gib die Fläche von r zurück.
        return 0;
//:end
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Rechteck erstes = new Rechteck(in.nextInt(), in.nextInt());
        Rechteck zweites = new Rechteck(in.nextInt(), in.nextInt());

        if (flaeche(erstes) > flaeche(zweites)) {
            System.out.println("Erstes");
        } else if (flaeche(erstes) < flaeche(zweites)) {
            System.out.println("Zweites");
        } else {
            System.out.println("Gleich");
        }
    }
}
`,
        c: raw`
#include <stdio.h>

struct Rechteck {
    int breite;
    int hoehe;
};

int flaeche(struct Rechteck r) {
//:solution
    return r.breite * r.hoehe;
//:starter
    // Gib die Fläche von r zurück.
    (void)r;
    return 0;
//:end
}

int main(void) {
    struct Rechteck erstes, zweites;
    scanf("%d %d %d %d", &erstes.breite, &erstes.hoehe, &zweites.breite, &zweites.hoehe);

    if (flaeche(erstes) > flaeche(zweites)) {
        printf("Erstes\n");
    } else if (flaeche(erstes) < flaeche(zweites)) {
        printf("Zweites\n");
    } else {
        printf("Gleich\n");
    }
    return 0;
}
`,
        cpp: raw`
#include <iostream>

struct Rechteck {
    int breite;
    int hoehe;
};

int flaeche(Rechteck r) {
//:solution
    return r.breite * r.hoehe;
//:starter
    // Gib die Fläche von r zurück.
    (void)r;
    return 0;
//:end
}

int main() {
    Rechteck erstes, zweites;
    std::cin >> erstes.breite >> erstes.hoehe >> zweites.breite >> zweites.hoehe;

    if (flaeche(erstes) > flaeche(zweites)) {
        std::cout << "Erstes\n";
    } else if (flaeche(erstes) < flaeche(zweites)) {
        std::cout << "Zweites\n";
    } else {
        std::cout << "Gleich\n";
    }
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

struct Rechteck {
    breite: i32,
    hoehe: i32,
}

fn flaeche(r: &Rechteck) -> i32 {
//:solution
    r.breite * r.hoehe
//:starter
    // Gib die Fläche von r zurück.
    let _ = r;
    0
//:end
}

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut z = eingabe.split_whitespace().map(|x| x.parse::<i32>().unwrap());
    let erstes = Rechteck { breite: z.next().unwrap(), hoehe: z.next().unwrap() };
    let zweites = Rechteck { breite: z.next().unwrap(), hoehe: z.next().unwrap() };

    if flaeche(&erstes) > flaeche(&zweites) {
        println!("Erstes");
    } else if flaeche(&erstes) < flaeche(&zweites) {
        println!("Zweites");
    } else {
        println!("Gleich");
    }
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'warum',
      title: 'Wozu der Aufwand?',
      question:
        'Eine Funktion zum Versenden eines Pakets hat die Parameter `strasse1, plz1, ort1, strasse2, plz2, ort2`. Was ist der wichtigste Vorteil, stattdessen zwei Werte vom Typ `Adresse` zu übergeben?',
      options: [
        'Das Programm läuft dadurch deutlich schneller.',
        'Zusammengehörige Werte bleiben zusammen und können nicht vertauscht oder einzeln vergessen werden.',
        'Structs verbrauchen weniger Speicher als einzelne Variablen.',
        'Nur so lassen sich Texte und Zahlen in einer Funktion mischen.',
      ],
      correct: 1,
      explain:
        'Ein eigener Typ hält zusammen, was zusammengehört. Sechs gleichartige Parameter in der richtigen Reihenfolge zu übergeben ist fehleranfällig; zwei Adressen sind es nicht. Außerdem bekommt der Begriff „Adresse" einen Namen, und kommt später ein Feld hinzu (etwa das Land), muss keine Funktionssignatur geändert werden.',
    },
    {
      kind: 'quiz',
      id: 'bauplan',
      title: 'Bauplan und Bauwerk',
      question: 'Was beschreibt den Unterschied zwischen dem Typ `Punkt` und der Variable `start` am besten?',
      options: [
        '`Punkt` ist der Bauplan, `start` ist ein nach diesem Plan gebauter Wert – davon kann es beliebig viele geben.',
        '`Punkt` ist ein besonders großer Wert, `start` ein kleiner.',
        '`Punkt` existiert nur zur Laufzeit, `start` nur beim Kompilieren.',
        'Es gibt keinen Unterschied, beides sind Variablen.',
      ],
      correct: 0,
      explain:
        'Die Typdefinition legt nur fest, welche Felder es gibt. Speicher für konkrete Zahlen wird erst belegt, wenn ein Wert dieses Typs entsteht. Jeder dieser Werte hat seine eigenen Feldinhalte.',
    },
  ],
};

export default lesson;
