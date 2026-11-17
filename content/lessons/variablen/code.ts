import { raw } from '../../types.ts';
import type { Lang, LessonCode } from '../../types.ts';
import { trace } from '../../util.ts';

const TYP: Record<Lang, { int: string; float: string; str: string }> = {
  python: { int: 'int', float: 'float', str: 'str' },
  java: { int: 'int', float: 'double', str: 'String' },
  c: { int: 'int', float: 'double', str: 'char*' },
  cpp: { int: 'int', float: 'double', str: 'std::string' },
  rust: { int: 'i32', float: 'f64', str: '&str' },
  sql: { int: '', float: '', str: '' },
  bash: { int: '', float: '', str: '' },
};

const lesson: LessonCode = {
  snippets: {
    steckbrief: {
      python: raw`
alter = 16  #@a
alter = alter + 1  #@b
groesse = 1.72  #@c
name = "Mia"  #@d
print(name, "ist", alter, "Jahre alt und", groesse, "m groß")  #@e
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int alter = 16;  //@a
        alter = alter + 1;  //@b
        double groesse = 1.72;  //@c
        String name = "Mia";  //@d
        System.out.println(name + " ist " + alter + " Jahre alt und " + groesse + " m groß");  //@e
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int alter = 16;  //@a
    alter = alter + 1;  //@b
    double groesse = 1.72;  //@c
    const char *name = "Mia";  //@d
    printf("%s ist %d Jahre alt und %.2f m groß\n", name, alter, groesse);  //@e
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <string>

int main() {
    int alter = 16;  //@a
    alter = alter + 1;  //@b
    double groesse = 1.72;  //@c
    std::string name = "Mia";  //@d
    std::cout << name << " ist " << alter << " Jahre alt und " << groesse << " m groß\n";  //@e
    return 0;
}
`,
      rust: raw`
fn main() {
    let mut alter = 16;  //@a
    alter = alter + 1;  //@b
    let groesse = 1.72;  //@c
    let name = "Mia";  //@d
    println!("{} ist {} Jahre alt und {} m groß", name, alter, groesse);  //@e
}
`,
    },
    kopie: {
      python: raw`
a = 5
b = a
a = a + 2
print(a)
print(b)
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = a;
        a = a + 2;
        System.out.println(a);
        System.out.println(b);
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int a = 5;
    int b = a;
    a = a + 2;
    printf("%d\n", a);
    printf("%d\n", b);
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    int a = 5;
    int b = a;
    a = a + 2;
    std::cout << a << "\n";
    std::cout << b << "\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    let mut a = 5;
    let b = a;
    a = a + 2;
    println!("{}", a);
    println!("{}", b);
}
`,
    },
  },

  scenes: {
    steckbrief: {
      title: 'Variablen entstehen und ändern sich',
      code: 'steckbrief',
      build: (_p, lang) =>
        trace((t) => {
          const ty = TYP[lang];
          const dyn = lang === 'python';
          const int = (v: number) => ({ v, type: ty.int });
          t.step(
            'a',
            dyn
              ? 'Eine Variable entsteht: Python legt den Wert 16 ab und klebt den Namen `alter` daran. Den Typ (`int`, ganze Zahl) erkennt Python selbst am Wert.'
              : lang === 'rust'
                ? '`let` legt eine Variable an. Rust erkennt am Wert 16 selbst, dass es eine ganze Zahl ist (`i32`). Das `mut` erlaubt, sie später zu ändern – ohne `mut` wäre sie für immer 16.'
                : `Eine Variable entsteht. Das \`${ty.int}\` davor legt den Typ fest: In diesem Speicherplatz dürfen nur ganze Zahlen liegen – für immer.`,
            { frames: [{ name: 'main', vars: { alter: int(16) } }] },
          );
          t.step(
            'b',
            'Das `=` ist keine Gleichung, sondern ein Auftrag: **Erst** wird die rechte Seite ausgerechnet (16 + 1), **dann** wird das Ergebnis in `alter` gespeichert. Der alte Wert ist weg.',
            { frames: [{ name: 'main', vars: { alter: int(17) } }] },
          );
          t.step(
            'c',
            `Eine zweite Variable, diesmal mit Nachkommastellen. Kommazahlen haben einen eigenen Typ: \`${ty.float}\`. Geschrieben wird mit Punkt statt Komma.`,
            { frames: [{ name: 'main', vars: { alter: int(17), groesse: { v: 1.72, type: ty.float } } }] },
          );
          t.step('d', `Text steht in Anführungszeichen und hat den Typ \`${ty.str}\` (englisch „string": Zeichenkette).`, {
            frames: [{ name: 'main', vars: { alter: int(17), groesse: { v: 1.72, type: ty.float }, name: { v: '"Mia"', type: ty.str } } }],
          });
          t.print('Mia ist 17 Jahre alt und 1.72 m groß');
          t.step('e', 'Beim Ausgeben schlägt der Computer unter jedem Namen nach und setzt den aktuellen Wert ein.', {
            frames: [{ name: 'main', vars: { alter: int(17), groesse: { v: 1.72, type: ty.float }, name: { v: '"Mia"', type: ty.str } } }],
          });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'rechteck',
      title: 'Rechteck berechnen',
      prompt:
        'Das Programm liest Breite und Höhe eines Rechtecks ein (das Einlesen ist vorgegeben – wie es funktioniert, klärt die nächste Lektion).\n\nBerechne die Fläche (`breite * hoehe`) und den Umfang (`2 * (breite + hoehe)`) und speichere sie in den Variablen `flaeche` und `umfang`.',
      tests: [
        { name: 'Breite 3, Höhe 4', stdin: '3\n4\n', expected: 'Fläche: 12\nUmfang: 14\n' },
        { name: 'Breite 10, Höhe 2', stdin: '10\n2\n', expected: 'Fläche: 20\nUmfang: 24\n' },
        { name: 'Quadrat mit Seite 7', stdin: '7\n7\n', expected: 'Fläche: 49\nUmfang: 28\n' },
      ],
      hints: [
        'Ersetze die beiden Nullen durch Rechenausdrücke. Das Malzeichen ist `*`.',
        'Für den Umfang brauchst du Klammern: `2 * (breite + hoehe)`. Ohne Klammern würde erst multipliziert.',
      ],
      code: {
        python: raw`
breite = int(input())
hoehe = int(input())

#:solution
flaeche = breite * hoehe
umfang = 2 * (breite + hoehe)
#:starter
# Berechne die beiden Werte aus breite und hoehe.
flaeche = 0
umfang = 0
#:end

print("Fläche:", flaeche)
print("Umfang:", umfang)
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int breite = in.nextInt();
        int hoehe = in.nextInt();

//:solution
        int flaeche = breite * hoehe;
        int umfang = 2 * (breite + hoehe);
//:starter
        // Berechne die beiden Werte aus breite und hoehe.
        int flaeche = 0;
        int umfang = 0;
//:end

        System.out.println("Fläche: " + flaeche);
        System.out.println("Umfang: " + umfang);
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int breite, hoehe;
    scanf("%d %d", &breite, &hoehe);

//:solution
    int flaeche = breite * hoehe;
    int umfang = 2 * (breite + hoehe);
//:starter
    // Berechne die beiden Werte aus breite und hoehe.
    int flaeche = 0;
    int umfang = 0;
//:end

    printf("Fläche: %d\n", flaeche);
    printf("Umfang: %d\n", umfang);
    return 0;
}
`,
        cpp: raw`
#include <iostream>

int main() {
    int breite, hoehe;
    std::cin >> breite >> hoehe;

//:solution
    int flaeche = breite * hoehe;
    int umfang = 2 * (breite + hoehe);
//:starter
    // Berechne die beiden Werte aus breite und hoehe.
    int flaeche = 0;
    int umfang = 0;
//:end

    std::cout << "Fläche: " << flaeche << "\n";
    std::cout << "Umfang: " << umfang << "\n";
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn main() {
    // Eingabe einlesen (vorgegeben)
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut zahlen = eingabe.split_whitespace().map(|z| z.parse::<i32>().unwrap());
    let breite = zahlen.next().unwrap();
    let hoehe = zahlen.next().unwrap();

//:solution
    let flaeche = breite * hoehe;
    let umfang = 2 * (breite + hoehe);
//:starter
    // Berechne die beiden Werte aus breite und hoehe.
    let flaeche = 0;
    let umfang = 0;
//:end

    println!("Fläche: {}", flaeche);
    println!("Umfang: {}", umfang);
}
`,
      },
    },
    {
      kind: 'predict',
      id: 'kopie',
      title: 'Kopie oder Verbindung?',
      code: 'kopie',
      expected: '7\n5\n',
      explain:
        'In der zweiten Zeile wird der **Wert** von `a` (die 5) nach `b` kopiert. Danach haben die beiden Variablen nichts mehr miteinander zu tun: Wenn `a` sich ändert, bleibt `b` bei 5.',
    },
    {
      kind: 'quiz',
      id: 'statisch',
      title: 'Feste und flexible Typen',
      question:
        'In Java, C, C++ und Rust hat jede Variable einen festen Typ. Was passiert, wenn du einer Ganzzahl-Variable später einen Text zuweist?',
      options: [
        'Der Text wird automatisch in eine Zahl umgewandelt.',
        'Die Variable wechselt einfach ihren Typ.',
        'Der Compiler lehnt das Programm ab – es startet gar nicht erst.',
        'Das Programm stürzt beim Ausführen an dieser Stelle ab.',
      ],
      correct: 2,
      explain:
        'Diese Sprachen prüfen Typen vor dem Start (**statische Typisierung**). Python dagegen ist **dynamisch typisiert**: Dort klebt der Typ am Wert, nicht an der Variable, und `x = 5` gefolgt von `x = "fünf"` ist erlaubt – mit dem Risiko, dass Typfehler erst beim Ausführen auffallen.',
    },
  ],
};

export default lesson;
