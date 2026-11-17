import { raw } from '../../types.ts';
import type { LessonCode, Step, TableView } from '../../types.ts';

const sym = (rows: (string | number)[][], hi?: number[]): TableView => ({ name: 'Symboltabelle', columns: ['Name', 'Art', 'Typ', 'Bereich'], rows, hi });

const lesson: LessonCode = {
  // "unbekannt" scheitert absichtlich.
  noVerify: ['unbekannt'],

  snippets: {
    unbekannt: {
      python: raw`
def flaeche(breite, hoehe):
    return breite * hohe   # Tippfehler: hohe statt hoehe

print("Das Programm startet …")
print(flaeche(3, 4))
`,
      java: raw`
public class Main {
    static int flaeche(int breite, int hoehe) {
        return breite * hohe;   // Tippfehler: hohe statt hoehe
    }

    public static void main(String[] args) {
        System.out.println("Das Programm startet …");
        System.out.println(flaeche(3, 4));
    }
}
`,
      c: raw`
#include <stdio.h>

int flaeche(int breite, int hoehe) {
    return breite * hohe;   // Tippfehler: hohe statt hoehe
}

int main(void) {
    printf("Das Programm startet …\n");
    printf("%d\n", flaeche(3, 4));
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int flaeche(int breite, int hoehe) {
    return breite * hohe;   // Tippfehler: hohe statt hoehe
}

int main() {
    std::cout << "Das Programm startet …\n";
    std::cout << flaeche(3, 4) << "\n";
    return 0;
}
`,
      rust: raw`
fn flaeche(breite: i32, hoehe: i32) -> i32 {
    breite * hohe   // Tippfehler: hohe statt hoehe
}

fn main() {
    println!("Das Programm startet …");
    println!("{}", flaeche(3, 4));
}
`,
    },
  },

  scenes: {
    symbole: {
      title: 'Der Compiler führt Buch',
      build: (): Step[] => {
        const code = [
          'int rabatt = 10;',
          '',
          'int preis(int netto) {',
          '    int ergebnis = netto - rabatt;',
          '    return ergebnis * mwst;',
          '}',
        ];
        const show = (k: number) => ({ term: { lines: code.map((c, i) => ({ out: `${i === k ? '▶ ' : '  '}${c}` })) } });
        return [
          { note: 'Nach dem Parsen kennt der Compiler die Struktur, aber noch nicht die Bedeutung. Jetzt geht er den Syntaxbaum durch und trägt jeden Namen, der vereinbart wird, in eine **Symboltabelle** ein.', ...show(-1), tables: [sym([])] },
          { note: 'Eine globale Variable: Name, Art, Typ und Gültigkeitsbereich werden notiert.', ...show(0), tables: [sym([['rabatt', 'Variable', 'int', 'global']], [0])] },
          { note: 'Eine Funktion – mit ihrer Signatur, damit spätere Aufrufe geprüft werden können. Ihr Rumpf öffnet einen **neuen Bereich**, in dem der Parameter `netto` lebt.', ...show(2), tables: [sym([['rabatt', 'Variable', 'int', 'global'], ['preis', 'Funktion', 'int(int)', 'global'], ['netto', 'Parameter', 'int', 'preis'], ], [1, 2])] },
          {
            note: 'Für jeden **benutzten** Namen wird nachgeschlagen: zuerst im innersten Bereich, dann nach außen. `netto` steht in `preis`, `rabatt` global. Beide sind `int`, also ist `-` erlaubt und das Ergebnis ist `int`. Der neue Name `ergebnis` kommt hinzu.',
            ...show(3),
            tables: [sym([['rabatt', 'Variable', 'int', 'global'], ['preis', 'Funktion', 'int(int)', 'global'], ['netto', 'Parameter', 'int', 'preis'], ['ergebnis', 'Variable', 'int', 'preis']], [0, 2, 3])],
          },
          {
            note: '`mwst` steht in keinem Bereich. Der Compiler meldet: **unbekannter Name** – mit Datei, Zeile und oft einem Vorschlag, welcher ähnliche Name gemeint sein könnte. Ebenso würde er melden, wenn ein Typ nicht passt oder eine Funktion mit falschen Argumenten aufgerufen wird.',
            ...show(4),
            tables: [sym([['rabatt', 'Variable', 'int', 'global'], ['preis', 'Funktion', 'int(int)', 'global'], ['netto', 'Parameter', 'int', 'preis'], ['ergebnis', 'Variable', 'int', 'preis']])],
          },
        ];
      },
    },
  },

  exercises: [
    {
      kind: 'quiz',
      id: 'wann-entdeckt',
      title: 'Wann fällt es auf?',
      question:
        'Im Beispiel oben steht ein Tippfehler in einer Funktion. In welcher Sprache gibt das Programm trotzdem zuerst „Das Programm startet …" aus?',
      options: ['In Java', 'In C', 'In Python', 'In Rust'],
      correct: 2,
      explain:
        'Python schlägt Namen erst nach, wenn die Zeile tatsächlich ausgeführt wird. Bis dahin läuft das Programm ganz normal – und eine Funktion, die nie aufgerufen wird, kann einen Tippfehler jahrelang verstecken. Java, C, C++ und Rust lösen alle Namen beim Übersetzen auf und starten gar nicht erst. Werkzeuge wie *pyflakes* oder *mypy* holen diese Prüfung für Python nach.',
    },
    {
      kind: 'quiz',
      id: 'inferenz',
      title: 'Typen herleiten',
      question: 'In Rust schreibt man `let x = 5;` ohne Typ. Woher kennt der Compiler den Typ von `x`?',
      options: [
        'Er rät zufällig.',
        'Er leitet ihn in der semantischen Analyse aus dem Wert und aus der späteren Verwendung her (Typinferenz). Fehlt jeder Hinweis, nimmt er `i32`.',
        'Er schaut zur Laufzeit nach.',
        'Variablen ohne Typ sind in Rust dynamisch.',
      ],
      correct: 1,
      explain:
        'Bei der **Typinferenz** sammelt der Compiler Bedingungen („`x` wird mit einem `u64` addiert, also muss `x` ein `u64` sein") und löst sie wie ein Gleichungssystem. Der Typ steht danach genauso fest, als hättest du ihn hingeschrieben. Java (`var`), C++ (`auto`) und Python-Prüfwerkzeuge machen dasselbe in kleinerem Umfang.',
    },
  ],
};

export default lesson;
