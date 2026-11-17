import { raw } from '../../types.ts';
import type { Frame, Lang, LessonCode, Step, VarVal } from '../../types.ts';
import { trace } from '../../util.ts';

const MELDUNG: Record<Lang, string> = {
  python: "Fehler: invalid literal for int() with base 10: 'x'",
  java: 'Fehler: For input string: "x"',
  c: 'Fehler: keine Zahl',
  cpp: 'Fehler: stoi: no conversion',
  rust: 'Fehler: invalid digit found in string',
  sql: '',
  bash: '',
};

const lesson: LessonCode = {
  snippets: {
    kette: {
      python: raw`
def lies_zahl(text):  #@lies
    return int(text)  #@wirf

def summe(texte):  #@summe
    gesamt = 0
    for t in texte:
        gesamt += lies_zahl(t)  #@call2
    return gesamt

try:  #@try
    print(summe(["4", "x", "6"]))  #@call1
except ValueError as fehler:  #@fang
    print("Fehler:", fehler)  #@fang
`,
      java: raw`
public class Main {
    static int liesZahl(String text) {  //@lies
        return Integer.parseInt(text);  //@wirf
    }

    static int summe(String[] texte) {  //@summe
        int gesamt = 0;
        for (String t : texte) {
            gesamt += liesZahl(t);  //@call2
        }
        return gesamt;
    }

    public static void main(String[] args) {
        try {  //@try
            System.out.println(summe(new String[] {"4", "x", "6"}));  //@call1
        } catch (NumberFormatException fehler) {  //@fang
            System.out.println("Fehler: " + fehler.getMessage());  //@fang
        }
    }
}
`,
      c: raw`
#include <stdio.h>
#include <stdlib.h>

// Liefert 0 bei Erfolg und -1, wenn text keine ganze Zahl ist.
int lies_zahl(const char *text, int *ergebnis) {  //@lies
    char *ende;
    long wert = strtol(text, &ende, 10);
    if (ende == text || *ende != '\0') {
        return -1;  //@wirf
    }
    *ergebnis = (int) wert;
    return 0;
}

int summe(const char *texte[], int anzahl, int *ergebnis) {  //@summe
    int gesamt = 0;
    for (int i = 0; i < anzahl; i++) {
        int zahl;
        if (lies_zahl(texte[i], &zahl) != 0) {  //@call2
            return -1;  //@weiter
        }
        gesamt += zahl;
    }
    *ergebnis = gesamt;
    return 0;
}

int main(void) {
    const char *texte[] = {"4", "x", "6"};
    int ergebnis;
    if (summe(texte, 3, &ergebnis) != 0) {  //@call1
        printf("Fehler: keine Zahl\n");  //@fang
    } else {
        printf("%d\n", ergebnis);
    }
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

int lies_zahl(const std::string &text) {  //@lies
    return std::stoi(text);  //@wirf
}

int summe(const std::vector<std::string> &texte) {  //@summe
    int gesamt = 0;
    for (const auto &t : texte) {
        gesamt += lies_zahl(t);  //@call2
    }
    return gesamt;
}

int main() {
    try {  //@try
        std::cout << summe({"4", "x", "6"}) << "\n";  //@call1
    } catch (const std::invalid_argument &fehler) {  //@fang
        std::cout << "Fehler: " << fehler.what() << "\n";  //@fang
    }
    return 0;
}
`,
      rust: raw`
use std::num::ParseIntError;

fn lies_zahl(text: &str) -> Result<i32, ParseIntError> {  //@lies
    text.parse::<i32>()  //@wirf
}

fn summe(texte: &[&str]) -> Result<i32, ParseIntError> {  //@summe
    let mut gesamt = 0;
    for t in texte {
        gesamt += lies_zahl(t)?;  //@call2
    }
    Ok(gesamt)
}

fn main() {
    match summe(&["4", "x", "6"]) {  //@call1
        Ok(wert) => println!("{}", wert),
        Err(fehler) => println!("Fehler: {}", fehler),  //@fang
    }
}
`,
    },
  },

  scenes: {
    kette: {
      title: 'Ein Fehler wandert durch den Aufrufstapel',
      code: 'kette',
      build: (_p, lang): Step[] =>
        trace((t) => {
          const exc = lang === 'python' || lang === 'java' || lang === 'cpp';
          const main = (): Frame => ({ name: 'main', vars: {} });
          const summe = (gesamt: VarVal, extra: Frame['vars'] = {}): Frame => ({ name: 'summe', vars: { gesamt, ...extra } });
          const lies = (text: string, extra: Frame['vars'] = {}): Frame => ({ name: lang === 'java' ? 'liesZahl' : 'lies_zahl', vars: { text: `"${text}"`, ...extra } });

          if (exc) {
            t.step('try', 'Code, bei dem etwas schiefgehen kann, steht in einem `try`-Block. Dahinter steht, wer sich um welche Fehlerart kümmert.', { frames: [main()] });
          }
          t.step('call1', 'Die Summe dreier Texte soll berechnet werden. Der zweite ist keine Zahl.', { frames: [main()] });
          t.step('summe', '`summe` geht die Texte der Reihe nach durch.', { frames: [main(), summe(0)] });
          t.step('call2', 'Erster Text: `"4"`.', { frames: [main(), summe(0), lies('4')] });
          t.step('lies', 'Die Umwandlung klappt.', { frames: [main(), summe(0), lies('4')] });
          t.step('call2', 'Zurück in `summe`: gesamt ist 4.', { frames: [main(), summe(4)] });
          t.step('call2', 'Zweiter Text: `"x"`.', { frames: [main(), summe(4), lies('x')] });

          if (exc) {
            t.step(
              'wirf',
              `\`"x"\` lässt sich nicht umwandeln. Die Bibliotheksfunktion **wirft eine Ausnahme** (${lang === 'python' ? '`ValueError`' : lang === 'java' ? '`NumberFormatException`' : '`std::invalid_argument`'}). Ab hier läuft kein normaler Code mehr weiter.`,
              { frames: [main(), summe(4), lies('x', { fehler: { v: 'Ausnahme', state: 'dangling' } })] },
            );
            t.step(
              'call2',
              'Die Ausnahme fliegt nach oben. `lies_zahl` wird sofort verlassen. Auch `summe` hat keinen `try`-Block – also wird auch sie mitten in der Schleife abgebrochen. Ihr halbfertiges `gesamt` ist verloren.',
              { frames: [main(), summe(4, { fehler: { v: 'Ausnahme', state: 'dangling' } })] },
            );
            t.print(MELDUNG[lang]);
            t.step('fang', 'In `main` passt der `catch`/`except`-Block zur Fehlerart. Er fängt die Ausnahme, und das Programm läuft dort kontrolliert weiter. Die Zwischenebenen mussten sich um nichts kümmern.', {
              frames: [main()],
            });
            return;
          }

          if (lang === 'c') {
            t.step('wirf', 'Keine Zahl. C kennt keine Ausnahmen: Die Funktion meldet den Fehler über ihren **Rückgabewert** (-1). Das eigentliche Ergebnis wird über einen Zeiger geliefert.', {
              frames: [main(), summe(4), lies('x', { 'Rückgabe': -1 })],
            });
            t.step('call2', '`summe` **muss** den Rückgabewert prüfen. Vergisst man das, rechnet das Programm mit einem zufälligen Wert weiter – und niemand merkt es.', {
              frames: [main(), summe(4, { 'Rückgabe': -1 })],
            });
            t.step('weiter', 'Auch `summe` kann den Fehler nicht beheben und reicht ihn mit -1 nach oben weiter. Diese Prüfung muss auf **jeder** Ebene von Hand geschrieben werden.', {
              frames: [main(), summe(4, { 'Rückgabe': -1 })],
            });
            t.print(MELDUNG.c);
            t.step('fang', '`main` prüft den Rückgabewert und meldet den Fehler. Explizit und ohne Magie – aber der eigentliche Programmablauf verschwindet leicht zwischen all den Prüfungen.', { frames: [main()] });
            return;
          }

          // Rust
          t.step('wirf', '`parse` scheitert. Rust kennt keine Ausnahmen: Die Funktion liefert ein `Result` – entweder `Ok(wert)` oder `Err(fehler)`. Hier ist es ein `Err`.', {
            frames: [main(), summe(4), lies('x', { 'Rückgabe': 'Err(…)' })],
          });
          t.step('call2', 'Das Fragezeichen `?` heißt: „Ist es ein `Err`, gib ihn sofort an meinen Aufrufer weiter." Ein Zeichen statt einer `if`-Prüfung – aber sichtbar im Code. Der Fehler kann nicht übersehen werden: Ohne `?` oder eine Behandlung käme man gar nicht an die Zahl heran.', {
            frames: [main(), summe(4, { 'Rückgabe': 'Err(…)' })],
          });
          t.print(MELDUNG.rust);
          t.step('fang', '`main` untersucht das Ergebnis mit `match` und behandelt beide Fälle. Der Compiler verlangt, dass kein Fall vergessen wird.', { frames: [main()] });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'robust',
      title: 'Robust einlesen',
      prompt:
        'Das Programm liest mehrere Wörter und addiert alle, die ganze Zahlen sind. Für jedes andere Wort soll es `ungültig: <wort>` ausgeben und weitermachen. Am Ende steht `Summe: <ergebnis>`.\n\nDer Startcode wandelt jedes Wort ohne Prüfung um – bei einem ungültigen Wort stürzt er ab oder rechnet falsch. Fange den Fehler ab.',
      tests: [
        { name: 'Ein ungültiges Wort', stdin: '4 abc 6\n', expected: 'ungültig: abc\nSumme: 10\n' },
        { name: 'Nur Zahlen', stdin: '1 2 3\n', expected: 'Summe: 6\n' },
        { name: 'Mehrere ungültige', stdin: 'x7 10 zehn -3\n', expected: 'ungültig: x7\nungültig: zehn\nSumme: 7\n' },
      ],
      hints: [
        'Python: `try:` … `except ValueError:`. Java: `try` … `catch (NumberFormatException e)`. C++: `try` … `catch (const std::invalid_argument &e)`.',
        'C: `strtol(wort, &ende, 10)` – ist danach `ende == wort` oder `*ende != \'\\0\'`, war es keine Zahl. Rust: `match wort.parse::<i32>() { Ok(z) => …, Err(_) => … }`.',
      ],
      code: {
        python: raw`
summe = 0
for wort in input().split():
#:solution
    try:
        summe += int(wort)
    except ValueError:
        print("ungültig:", wort)
#:starter
    summe += int(wort)
#:end
print("Summe:", summe)
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int summe = 0;
        while (in.hasNext()) {
            String wort = in.next();
//:solution
            try {
                summe += Integer.parseInt(wort);
            } catch (NumberFormatException e) {
                System.out.println("ungültig: " + wort);
            }
//:starter
            summe += Integer.parseInt(wort);
//:end
        }
        System.out.println("Summe: " + summe);
    }
}
`,
        c: raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int summe = 0;
    char wort[100];
    while (scanf("%99s", wort) == 1) {
//:solution
        char *ende;
        long wert = strtol(wort, &ende, 10);
        if (ende == wort || *ende != '\0') {
            printf("ungültig: %s\n", wort);
        } else {
            summe += (int) wert;
        }
//:starter
        summe += atoi(wort);  // atoi meldet keine Fehler – es liefert dann einfach 0
//:end
    }
    printf("Summe: %d\n", summe);
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <stdexcept>
#include <string>

int main() {
    int summe = 0;
    std::string wort;
    while (std::cin >> wort) {
//:solution
        try {
            summe += std::stoi(wort);
        } catch (const std::invalid_argument &) {
            std::cout << "ungültig: " << wort << "\n";
        }
//:starter
        summe += std::stoi(wort);
//:end
    }
    std::cout << "Summe: " << summe << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let mut summe = 0;
    for wort in zeile.split_whitespace() {
//:solution
        match wort.parse::<i32>() {
            Ok(zahl) => summe += zahl,
            Err(_) => println!("ungültig: {}", wort),
        }
//:starter
        summe += wort.parse::<i32>().unwrap();
//:end
    }
    println!("Summe: {}", summe);
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'wo-fangen',
      title: 'Wo fängt man?',
      question: 'Eine Funktion tief im Programm kann eine Datei nicht öffnen. Wo sollte der Fehler idealerweise behandelt werden?',
      options: [
        'Immer sofort in genau dieser Funktion, egal was sie dann tun kann.',
        'Dort, wo man sinnvoll darauf reagieren kann – etwa weiter oben, wo man den Nutzer um einen anderen Dateinamen bitten kann.',
        'Gar nicht – Fehler sollte man ignorieren.',
        'Im Betriebssystem.',
      ],
      correct: 1,
      explain:
        'Eine Funktion, die nur „lies Datei X" kann, weiß nicht, was im Fehlerfall richtig ist: abbrechen, nachfragen, Standardwerte nehmen? Das weiß oft erst eine höhere Ebene. Ausnahmen, `?` in Rust und weitergereichte Fehlercodes in C dienen alle dazu, den Fehler bis dorthin zu transportieren. Wichtig ist nur: Irgendwo muss er behandelt werden – und niemals stillschweigend verschluckt.',
    },
    {
      kind: 'quiz',
      id: 'panik',
      title: 'Erwartbar oder Programmierfehler?',
      question: 'Welcher dieser Fehler ist ein **Programmierfehler** und kein erwartbarer Fehlerfall, auf den das Programm vorbereitet sein sollte?',
      options: [
        'Die Netzwerkverbindung bricht ab.',
        'Ein Nutzer tippt Buchstaben in ein Zahlenfeld.',
        'Der Code greift auf Index 10 eines Arrays mit 5 Elementen zu.',
        'Eine Datei existiert nicht.',
      ],
      correct: 2,
      explain:
        'Netzwerk, Nutzereingaben und Dateien gehören zur Außenwelt – dort geht regelmäßig etwas schief, und ein gutes Programm behandelt das. Ein falscher Index dagegen ist ein Fehler im Programm selbst. Den behandelt man nicht, man behebt ihn. Rust trennt beides besonders deutlich: `Result` für erwartbare Fehler, `panic!` (Programmabbruch) für Programmierfehler.',
    },
  ],
};

export default lesson;
