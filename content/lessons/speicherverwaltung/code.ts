import { raw } from '../../types.ts';
import type { Frame, HeapObj, LessonCode, Step, VarVal } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  snippets: {
    lebenszyklus: {
      python: raw`
a = [1, 2, 3]  #@alloc
b = a  #@alias
a = None  #@a
b = [9, 9]  #@b
print(len(b))  #@out
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3};  //@alloc
        int[] b = a;  //@alias
        a = null;  //@a
        b = new int[2];  //@b
        System.out.println(b.length);  //@out
    }
}
`,
      c: raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *a = malloc(3 * sizeof(int));  //@alloc
    a[0] = 1;
    int *b = a;  //@alias
    free(a);  //@free
    a = NULL;  //@null
    // b zeigt immer noch auf den freigegebenen Block.
    // b[0] zu lesen wäre jetzt ein schwerer Fehler.
    printf("fertig\n");  //@out
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <memory>

struct Messung {
    int werte[3];
};

int main() {
    {
        auto a = std::make_unique<Messung>();  //@alloc
        a->werte[0] = 1;
        auto b = std::move(a);  //@move
        std::cout << (a == nullptr) << "\n";  //@check
    }  //@ende
    std::cout << "fertig\n";  //@out
    return 0;
}
`,
      rust: raw`
fn main() {
    let a = vec![1, 2, 3];  //@alloc
    let b = a;  //@move
    // println!("{}", a.len());  // Fehler E0382: a wurde verschoben
    let c = b.clone();  //@clone
    println!("{} {}", b.len(), c.len());  //@out
}  //@ende
`,
    },
    gc: {
      python: raw`
import sys

daten = [0] * 1000
print(sys.getrefcount(daten) - 1)  # wie viele Verweise gibt es?
zweiter = daten
print(sys.getrefcount(daten) - 1)
del zweiter
print(sys.getrefcount(daten) - 1)
`,
    },
  },

  scenes: {
    lebenszyklus: {
      title: 'Wer räumt den Heap auf?',
      code: 'lebenszyklus',
      build: (_p, lang): Step[] =>
        trace((t) => {
          const main = (vars: Record<string, VarVal>): Frame[] => [{ name: 'main', vars }];
          const obj = (id: string, cells: number[], state?: HeapObj['state'], label?: string): HeapObj => ({ id, cells, state, label });

          if (lang === 'python' || lang === 'java') {
            const typ = lang === 'java' ? 'int[]' : 'list';
            const nul = lang === 'java' ? 'null' : 'None';
            const r = (id: string) => ({ ref: id, type: typ });
            t.step('alloc', 'Ein Objekt entsteht auf dem Heap, `a` verweist darauf.', { frames: main({ a: r('h1') }), heap: [obj('h1', [1, 2, 3])] });
            t.step('alias', 'Jetzt gibt es **zwei** Verweise auf dasselbe Objekt.', {
              frames: main({ a: r('h1'), b: r('h1') }),
              heap: [obj('h1', [1, 2, 3])],
            });
            t.step('a', `\`a\` verweist auf nichts mehr. Das Objekt ist aber noch über \`b\` erreichbar – es darf auf keinen Fall gelöscht werden.`, {
              frames: main({ a: { v: nul, type: typ }, b: r('h1') }),
              heap: [obj('h1', [1, 2, 3])],
            });
            t.step('b', '`b` bekommt ein neues Objekt. Auf das alte Objekt zeigt jetzt **nichts** mehr. Niemand kann es je wieder benutzen: Es ist **Müll** (*garbage*).', {
              frames: main({ a: { v: nul, type: typ }, b: r('h2') }),
              heap: [obj('h1', [1, 2, 3], 'garbage'), obj('h2', [0, 0])],
            });
            t.print(2);
            t.step(
              'out',
              lang === 'python'
                ? 'Python zählt für jedes Objekt mit, wie viele Verweise darauf existieren (**Referenzzählung**). Fällt der Zähler auf 0, wird das Objekt sofort freigegeben. Für verschachtelte Fälle, in denen Objekte sich gegenseitig festhalten, läuft zusätzlich ab und zu ein Garbage Collector.'
                : 'Irgendwann – du weißt nicht genau, wann – startet der **Garbage Collector**. Er sucht von den Variablen aus alle erreichbaren Objekte und gibt den Rest frei. Du musst nie an `free` denken, zahlst aber mit etwas Rechenzeit und gelegentlichen kurzen Pausen.',
              { frames: main({ a: { v: nul, type: typ }, b: r('h2') }), heap: [obj('h2', [0, 0])] },
            );
            return;
          }

          if (lang === 'c') {
            const p = (state?: 'dangling') => ({ ref: 'h1', type: 'int*', ...(state ? { state } : {}) });
            t.step('alloc', '`malloc` reserviert einen Block für drei Zahlen und liefert seine Adresse.', {
              frames: main({ a: p() }),
              heap: [obj('h1', [1, 0, 0])],
            });
            t.step('alias', 'Ein zweiter Zeiger auf denselben Block. C merkt sich nicht, wie viele Zeiger es gibt – das ist allein deine Sache.', {
              frames: main({ a: p(), b: p() }),
              heap: [obj('h1', [1, 0, 0])],
            });
            t.step('free', '`free(a)` gibt den Block zurück. Er gehört jetzt wieder dem System und kann jederzeit für etwas anderes verwendet werden. **Beide** Zeiger zeigen nun ins Leere.', {
              frames: main({ a: p('dangling'), b: p('dangling') }),
              heap: [obj('h1', [1, 0, 0], 'freed')],
            });
            t.step('null', 'Gute Angewohnheit: Den Zeiger nach `free` auf `NULL` setzen. Aber das hilft nur `a`. Von `b` weiß niemand – ein **hängender Zeiger**. Wer später über `b` liest oder schreibt, beschädigt fremde Daten.', {
              frames: main({ a: { v: 'NULL', type: 'int*' }, b: p('dangling') }),
              heap: [obj('h1', [1, 0, 0], 'freed')],
            });
            t.print('fertig');
            t.step('out', 'Die drei Klassiker der manuellen Speicherverwaltung: **vergessen** freizugeben (Speicherleck), **zweimal** freigeben, und **nach** dem Freigeben weiterbenutzen. Keiner davon fällt dem Compiler auf.', {
              frames: main({ a: { v: 'NULL', type: 'int*' }, b: p('dangling') }),
              heap: [],
            });
            return;
          }

          if (lang === 'cpp') {
            t.step('alloc', '`make_unique` legt ein Objekt auf dem Heap an und verpackt den Zeiger in einen `unique_ptr`. Der Name ist Programm: Es gibt genau **einen** Besitzer.', {
              frames: main({ a: { ref: 'h1', type: 'unique_ptr' } }),
              heap: [obj('h1', [1, 0, 0], undefined, 'Messung')],
            });
            t.step('move', 'Einen `unique_ptr` kann man nicht kopieren, nur **verschieben**. `std::move` übergibt den Besitz an `b`; `a` ist danach leer.', {
              frames: main({ a: { v: 'nullptr', type: 'unique_ptr', state: 'moved' }, b: { ref: 'h1', type: 'unique_ptr' } }),
              heap: [obj('h1', [1, 0, 0], undefined, 'Messung')],
            });
            t.print(1);
            t.step('check', '`a` ist tatsächlich leer (die `1` steht für „wahr").', {
              frames: main({ a: { v: 'nullptr', type: 'unique_ptr', state: 'moved' }, b: { ref: 'h1', type: 'unique_ptr' } }),
              heap: [obj('h1', [1, 0, 0], undefined, 'Messung')],
            });
            t.step('ende', 'Am Ende des Blocks endet die Lebenszeit von `b`. Sein **Destruktor** ruft automatisch `delete` auf. Kein Leck, kein doppeltes Freigeben – und das ganz ohne Garbage Collector. Dieses Muster heißt **RAII**.', {
              frames: main({}),
              heap: [obj('h1', [1, 0, 0], 'freed', 'Messung')],
            });
            t.print('fertig');
            t.step('out', 'Das Programm läuft normal weiter. Der Speicher wurde genau einmal freigegeben, und zwar genau dann, als sein letzter Besitzer verschwand.', {
              frames: main({}),
              heap: [],
            });
            return;
          }

          // Rust
          t.step('alloc', '`a` **besitzt** den Vektor. In Rust hat jeder Wert genau einen Besitzer.', {
            frames: main({ a: { ref: 'h1', type: 'Vec' } }),
            heap: [obj('h1', [1, 2, 3])],
          });
          t.step('move', '`let b = a;` kopiert nicht den Inhalt, sondern **verschiebt den Besitz**. `a` ist danach ungültig – der Compiler verbietet jede weitere Verwendung. So kann es nie zwei Besitzer geben, die beide freigeben wollen.', {
            frames: main({ a: { v: '–', type: 'Vec', state: 'moved' }, b: { ref: 'h1', type: 'Vec' } }),
            heap: [obj('h1', [1, 2, 3])],
          });
          t.step('clone', 'Wer wirklich eine Kopie will, sagt es ausdrücklich: `clone()` legt einen zweiten Vektor mit eigenem Besitzer an.', {
            frames: main({ a: { v: '–', type: 'Vec', state: 'moved' }, b: { ref: 'h1', type: 'Vec' }, c: { ref: 'h2', type: 'Vec' } }),
            heap: [obj('h1', [1, 2, 3]), obj('h2', [1, 2, 3])],
          });
          t.print('3 3');
          t.step('out', 'Zwei unabhängige Vektoren, je ein Besitzer.', {
            frames: main({ a: { v: '–', type: 'Vec', state: 'moved' }, b: { ref: 'h1', type: 'Vec' }, c: { ref: 'h2', type: 'Vec' } }),
            heap: [obj('h1', [1, 2, 3]), obj('h2', [1, 2, 3])],
          });
          t.step('ende', 'Am Ende von `main` verlassen `b` und `c` ihren Gültigkeitsbereich. Rust gibt beide Vektoren automatisch frei (das heißt **drop**). `a` besitzt nichts mehr, also passiert dort nichts. Genau einmal freigeben – vom Compiler garantiert, ohne Garbage Collector.', {
            frames: main({}),
            heap: [obj('h1', [1, 2, 3], 'freed'), obj('h2', [1, 2, 3], 'freed')],
          });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'wachsen',
      title: 'Eine Liste, die mitwächst',
      prompt:
        'Das Programm liest Zahlen, bis eine `0` kommt (die 0 selbst gehört nicht dazu). Wie viele es sind, weiß es vorher nicht. Speichere alle Zahlen, und gib danach ihre Anzahl und die Zahlen in umgekehrter Reihenfolge aus.\n\nIn den meisten Sprachen nimmt dir die Liste das Wachsen ab. **In C** musst du es selbst tun: Ist das Array voll, verdopple die Kapazität mit `realloc`.',
      tests: [
        { name: 'Drei Zahlen', stdin: '3 5 8 0\n', expected: '3\n8 5 3\n' },
        { name: 'Sofort 0', stdin: '0\n', expected: '0\n\n' },
        { name: 'Zehn Zahlen', stdin: '1 2 3 4 5 6 7 8 9 10 0\n', expected: '10\n10 9 8 7 6 5 4 3 2 1\n' },
      ],
      hints: [
        'Füge jede gelesene Zahl hinten an die Liste an.',
        'In C: Prüfe vor dem Speichern, ob `anzahl == kapazitaet`. Wenn ja: `kapazitaet = kapazitaet * 2;` und `zahlen = realloc(zahlen, kapazitaet * sizeof(int));`',
      ],
      code: {
        python: raw`
zahlen = []
for z in map(int, input().split()):
    if z == 0:
        break
#:solution
    zahlen.append(z)
#:starter
    # Speichere z.
    pass
#:end

print(len(zahlen))
print(*reversed(zahlen))
`,
        java: raw`
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        List<Integer> zahlen = new ArrayList<>();
        while (true) {
            int z = in.nextInt();
            if (z == 0) {
                break;
            }
//:solution
            zahlen.add(z);
//:end
        }

        System.out.println(zahlen.size());
        StringBuilder zeile = new StringBuilder();
        for (int i = zahlen.size() - 1; i >= 0; i--) {
            zeile.append(zahlen.get(i)).append(" ");
        }
        System.out.println(zeile.toString().trim());
    }
}
`,
        c: raw`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int kapazitaet = 2;
    int anzahl = 0;
    int *zahlen = malloc(kapazitaet * sizeof(int));

    int z;
    while (scanf("%d", &z) == 1 && z != 0) {
//:solution
        if (anzahl == kapazitaet) {
            kapazitaet = kapazitaet * 2;
            zahlen = realloc(zahlen, kapazitaet * sizeof(int));
        }
        zahlen[anzahl] = z;
        anzahl++;
//:starter
        // Speichere z in zahlen und erhöhe anzahl.
        // Ist das Array voll (anzahl == kapazitaet), vergrößere es vorher mit realloc.
//:end
    }

    printf("%d\n", anzahl);
    for (int i = anzahl - 1; i >= 0; i--) {
        printf("%d ", zahlen[i]);
    }
    printf("\n");
    free(zahlen);
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> zahlen;
    int z;
    while (std::cin >> z && z != 0) {
//:solution
        zahlen.push_back(z);
//:end
    }

    std::cout << zahlen.size() << "\n";
    for (int i = static_cast<int>(zahlen.size()) - 1; i >= 0; i--) {
        std::cout << zahlen[i] << " ";
    }
    std::cout << "\n";
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();

    let mut zahlen: Vec<i32> = Vec::new();
    for z in eingabe.split_whitespace().map(|t| t.parse::<i32>().unwrap()) {
        if z == 0 {
            break;
        }
//:solution
        zahlen.push(z);
//:end
    }

    println!("{}", zahlen.len());
    let teile: Vec<String> = zahlen.iter().rev().map(|z| z.to_string()).collect();
    println!("{}", teile.join(" "));
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'strategien',
      title: 'Drei Wege zum Aufräumen',
      question: 'Welche Zuordnung stimmt?',
      options: [
        'C: Garbage Collector · Java: Besitzregeln · Rust: von Hand',
        'C: von Hand · Java: Garbage Collector · Rust: Besitzregeln, vom Compiler geprüft',
        'C: Besitzregeln · Java: von Hand · Rust: Garbage Collector',
        'Alle drei nutzen einen Garbage Collector.',
      ],
      correct: 1,
      explain:
        'In C rufst du `free` selbst auf. Java (und Python) suchen zur Laufzeit nach nicht mehr erreichbaren Objekten. Rust legt beim Kompilieren fest, wann jeder Wert freigegeben wird – über Besitz und Gültigkeitsbereiche. C++ steht dazwischen: Von Hand ist möglich, üblich ist aber RAII mit Typen wie `vector` und `unique_ptr`, die sich wie Rusts Besitzer verhalten.',
    },
    {
      kind: 'quiz',
      id: 'preis',
      title: 'Kein Mittagessen umsonst',
      question: 'Was ist der typische Preis eines Garbage Collectors?',
      options: [
        'Programme können dann keine Listen mehr benutzen.',
        'Zusätzlicher Speicher- und Rechenaufwand sowie Pausen zu Zeitpunkten, die man nicht genau vorhersagen kann.',
        'Man muss jedes Objekt zweimal freigeben.',
        'Es gibt keinen Preis, deshalb nutzen ihn alle Sprachen.',
      ],
      correct: 1,
      explain:
        'Der Collector muss den Speicher regelmäßig durchsuchen und braucht Spielraum, um effizient zu arbeiten. Für die meisten Programme ist das ein guter Tausch: weniger Fehler, schnellere Entwicklung. Bei Spielen, Betriebssystemen oder Steuergeräten, wo jede Millisekunde zählt, bevorzugt man Sprachen ohne Collector – genau dafür wurde Rust entworfen.',
    },
  ],
};

export default lesson;
