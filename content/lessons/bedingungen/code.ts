import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  stdin: { eintritt: '15\n' },

  snippets: {
    eintritt: {
      python: raw`
alter = int(input())  #@init

if alter < 6:  #@c1
    preis = 0  #@b1
elif alter < 18:  #@c2
    preis = 5  #@b2
else:  #@else
    preis = 9  #@b3

print("Eintritt:", preis, "Euro")  #@out
`,
      java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int alter = in.nextInt();  //@init
        int preis;

        if (alter < 6) {  //@c1
            preis = 0;  //@b1
        } else if (alter < 18) {  //@c2
            preis = 5;  //@b2
        } else {  //@else
            preis = 9;  //@b3
        }

        System.out.println("Eintritt: " + preis + " Euro");  //@out
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    int alter;
    scanf("%d", &alter);  //@init
    int preis;

    if (alter < 6) {  //@c1
        preis = 0;  //@b1
    } else if (alter < 18) {  //@c2
        preis = 5;  //@b2
    } else {  //@else
        preis = 9;  //@b3
    }

    printf("Eintritt: %d Euro\n", preis);  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    int alter;
    std::cin >> alter;  //@init
    int preis;

    if (alter < 6) {  //@c1
        preis = 0;  //@b1
    } else if (alter < 18) {  //@c2
        preis = 5;  //@b2
    } else {  //@else
        preis = 9;  //@b3
    }

    std::cout << "Eintritt: " << preis << " Euro\n";  //@out
    return 0;
}
`,
      rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let alter: i32 = zeile.trim().parse().unwrap();  //@init
    let preis;

    if alter < 6 {  //@c1
        preis = 0;  //@b1
    } else if alter < 18 {  //@c2
        preis = 5;  //@b2
    } else {  //@else
        preis = 9;  //@b3
    }

    println!("Eintritt: {} Euro", preis);  //@out
}
`,
    },
    logik: {
      python: raw`
alter = 20
hat_ticket = True

if alter >= 18 and hat_ticket:
    print("Einlass")

if alter < 6 or alter >= 65:
    print("Ermäßigt")

if not hat_ticket:
    print("Bitte erst ein Ticket kaufen")
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int alter = 20;
        boolean hatTicket = true;

        if (alter >= 18 && hatTicket) {
            System.out.println("Einlass");
        }

        if (alter < 6 || alter >= 65) {
            System.out.println("Ermäßigt");
        }

        if (!hatTicket) {
            System.out.println("Bitte erst ein Ticket kaufen");
        }
    }
}
`,
      c: raw`
#include <stdbool.h>
#include <stdio.h>

int main(void) {
    int alter = 20;
    bool hat_ticket = true;

    if (alter >= 18 && hat_ticket) {
        printf("Einlass\n");
    }

    if (alter < 6 || alter >= 65) {
        printf("Ermäßigt\n");
    }

    if (!hat_ticket) {
        printf("Bitte erst ein Ticket kaufen\n");
    }
    return 0;
}
`,
      cpp: raw`
#include <iostream>

int main() {
    int alter = 20;
    bool hat_ticket = true;

    if (alter >= 18 && hat_ticket) {
        std::cout << "Einlass\n";
    }

    if (alter < 6 || alter >= 65) {
        std::cout << "Ermäßigt\n";
    }

    if (!hat_ticket) {
        std::cout << "Bitte erst ein Ticket kaufen\n";
    }
    return 0;
}
`,
      rust: raw`
fn main() {
    let alter = 20;
    let hat_ticket = true;

    if alter >= 18 && hat_ticket {
        println!("Einlass");
    }

    if alter < 6 || alter >= 65 {
        println!("Ermäßigt");
    }

    if !hat_ticket {
        println!("Bitte erst ein Ticket kaufen");
    }
}
`,
    },
  },

  scenes: {
    eintritt: {
      title: 'Welcher Zweig wird genommen?',
      code: 'eintritt',
      params: [{ name: 'alter', label: 'alter', min: 0, max: 80, value: 15 }],
      build: (p, lang) =>
        trace((t) => {
          const alter = p.alter;
          const elif = lang === 'python' ? '`elif`' : '`else if`';
          const f = (preis?: number): Partial<Step> => {
            const vars: Record<string, number> = { alter };
            if (preis !== undefined) vars.preis = preis;
            return { frames: [{ name: 'main', vars }] };
          };
          t.step('init', `Die Eingabe wird gelesen: \`alter\` ist ${alter}. Verschiebe oben den Regler, um andere Fälle durchzuspielen.`, f());
          const c1 = alter < 6;
          t.step('c1', `Die erste Bedingung wird geprüft: Ist ${alter} < 6? Das ist **${c1 ? 'wahr' : 'falsch'}**.`, f());
          let preis: number;
          if (c1) {
            preis = 0;
            t.step('b1', 'Die Bedingung ist wahr, also wird ihr Block ausgeführt. Alle weiteren Zweige werden danach übersprungen – auch wenn ihre Bedingung ebenfalls zuträfe.', f(preis));
          } else {
            const c2 = alter < 18;
            t.step('c2', `Nur weil die erste Bedingung falsch war, kommt ${elif} an die Reihe: Ist ${alter} < 18? Das ist **${c2 ? 'wahr' : 'falsch'}**.`, f());
            if (c2) {
              preis = 5;
              t.step('b2', 'Dieser Block läuft. Dass hier mindestens 6 gilt, muss nicht mehr geprüft werden – sonst wären wir gar nicht bis hierher gekommen.', f(preis));
            } else {
              t.step('else', 'Keine Bedingung war wahr. Für genau diesen Fall gibt es `else`: den Zweig für „alles andere".', f());
              preis = 9;
              t.step('b3', 'Der `else`-Block läuft.', f(preis));
            }
          }
          t.print(`Eintritt: ${preis} Euro`);
          t.step('out', 'Egal welcher Zweig genommen wurde: Danach geht es hinter der gesamten Verzweigung weiter. Es läuft immer **genau ein** Zweig.', f(preis));
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'vorzeichen',
      title: 'Positiv, negativ oder null',
      prompt:
        'Das Programm liest eine ganze Zahl. Gib `positiv` aus, wenn sie größer als null ist, `negativ`, wenn sie kleiner ist, und sonst `null`.',
      tests: [
        { name: 'Eingabe 7', stdin: '7\n', expected: 'positiv\n' },
        { name: 'Eingabe -3', stdin: '-3\n', expected: 'negativ\n' },
        { name: 'Eingabe 0', stdin: '0\n', expected: 'null\n' },
      ],
      hints: [
        'Du brauchst drei Zweige: einen für „größer als 0", einen für „kleiner als 0" und einen für den Rest.',
        'Der letzte Zweig braucht keine Bedingung – wenn die Zahl weder größer noch kleiner als null ist, bleibt nur noch ein Fall.',
      ],
      code: {
        python: raw`
zahl = int(input())

#:solution
if zahl > 0:
    print("positiv")
elif zahl < 0:
    print("negativ")
else:
    print("null")
#:starter
if zahl > 0:
    print("positiv")
#:end
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int zahl = in.nextInt();

//:solution
        if (zahl > 0) {
            System.out.println("positiv");
        } else if (zahl < 0) {
            System.out.println("negativ");
        } else {
            System.out.println("null");
        }
//:starter
        if (zahl > 0) {
            System.out.println("positiv");
        }
//:end
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int zahl;
    scanf("%d", &zahl);

//:solution
    if (zahl > 0) {
        printf("positiv\n");
    } else if (zahl < 0) {
        printf("negativ\n");
    } else {
        printf("null\n");
    }
//:starter
    if (zahl > 0) {
        printf("positiv\n");
    }
//:end
    return 0;
}
`,
        cpp: raw`
#include <iostream>

int main() {
    int zahl;
    std::cin >> zahl;

//:solution
    if (zahl > 0) {
        std::cout << "positiv\n";
    } else if (zahl < 0) {
        std::cout << "negativ\n";
    } else {
        std::cout << "null\n";
    }
//:starter
    if (zahl > 0) {
        std::cout << "positiv\n";
    }
//:end
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let zahl: i32 = zeile.trim().parse().unwrap();

//:solution
    if zahl > 0 {
        println!("positiv");
    } else if zahl < 0 {
        println!("negativ");
    } else {
        println!("null");
    }
//:starter
    if zahl > 0 {
        println!("positiv");
    }
//:end
}
`,
      },
    },
    {
      kind: 'code',
      id: 'schaltjahr',
      title: 'Schaltjahr',
      prompt:
        'Ein Jahr ist ein Schaltjahr, wenn es durch 4 teilbar ist. **Ausnahme:** Volle Jahrhunderte (durch 100 teilbar) sind keine Schaltjahre – **es sei denn**, sie sind durch 400 teilbar.\n\nGib `Schaltjahr` oder `Kein Schaltjahr` aus. Der Startcode kennt bisher nur die erste Regel.',
      tests: [
        { name: '2024', stdin: '2024\n', expected: 'Schaltjahr\n' },
        { name: '2023', stdin: '2023\n', expected: 'Kein Schaltjahr\n' },
        { name: '1900 (volles Jahrhundert)', stdin: '1900\n', expected: 'Kein Schaltjahr\n' },
        { name: '2000 (durch 400 teilbar)', stdin: '2000\n', expected: 'Schaltjahr\n' },
      ],
      hints: [
        '„Teilbar durch 4" heißt: Der Rest beim Teilen ist 0, also `jahr % 4 == 0`.',
        'Formuliere die Regel als einen Satz mit „und" und „oder": (durch 4 teilbar **und nicht** durch 100) **oder** durch 400 teilbar.',
      ],
      code: {
        python: raw`
jahr = int(input())

#:solution
if (jahr % 4 == 0 and jahr % 100 != 0) or jahr % 400 == 0:
#:starter
if jahr % 4 == 0:
#:end
    print("Schaltjahr")
else:
    print("Kein Schaltjahr")
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int jahr = in.nextInt();

//:solution
        if ((jahr % 4 == 0 && jahr % 100 != 0) || jahr % 400 == 0) {
//:starter
        if (jahr % 4 == 0) {
//:end
            System.out.println("Schaltjahr");
        } else {
            System.out.println("Kein Schaltjahr");
        }
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int jahr;
    scanf("%d", &jahr);

//:solution
    if ((jahr % 4 == 0 && jahr % 100 != 0) || jahr % 400 == 0) {
//:starter
    if (jahr % 4 == 0) {
//:end
        printf("Schaltjahr\n");
    } else {
        printf("Kein Schaltjahr\n");
    }
    return 0;
}
`,
        cpp: raw`
#include <iostream>

int main() {
    int jahr;
    std::cin >> jahr;

//:solution
    if ((jahr % 4 == 0 && jahr % 100 != 0) || jahr % 400 == 0) {
//:starter
    if (jahr % 4 == 0) {
//:end
        std::cout << "Schaltjahr\n";
    } else {
        std::cout << "Kein Schaltjahr\n";
    }
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let jahr: i32 = zeile.trim().parse().unwrap();

//:solution
    if (jahr % 4 == 0 && jahr % 100 != 0) || jahr % 400 == 0 {
//:starter
    if jahr % 4 == 0 {
//:end
        println!("Schaltjahr");
    } else {
        println!("Kein Schaltjahr");
    }
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'kette',
      title: 'Wie viele Zweige laufen?',
      question:
        'Eine Kette aus `if`, zwei `else if` und einem `else` wird mit einem Wert durchlaufen, bei dem die erste **und** die dritte Bedingung wahr wären. Welche Blöcke werden ausgeführt?',
      options: ['Der erste und der dritte Block.', 'Nur der erste Block.', 'Alle Blöcke, deren Bedingung wahr ist, und zusätzlich `else`.', 'Nur der `else`-Block.'],
      correct: 1,
      explain:
        'Eine solche Kette wird von oben nach unten geprüft und beim **ersten Treffer** verlassen. Spätere Bedingungen werden gar nicht mehr ausgewertet. Sollen mehrere Blöcke unabhängig voneinander laufen können, brauchst du mehrere einzelne `if` hintereinander.',
    },
  ],
};

export default lesson;
