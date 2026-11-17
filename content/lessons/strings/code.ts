import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  snippets: {
    grundlagen: {
      python: raw`
name = "Ada"
gruss = "Hallo " + name

print(gruss)
print(len(name))
print(name[0])
print(name.upper())
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        String name = "Ada";
        String gruss = "Hallo " + name;

        System.out.println(gruss);
        System.out.println(name.length());
        System.out.println(name.charAt(0));
        System.out.println(name.toUpperCase());
    }
}
`,
      c: raw`
#include <ctype.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    char name[] = "Ada";
    char gruss[32] = "Hallo ";
    strcat(gruss, name);  // name hinten anhängen – der Platz muss reichen!

    printf("%s\n", gruss);
    printf("%zu\n", strlen(name));
    printf("%c\n", name[0]);

    for (size_t i = 0; i < strlen(name); i++) {
        name[i] = toupper(name[i]);
    }
    printf("%s\n", name);
    return 0;
}
`,
      cpp: raw`
#include <cctype>
#include <iostream>
#include <string>

int main() {
    std::string name = "Ada";
    std::string gruss = "Hallo " + name;

    std::cout << gruss << "\n";
    std::cout << name.size() << "\n";
    std::cout << name[0] << "\n";

    for (char &zeichen : name) {
        zeichen = std::toupper(zeichen);
    }
    std::cout << name << "\n";
    return 0;
}
`,
      rust: raw`
fn main() {
    let name = "Ada";
    let gruss = format!("Hallo {}", name);

    println!("{}", gruss);
    println!("{}", name.len());
    println!("{}", name.chars().next().unwrap());
    println!("{}", name.to_uppercase());
}
`,
    },
    zaehle: {
      python: raw`
wort = "ANANAS"  #@init
anzahl = 0  #@null

for zeichen in wort:  #@kopf
    if zeichen == "A":  #@if
        anzahl = anzahl + 1  #@plus

print(anzahl)  #@out
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        String wort = "ANANAS";  //@init
        int anzahl = 0;  //@null

        for (int i = 0; i < wort.length(); i++) {  //@kopf
            if (wort.charAt(i) == 'A') {  //@if
                anzahl = anzahl + 1;  //@plus
            }
        }

        System.out.println(anzahl);  //@out
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    char wort[] = "ANANAS";  //@init
    int anzahl = 0;  //@null

    for (int i = 0; wort[i] != '\0'; i++) {  //@kopf
        if (wort[i] == 'A') {  //@if
            anzahl = anzahl + 1;  //@plus
        }
    }

    printf("%d\n", anzahl);  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <string>

int main() {
    std::string wort = "ANANAS";  //@init
    int anzahl = 0;  //@null

    for (char zeichen : wort) {  //@kopf
        if (zeichen == 'A') {  //@if
            anzahl = anzahl + 1;  //@plus
        }
    }

    std::cout << anzahl << "\n";  //@out
    return 0;
}
`,
      rust: raw`
fn main() {
    let wort = "ANANAS";  //@init
    let mut anzahl = 0;  //@null

    for zeichen in wort.chars() {  //@kopf
        if zeichen == 'A' {  //@if
            anzahl = anzahl + 1;  //@plus
        }
    }

    println!("{}", anzahl);  //@out
}
`,
    },
  },

  scenes: {
    zaehle: {
      title: 'Zeichen für Zeichen durch ein Wort',
      code: 'zaehle',
      build: (_p, lang) =>
        trace((t) => {
          const wort = 'ANANAS';
          const cells: string[] = wort.split('');
          if (lang === 'c') cells.push('\\0');
          const label = lang === 'c' ? 'wort (im Speicher: 7 Zeichen)' : 'wort';
          let anzahl = 0;
          t.step(
            'init',
            lang === 'c'
              ? 'Ein Text ist in C ein Array aus einzelnen Zeichen. Hinter dem letzten sichtbaren Zeichen legt C automatisch ein unsichtbares **Nullzeichen** `\\0` ab. Nur daran erkennt man, wo der Text endet.'
              : 'Ein Text ist eine Folge einzelner Zeichen. Jedes hat eine Position, den **Index** – und gezählt wird ab 0.',
            { array: { label, cells } },
          );
          t.step('null', 'Der Zähler beginnt bei 0.', { array: { label, cells }, frames: [{ name: 'main', vars: { anzahl } }] });
          for (let i = 0; i < wort.length; i++) {
            const z = wort[i];
            t.step('kopf', `Die Schleife nimmt sich das nächste Zeichen vor: \`${z}\` an Position ${i}.`, {
              array: { label, cells, pointers: { i }, hi: [i] },
              frames: [{ name: 'main', vars: { anzahl } }],
            });
            const ja = z === 'A';
            t.step('if', `Ist \`${z}\` ein \`A\`? ${ja ? '**Ja.**' : 'Nein – weiter zum nächsten Zeichen.'}`, {
              array: { label, cells, pointers: { i }, hi: [i] },
              frames: [{ name: 'main', vars: { anzahl } }],
            });
            if (ja) {
              anzahl++;
              t.step('plus', `Der Zähler steigt auf ${anzahl}.`, {
                array: { label, cells, pointers: { i }, hi: [i] },
                frames: [{ name: 'main', vars: { anzahl } }],
              });
            }
          }
          if (lang === 'c') {
            t.step('kopf', 'Position 6 enthält das Nullzeichen. Die Bedingung `wort[i] != \'\\0\'` ist jetzt falsch: Ende der Schleife.', {
              array: { label, cells, pointers: { i: 6 }, hi: [6] },
              frames: [{ name: 'main', vars: { anzahl } }],
            });
          }
          t.print(anzahl);
          t.step('out', 'Alle Zeichen wurden besucht. Dieses Muster – einmal durchgehen und dabei etwas zählen oder sammeln – wirst du ständig brauchen.', {
            array: { label, cells },
            frames: [{ name: 'main', vars: { anzahl } }],
          });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'vokale',
      title: 'Vokale zählen',
      prompt:
        'Das Programm liest ein Wort aus Kleinbuchstaben. Zähle, wie viele Vokale (`a`, `e`, `i`, `o`, `u`) es enthält. Der Startcode zählt bisher nur das `a`.',
      tests: [
        { name: 'programmieren', stdin: 'programmieren\n', expected: '5\n' },
        { name: 'rhythm', stdin: 'rhythm\n', expected: '0\n' },
        { name: 'aeiou', stdin: 'aeiou\n', expected: '5\n' },
        { name: 'banane', stdin: 'banane\n', expected: '3\n' },
      ],
      hints: [
        'Die Bedingung muss für fünf verschiedene Buchstaben wahr werden. Verknüpfe mehrere Vergleiche mit „oder".',
        'Also sinngemäß: Zeichen ist `a` **oder** Zeichen ist `e` **oder** … und so weiter.',
      ],
      code: {
        python: raw`
wort = input()
anzahl = 0

for zeichen in wort:
#:solution
    if zeichen == "a" or zeichen == "e" or zeichen == "i" or zeichen == "o" or zeichen == "u":
#:starter
    if zeichen == "a":
#:end
        anzahl = anzahl + 1

print(anzahl)
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String wort = in.next();
        int anzahl = 0;

        for (int i = 0; i < wort.length(); i++) {
            char zeichen = wort.charAt(i);
//:solution
            if (zeichen == 'a' || zeichen == 'e' || zeichen == 'i' || zeichen == 'o' || zeichen == 'u') {
//:starter
            if (zeichen == 'a') {
//:end
                anzahl = anzahl + 1;
            }
        }

        System.out.println(anzahl);
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    char wort[101];
    scanf("%100s", wort);
    int anzahl = 0;

    for (int i = 0; wort[i] != '\0'; i++) {
        char zeichen = wort[i];
//:solution
        if (zeichen == 'a' || zeichen == 'e' || zeichen == 'i' || zeichen == 'o' || zeichen == 'u') {
//:starter
        if (zeichen == 'a') {
//:end
            anzahl = anzahl + 1;
        }
    }

    printf("%d\n", anzahl);
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <string>

int main() {
    std::string wort;
    std::cin >> wort;
    int anzahl = 0;

    for (char zeichen : wort) {
//:solution
        if (zeichen == 'a' || zeichen == 'e' || zeichen == 'i' || zeichen == 'o' || zeichen == 'u') {
//:starter
        if (zeichen == 'a') {
//:end
            anzahl = anzahl + 1;
        }
    }

    std::cout << anzahl << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let wort = zeile.trim();
    let mut anzahl = 0;

    for zeichen in wort.chars() {
//:solution
        if zeichen == 'a' || zeichen == 'e' || zeichen == 'i' || zeichen == 'o' || zeichen == 'u' {
//:starter
        if zeichen == 'a' {
//:end
            anzahl = anzahl + 1;
        }
    }

    println!("{}", anzahl);
}
`,
      },
    },
    {
      kind: 'code',
      id: 'umdrehen',
      title: 'Wort umdrehen',
      prompt: 'Das Programm liest ein Wort. Gib es rückwärts aus: Aus `hallo` wird `ollah`.',
      tests: [
        { name: 'hallo', stdin: 'hallo\n', expected: 'ollah\n' },
        { name: 'abc', stdin: 'abc\n', expected: 'cba\n' },
        { name: 'Ein einzelnes Zeichen', stdin: 'x\n', expected: 'x\n' },
        { name: 'programm', stdin: 'programm\n', expected: 'mmargorp\n' },
      ],
      hints: [
        'Zwei Wege führen zum Ziel: die Zeichen von hinten nach vorn durchgehen – oder von vorn nach hinten gehen und jedes Zeichen **vor** das bisherige Ergebnis setzen.',
        'Der Index des letzten Zeichens ist die Länge minus 1.',
      ],
      code: {
        python: raw`
wort = input()

#:solution
umgedreht = ""
for zeichen in wort:
    umgedreht = zeichen + umgedreht
#:starter
# Baue das umgedrehte Wort Zeichen für Zeichen auf.
umgedreht = wort
#:end

print(umgedreht)
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String wort = in.next();

//:solution
        String umgedreht = "";
        for (int i = 0; i < wort.length(); i++) {
            umgedreht = wort.charAt(i) + umgedreht;
        }
//:starter
        // Baue das umgedrehte Wort Zeichen für Zeichen auf.
        String umgedreht = wort;
//:end

        System.out.println(umgedreht);
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char wort[101];
    scanf("%100s", wort);

//:solution
    int laenge = strlen(wort);
    for (int i = laenge - 1; i >= 0; i--) {
        putchar(wort[i]);
    }
    putchar('\n');
//:starter
    // Gib die Zeichen von hinten nach vorn aus.
    // strlen(wort) liefert die Länge, putchar(zeichen) gibt ein einzelnes Zeichen aus.
    printf("%s\n", wort);
//:end
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <string>

int main() {
    std::string wort;
    std::cin >> wort;

//:solution
    std::string umgedreht = "";
    for (char zeichen : wort) {
        umgedreht = zeichen + umgedreht;
    }
//:starter
    // Baue das umgedrehte Wort Zeichen für Zeichen auf.
    std::string umgedreht = wort;
//:end

    std::cout << umgedreht << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let wort = zeile.trim();

//:solution
    let mut umgedreht = String::new();
    for zeichen in wort.chars() {
        umgedreht = format!("{}{}", zeichen, umgedreht);
    }
//:starter
    // Baue das umgedrehte Wort Zeichen für Zeichen auf.
    let umgedreht = wort.to_string();
//:end

    println!("{}", umgedreht);
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'text-plus-text',
      title: 'Text ist keine Zahl',
      question:
        'Ein Programm liest zwei Eingaben, `5` und `3`, und verknüpft sie mit `+` – **ohne** sie vorher in Zahlen umzuwandeln. Was kommt in Python oder Java heraus?',
      options: ['`8`', '`53`', '`15`', 'Immer ein Fehler'],
      correct: 1,
      explain:
        'Eingaben sind Text. Zwischen zwei Texten bedeutet `+` „hintereinanderhängen": Aus `"5"` und `"3"` wird `"53"`. Erst nach der Umwandlung in Zahlen wird gerechnet. C und Rust sind hier strenger und erlauben `+` zwischen zwei Texten gar nicht erst.',
    },
  ],
};

export default lesson;
