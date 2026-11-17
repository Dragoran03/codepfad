import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';

const lesson: LessonCode = {
  asm: ['summe', 'konstant', 'einbetten'],

  snippets: {
    konstant: {
      python: raw`
def sekunden_pro_woche():
    return 7 * 24 * 60 * 60
`,
      java: raw`
public class Main {
    static int sekundenProWoche() {
        return 7 * 24 * 60 * 60;
    }
}
`,
      c: raw`
int sekunden_pro_woche(void) {
    int tage = 7;
    int stunden = tage * 24;
    return stunden * 60 * 60;
}
`,
      cpp: raw`
int sekunden_pro_woche() {
    int tage = 7;
    int stunden = tage * 24;
    return stunden * 60 * 60;
}
`,
      rust: raw`
#[unsafe(no_mangle)]
pub fn sekunden_pro_woche() -> i32 {
    let tage = 7;
    let stunden = tage * 24;
    stunden * 60 * 60
}
`,
    },
    summe: {
      python: raw`
def summe(n):
    s = 0
    for i in range(1, n + 1):
        s += i
    return s
`,
      java: raw`
public class Main {
    static int summe(int n) {
        int s = 0;
        for (int i = 1; i <= n; i++) {
            s += i;
        }
        return s;
    }
}
`,
      c: raw`
int summe(int n) {
    int s = 0;
    for (int i = 1; i <= n; i++) {
        s += i;
    }
    return s;
}
`,
      cpp: raw`
int summe(int n) {
    int s = 0;
    for (int i = 1; i <= n; i++) {
        s += i;
    }
    return s;
}
`,
      rust: raw`
#[unsafe(no_mangle)]
pub fn summe(n: u32) -> u32 {
    (1..=n).sum()
}
`,
    },
    einbetten: {
      python: raw`
def quadrat(x):
    return x * x

def flaeche_zweier_quadrate(a, b):
    return quadrat(a) + quadrat(b)
`,
      java: raw`
public class Main {
    static int quadrat(int x) {
        return x * x;
    }

    static int flaecheZweierQuadrate(int a, int b) {
        return quadrat(a) + quadrat(b);
    }
}
`,
      c: raw`
static int quadrat(int x) {
    return x * x;
}

int flaeche_zweier_quadrate(int a, int b) {
    return quadrat(a) + quadrat(b);
}
`,
      cpp: raw`
static int quadrat(int x) {
    return x * x;
}

int flaeche_zweier_quadrate(int a, int b) {
    return quadrat(a) + quadrat(b);
}
`,
      rust: raw`
fn quadrat(x: i32) -> i32 {
    x * x
}

#[unsafe(no_mangle)]
pub fn flaeche_zweier_quadrate(a: i32, b: i32) -> i32 {
    quadrat(a) + quadrat(b)
}
`,
    },
  },

  exercises: [
    {
      kind: 'quiz',
      id: 'als-ob',
      title: 'Was darf der Optimierer?',
      question: 'Der Optimierer hat die Schleife in `summe` komplett entfernt. Nach welcher Regel darf er so etwas?',
      options: [
        'Er darf alles, solange das Programm schneller wird.',
        'Er darf jede Umformung vornehmen, solange sich das **beobachtbare Verhalten** eines korrekten Programms nicht ändert – Ausgaben, Rückgabewerte, Dateizugriffe.',
        'Er darf nur Leerzeichen entfernen.',
        'Er darf nur Code entfernen, der in Kommentaren steht.',
      ],
      correct: 1,
      explain:
        'Das ist die **„Als-ob"-Regel**: Das optimierte Programm muss sich so verhalten, *als ob* es Zeile für Zeile ausgeführt würde. Wie es intern zum Ergebnis kommt, ist egal. Vorsicht in C und C++: Für Programme mit undefiniertem Verhalten (etwa Überlauf vorzeichenbehafteter Zahlen) gilt die Regel nicht – der Optimierer darf annehmen, dass so etwas nie passiert, und daraus überraschende Schlüsse ziehen.',
    },
    {
      kind: 'quiz',
      id: 'debug',
      title: 'Warum nicht immer optimieren?',
      question: 'Warum übersetzt man beim Entwickeln trotzdem oft **ohne** Optimierung (Debug-Build)?',
      options: [
        'Weil optimierter Code falsch rechnet.',
        'Weil das Übersetzen schneller geht und der Maschinencode noch eng dem Quelltext entspricht – im Debugger kann man Zeile für Zeile folgen und jede Variable ansehen.',
        'Weil der Optimierer nur auf Servern funktioniert.',
        'Weil Debug-Builds kleiner sind.',
      ],
      correct: 1,
      explain:
        'Im optimierten Code gibt es manche Variablen gar nicht mehr, Zeilen sind zusammengelegt oder umsortiert, Funktionen eingebettet. Für den Debugger ist das ein Albtraum. Deshalb unterscheiden alle Build-Werkzeuge zwischen *Debug* und *Release*: `cargo build` gegen `cargo build --release`, `-O0` gegen `-O2`.',
    },
  ],
};

export default lesson;
