import { raw } from '../../types.ts';
import type { Frame, HeapObj, Lang, LessonCode, Step, VarVal } from '../../types.ts';
import { trace } from '../../util.ts';

const SELF: Record<Lang, string> = { python: 'self', java: 'this', c: 'k', cpp: 'this', rust: 'self', sql: '', bash: '' };

const lesson: LessonCode = {
  snippets: {
    konto: {
      python: raw`
class Konto:
    def __init__(self, inhaber):  #@init
        self.inhaber = inhaber  #@feld
        self.saldo = 0  #@feld

    def einzahlen(self, betrag):  #@ein
        self.saldo += betrag  #@add

k = Konto("Mia")  #@neu
k.einzahlen(50)  #@call
print(k.inhaber, k.saldo)  #@out
`,
      java: raw`
public class Main {
    static class Konto {
        private final String inhaber;
        private int saldo;

        Konto(String inhaber) {  //@init
            this.inhaber = inhaber;  //@feld
            this.saldo = 0;  //@feld
        }

        void einzahlen(int betrag) {  //@ein
            saldo += betrag;  //@add
        }

        String beschreibung() {
            return inhaber + " " + saldo;
        }
    }

    public static void main(String[] args) {
        Konto k = new Konto("Mia");  //@neu
        k.einzahlen(50);  //@call
        System.out.println(k.beschreibung());  //@out
    }
}
`,
      c: raw`
#include <stdio.h>

struct Konto {
    const char *inhaber;
    int saldo;
};

void konto_init(struct Konto *k, const char *inhaber) {  //@init
    k->inhaber = inhaber;  //@feld
    k->saldo = 0;  //@feld
}

void konto_einzahlen(struct Konto *k, int betrag) {  //@ein
    k->saldo += betrag;  //@add
}

int main(void) {
    struct Konto k;
    konto_init(&k, "Mia");  //@neu
    konto_einzahlen(&k, 50);  //@call
    printf("%s %d\n", k.inhaber, k.saldo);  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <string>

class Konto {
public:
    explicit Konto(std::string inhaber)  //@init
        : inhaber_(inhaber), saldo_(0) {}  //@feld

    void einzahlen(int betrag) {  //@ein
        saldo_ += betrag;  //@add
    }

    std::string beschreibung() const {
        return inhaber_ + " " + std::to_string(saldo_);
    }

private:
    std::string inhaber_;
    int saldo_;
};

int main() {
    Konto k("Mia");  //@neu
    k.einzahlen(50);  //@call
    std::cout << k.beschreibung() << "\n";  //@out
    return 0;
}
`,
      rust: raw`
struct Konto {
    inhaber: String,
    saldo: i32,
}

impl Konto {
    fn neu(inhaber: &str) -> Konto {  //@init
        Konto { inhaber: inhaber.to_string(), saldo: 0 }  //@feld
    }

    fn einzahlen(&mut self, betrag: i32) {  //@ein
        self.saldo += betrag;  //@add
    }
}

fn main() {
    let mut k = Konto::neu("Mia");  //@neu
    k.einzahlen(50);  //@call
    println!("{} {}", k.inhaber, k.saldo);  //@out
}
`,
    },
  },

  scenes: {
    konto: {
      title: 'Ein Objekt entsteht und bekommt einen Auftrag',
      code: 'konto',
      build: (_p, lang): Step[] =>
        trace((t) => {
          const self = SELF[lang];
          const onHeap = lang === 'python' || lang === 'java';
          const main = (vars: Record<string, VarVal>): Frame => ({ name: 'main', vars });

          if (onHeap) {
            const obj = (saldo: number | string): HeapObj[] => [{ id: 'k', label: 'Konto', cells: [`inhaber: "Mia"`, `saldo: ${saldo}`] }];
            const r = { ref: 'k', type: 'Konto' };
            t.step('neu', `Ein neues Objekt der Klasse \`Konto\` wird angefordert. ${lang === 'java' ? '`new`' : 'Der Aufruf `Konto(...)`'} reserviert Platz auf dem Heap und ruft dann den **Konstruktor** auf.`, {
              frames: [main({})],
              heap: [{ id: 'k', label: 'Konto', cells: ['inhaber: –', 'saldo: –'] }],
            });
            t.step('init', `Der Konstruktor läuft. \`${self}\` ist ein Verweis auf das gerade entstehende Objekt – so weiß der Code, **wessen** Felder er füllt.`, {
              frames: [main({}), { name: lang === 'java' ? 'Konto (Konstruktor)' : '__init__', vars: { [self]: r, inhaber: '"Mia"' } }],
              heap: [{ id: 'k', label: 'Konto', cells: ['inhaber: –', 'saldo: –'] }],
            });
            t.step('feld', 'Die Felder werden mit Startwerten belegt. Ab jetzt ist das Objekt in einem gültigen Zustand.', {
              frames: [main({}), { name: lang === 'java' ? 'Konto (Konstruktor)' : '__init__', vars: { [self]: r, inhaber: '"Mia"' } }],
              heap: obj(0),
            });
            t.step('neu', '`k` verweist auf das fertige Objekt.', { frames: [main({ k: r })], heap: obj(0) });
            t.step('call', `Ein **Methodenaufruf**: \`k.einzahlen(50)\` heißt „Konto k, zahle 50 ein". Das Objekt vor dem Punkt wird der Methode unsichtbar als \`${self}\` mitgegeben.`, {
              frames: [main({ k: r })],
              heap: obj(0),
            });
            t.step('ein', `In der Methode zeigt \`${self}\` auf genau das Objekt, auf dem sie aufgerufen wurde.`, {
              frames: [main({ k: r }), { name: 'einzahlen', vars: { [self]: r, betrag: 50 } }],
              heap: obj(0),
            });
            t.step('add', 'Die Methode ändert den Zustand **ihres** Objekts. Ein zweites Konto bliebe unberührt.', {
              frames: [main({ k: r }), { name: 'einzahlen', vars: { [self]: r, betrag: 50 } }],
              heap: obj(50),
            });
            t.print('Mia 50');
            t.step('out', 'Daten (Felder) und das passende Verhalten (Methoden) sind in einer Einheit gebündelt: dem Objekt.', { frames: [main({ k: r })], heap: obj(50) });
            return;
          }

          const fields = (saldo: number | string, inhaber = '"Mia"') => ({ 'k.inhaber': inhaber, 'k.saldo': saldo });
          const ptr = { ref: 'main.k.inhaber', type: lang === 'c' ? 'struct Konto*' : lang === 'cpp' ? 'Konto*' : '&mut Konto' };
          const ctor = lang === 'c' ? 'konto_init' : lang === 'cpp' ? 'Konto (Konstruktor)' : 'Konto::neu';
          t.step(
            'neu',
            lang === 'c'
              ? 'C hat keine Klassen. Das übliche Muster: ein `struct` für die Daten und Funktionen, die einen Zeiger auf das Struct bekommen. `k` liegt hier direkt auf dem Stack.'
              : lang === 'cpp'
                ? 'Das Objekt `k` entsteht direkt auf dem Stack – ganz ohne `new`. Dabei läuft der **Konstruktor**.'
                : 'Rust hat keine Klassen, aber `struct` plus `impl`-Block erfüllen denselben Zweck. `Konto::neu` ist nur eine gewöhnliche Funktion, die ein fertiges `Konto` zurückgibt – Konstruktoren sind in Rust eine Konvention, kein Sprachmittel.',
            { frames: [main(fields('–', '–'))] },
          );
          t.step(
            'init',
            lang === 'rust' ? 'Die Funktion baut den Wert zusammen.' : `${lang === 'c' ? '`konto_init` bekommt die Adresse von `k` und' : 'Der Konstruktor bekommt über `this` die Adresse des Objekts und'} füllt die Felder.`,
            { frames: lang === 'rust' ? [main(fields('–', '–')), { name: ctor, vars: { inhaber: '"Mia"' } }] : [main(fields('–', '–')), { name: ctor, vars: { [self]: ptr } }] },
          );
          t.step('feld', 'Die Felder werden mit Startwerten belegt.', {
            frames: lang === 'rust' ? [main(fields('–', '–')), { name: ctor, vars: { inhaber: '"Mia"' } }] : [main(fields(0)), { name: ctor, vars: { [self]: ptr } }],
          });
          t.step('neu', '`k` ist fertig.', { frames: [main(fields(0))] });
          t.step(
            'call',
            lang === 'c'
              ? 'Der „Methodenaufruf" ist ein normaler Funktionsaufruf, dem man die Adresse des Structs ausdrücklich mitgibt.'
              : `\`k.einzahlen(50)\`: Das Objekt vor dem Punkt wird der Methode als \`${self}\` mitgegeben.${lang === 'rust' ? ' Weil die Methode `&mut self` verlangt, muss `k` als `mut` angelegt sein.' : ''}`,
            { frames: [main(fields(0))] },
          );
          t.step('ein', `\`${self}\` zeigt auf \`k\` in \`main\`.`, { frames: [main(fields(0)), { name: lang === 'c' ? 'konto_einzahlen' : 'einzahlen', vars: { [self]: ptr, betrag: 50 } }] });
          t.step('add', 'Über den Verweis wird das Feld in `main` geändert.', {
            frames: [main(fields(50)), { name: lang === 'c' ? 'konto_einzahlen' : 'einzahlen', vars: { [self]: ptr, betrag: 50 } }],
          });
          t.print('Mia 50');
          t.step('out', lang === 'c' ? 'Klassen in anderen Sprachen machen im Kern dasselbe – sie verstecken nur den Zeiger auf das Objekt.' : 'Daten und Verhalten bilden eine Einheit.', {
            frames: [main(fields(50))],
          });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'abheben',
      title: 'Kein Konto im Minus',
      prompt:
        'Das Konto kann schon einzahlen. Schreibe die Methode `abheben`: Sie soll den Betrag nur abziehen, wenn genug Geld da ist, und mitteilen, ob es geklappt hat (wahr/falsch).\n\nDas Programm liest Befehle wie `ein 50` und `ab 30` und gibt nach jedem den Kontostand aus – oder `abgelehnt`, wenn eine Abhebung nicht gedeckt ist. Dieser Teil ist fertig.',
      tests: [
        { name: 'Normale Abhebung', stdin: 'ein 50\nab 30\n', expected: '50\n20\n' },
        { name: 'Nicht gedeckt', stdin: 'ein 50\nab 30\nab 100\n', expected: '50\n20\nabgelehnt\n' },
        { name: 'Genau alles', stdin: 'ein 10\nab 10\nab 1\n', expected: '10\n0\nabgelehnt\n' },
      ],
      hints: [
        'Prüfe zuerst, ob `betrag` größer als der aktuelle Saldo ist. Dann darfst du nichts ändern und lieferst „falsch" zurück.',
        'Nur im anderen Fall wird abgezogen und „wahr" zurückgegeben.',
      ],
      code: {
        python: raw`
import sys

class Konto:
    def __init__(self):
        self.saldo = 0

    def einzahlen(self, betrag):
        self.saldo += betrag

    def abheben(self, betrag):
#:solution
        if betrag > self.saldo:
            return False
        self.saldo -= betrag
        return True
#:starter
        self.saldo -= betrag
        return True
#:end

konto = Konto()
for zeile in sys.stdin:
    befehl, betrag = zeile.split()
    if befehl == "ein":
        konto.einzahlen(int(betrag))
        print(konto.saldo)
    elif konto.abheben(int(betrag)):
        print(konto.saldo)
    else:
        print("abgelehnt")
`,
        java: raw`
import java.util.Scanner;

public class Main {
    static class Konto {
        private int saldo = 0;

        void einzahlen(int betrag) {
            saldo += betrag;
        }

        boolean abheben(int betrag) {
//:solution
            if (betrag > saldo) {
                return false;
            }
            saldo -= betrag;
            return true;
//:starter
            saldo -= betrag;
            return true;
//:end
        }

        int saldo() {
            return saldo;
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Konto konto = new Konto();
        while (in.hasNext()) {
            String befehl = in.next();
            int betrag = in.nextInt();
            if (befehl.equals("ein")) {
                konto.einzahlen(betrag);
                System.out.println(konto.saldo());
            } else if (konto.abheben(betrag)) {
                System.out.println(konto.saldo());
            } else {
                System.out.println("abgelehnt");
            }
        }
    }
}
`,
        c: raw`
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

struct Konto {
    int saldo;
};

void konto_einzahlen(struct Konto *k, int betrag) {
    k->saldo += betrag;
}

bool konto_abheben(struct Konto *k, int betrag) {
//:solution
    if (betrag > k->saldo) {
        return false;
    }
    k->saldo -= betrag;
    return true;
//:starter
    k->saldo -= betrag;
    return true;
//:end
}

int main(void) {
    struct Konto konto = {0};
    char befehl[10];
    int betrag;
    while (scanf("%9s %d", befehl, &betrag) == 2) {
        if (strcmp(befehl, "ein") == 0) {
            konto_einzahlen(&konto, betrag);
            printf("%d\n", konto.saldo);
        } else if (konto_abheben(&konto, betrag)) {
            printf("%d\n", konto.saldo);
        } else {
            printf("abgelehnt\n");
        }
    }
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <string>

class Konto {
public:
    void einzahlen(int betrag) {
        saldo_ += betrag;
    }

    bool abheben(int betrag) {
//:solution
        if (betrag > saldo_) {
            return false;
        }
        saldo_ -= betrag;
        return true;
//:starter
        saldo_ -= betrag;
        return true;
//:end
    }

    int saldo() const {
        return saldo_;
    }

private:
    int saldo_ = 0;
};

int main() {
    Konto konto;
    std::string befehl;
    int betrag;
    while (std::cin >> befehl >> betrag) {
        if (befehl == "ein") {
            konto.einzahlen(betrag);
            std::cout << konto.saldo() << "\n";
        } else if (konto.abheben(betrag)) {
            std::cout << konto.saldo() << "\n";
        } else {
            std::cout << "abgelehnt\n";
        }
    }
    return 0;
}
`,
        rust: raw`
use std::io::{self, BufRead};

struct Konto {
    saldo: i32,
}

impl Konto {
    fn einzahlen(&mut self, betrag: i32) {
        self.saldo += betrag;
    }

    fn abheben(&mut self, betrag: i32) -> bool {
//:solution
        if betrag > self.saldo {
            return false;
        }
        self.saldo -= betrag;
        true
//:starter
        self.saldo -= betrag;
        true
//:end
    }
}

fn main() {
    let mut konto = Konto { saldo: 0 };
    for zeile in io::stdin().lock().lines() {
        let zeile = zeile.unwrap();
        let teile: Vec<&str> = zeile.split_whitespace().collect();
        if teile.len() != 2 {
            continue;
        }
        let betrag: i32 = teile[1].parse().unwrap();
        if teile[0] == "ein" {
            konto.einzahlen(betrag);
            println!("{}", konto.saldo);
        } else if konto.abheben(betrag) {
            println!("{}", konto.saldo);
        } else {
            println!("abgelehnt");
        }
    }
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'kapselung',
      title: 'Warum privat?',
      question: 'Das Feld `saldo` ist von außen nicht direkt veränderbar (privat), nur über `einzahlen` und `abheben`. Was ist der wichtigste Grund dafür?',
      options: [
        'Private Felder belegen weniger Speicher.',
        'Das Objekt kann selbst dafür sorgen, dass seine Regeln eingehalten werden – niemand kann den Saldo von außen ins Minus setzen.',
        'Private Felder sind schneller zu lesen.',
        'Ohne `private` ließe sich die Klasse nicht kompilieren.',
      ],
      correct: 1,
      explain:
        'Das nennt man **Kapselung**: Ein Objekt schützt seinen inneren Zustand und erlaubt Änderungen nur über Methoden, die die Regeln prüfen. Ändert sich später die interne Darstellung (etwa Cent statt Euro), muss nur die Klasse angepasst werden, nicht jeder Code, der sie benutzt. Python kennt kein echtes `private`; dort signalisiert ein Unterstrich (`_saldo`): „Bitte nicht von außen anfassen."',
    },
    {
      kind: 'quiz',
      id: 'klasse-objekt',
      title: 'Klasse und Objekt',
      question: 'Ein Programm definiert die Klasse `Konto` einmal und erzeugt daraus 1000 Konten. Wie viele Saldo-Werte gibt es dann im Speicher?',
      options: ['Einen, den sich alle teilen.', '1000 – jedes Objekt hat seine eigenen Felder.', 'Keinen, Felder existieren nur in der Klasse.', '1001'],
      correct: 1,
      explain:
        'Die Klasse ist der Bauplan, jedes Objekt (auch **Instanz** genannt) hat einen eigenen Satz Felder. Die Methoden dagegen existieren nur einmal: Über `self`/`this` erfahren sie bei jedem Aufruf, mit welchem Objekt sie gerade arbeiten.',
    },
  ],
};

export default lesson;
