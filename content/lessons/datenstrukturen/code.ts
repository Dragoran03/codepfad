import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';
import { trace } from '../../util.ts';

const lesson: LessonCode = {
  snippets: {
    stapel: {
      python: raw`
stapel = []  #@init
stapel.append("A")  #@push
stapel.append("B")  #@push
stapel.append("C")  #@push
print(stapel.pop())  #@pop
print(stapel.pop())  #@pop

from collections import deque
schlange = deque()  #@qinit
schlange.append("A")  #@enq
schlange.append("B")  #@enq
schlange.append("C")  #@enq
print(schlange.popleft())  #@deq
print(schlange.popleft())  #@deq
`,
      java: raw`
import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    public static void main(String[] args) {
        Deque<String> stapel = new ArrayDeque<>();  //@init
        stapel.push("A");  //@push
        stapel.push("B");  //@push
        stapel.push("C");  //@push
        System.out.println(stapel.pop());  //@pop
        System.out.println(stapel.pop());  //@pop

        Deque<String> schlange = new ArrayDeque<>();  //@qinit
        schlange.addLast("A");  //@enq
        schlange.addLast("B");  //@enq
        schlange.addLast("C");  //@enq
        System.out.println(schlange.pollFirst());  //@deq
        System.out.println(schlange.pollFirst());  //@deq
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    char stapel[10];
    int oben = 0;  //@init
    stapel[oben++] = 'A';  //@push
    stapel[oben++] = 'B';  //@push
    stapel[oben++] = 'C';  //@push
    printf("%c\n", stapel[--oben]);  //@pop
    printf("%c\n", stapel[--oben]);  //@pop

    char schlange[10];
    int vorn = 0, hinten = 0;  //@qinit
    schlange[hinten++] = 'A';  //@enq
    schlange[hinten++] = 'B';  //@enq
    schlange[hinten++] = 'C';  //@enq
    printf("%c\n", schlange[vorn++]);  //@deq
    printf("%c\n", schlange[vorn++]);  //@deq
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <queue>
#include <stack>
#include <string>

int main() {
    std::stack<std::string> stapel;  //@init
    stapel.push("A");  //@push
    stapel.push("B");  //@push
    stapel.push("C");  //@push
    std::cout << stapel.top() << "\n"; stapel.pop();  //@pop
    std::cout << stapel.top() << "\n"; stapel.pop();  //@pop

    std::queue<std::string> schlange;  //@qinit
    schlange.push("A");  //@enq
    schlange.push("B");  //@enq
    schlange.push("C");  //@enq
    std::cout << schlange.front() << "\n"; schlange.pop();  //@deq
    std::cout << schlange.front() << "\n"; schlange.pop();  //@deq
    return 0;
}
`,
      rust: raw`
use std::collections::VecDeque;

fn main() {
    let mut stapel = Vec::new();  //@init
    stapel.push("A");  //@push
    stapel.push("B");  //@push
    stapel.push("C");  //@push
    println!("{}", stapel.pop().unwrap());  //@pop
    println!("{}", stapel.pop().unwrap());  //@pop

    let mut schlange = VecDeque::new();  //@qinit
    schlange.push_back("A");  //@enq
    schlange.push_back("B");  //@enq
    schlange.push_back("C");  //@enq
    println!("{}", schlange.pop_front().unwrap());  //@deq
    println!("{}", schlange.pop_front().unwrap());  //@deq
}
`,
    },
    liste: {
      python: raw`
class Knoten:
    def __init__(self, wert, naechster):
        self.wert = wert
        self.naechster = naechster

kopf = None  #@init
for wert in [3, 2, 1]:
    kopf = Knoten(wert, kopf)  #@insert

k = kopf  #@walk
while k is not None:  #@walk
    print(k.wert)  #@print
    k = k.naechster  #@next
`,
      java: raw`
public class Main {
    static class Knoten {
        int wert;
        Knoten naechster;

        Knoten(int wert, Knoten naechster) {
            this.wert = wert;
            this.naechster = naechster;
        }
    }

    public static void main(String[] args) {
        Knoten kopf = null;  //@init
        for (int wert : new int[] {3, 2, 1}) {
            kopf = new Knoten(wert, kopf);  //@insert
        }

        Knoten k = kopf;  //@walk
        while (k != null) {  //@walk
            System.out.println(k.wert);  //@print
            k = k.naechster;  //@next
        }
    }
}
`,
      c: raw`
#include <stdio.h>
#include <stdlib.h>

struct Knoten {
    int wert;
    struct Knoten *naechster;
};

int main(void) {
    struct Knoten *kopf = NULL;  //@init
    int werte[] = {3, 2, 1};
    for (int i = 0; i < 3; i++) {
        struct Knoten *neu = malloc(sizeof(struct Knoten));  //@insert
        neu->wert = werte[i];  //@insert
        neu->naechster = kopf;  //@insert
        kopf = neu;  //@insert
    }

    struct Knoten *k = kopf;  //@walk
    while (k != NULL) {  //@walk
        printf("%d\n", k->wert);  //@print
        k = k->naechster;  //@next
    }

    while (kopf != NULL) {  // aufräumen
        struct Knoten *weg = kopf;
        kopf = kopf->naechster;
        free(weg);
    }
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <memory>

struct Knoten {
    int wert;
    std::unique_ptr<Knoten> naechster;
};

int main() {
    std::unique_ptr<Knoten> kopf;  //@init
    for (int wert : {3, 2, 1}) {
        kopf = std::make_unique<Knoten>(Knoten{wert, std::move(kopf)});  //@insert
    }

    for (Knoten *k = kopf.get(); k != nullptr; k = k->naechster.get()) {  //@walk,next
        std::cout << k->wert << "\n";  //@print
    }
    return 0;
}
`,
      rust: raw`
struct Knoten {
    wert: i32,
    naechster: Option<Box<Knoten>>,
}

fn main() {
    let mut kopf: Option<Box<Knoten>> = None;  //@init
    for wert in [3, 2, 1] {
        kopf = Some(Box::new(Knoten { wert, naechster: kopf }));  //@insert
    }

    let mut k = &kopf;  //@walk
    while let Some(knoten) = k {  //@walk
        println!("{}", knoten.wert);  //@print
        k = &knoten.naechster;  //@next
    }
}
`,
    },
  },

  scenes: {
    stapel: {
      title: 'Stapel und Warteschlange',
      code: 'stapel',
      build: (): Step[] =>
        trace((t) => {
          const s: string[] = [];
          const sView = (hi?: number) => ({
            array: { label: 'Stapel (oben ist rechts)', cells: [...s], showIndex: false, hi: hi === undefined ? [] : [hi], pointers: (s.length ? { oben: s.length - 1 } : {}) as Record<string, number> },
          });
          t.step('init', 'Ein **Stapel** (*stack*) funktioniert wie ein Tellerstapel: Neues kommt oben drauf, und genommen wird auch von oben.', sView());
          for (const x of ['A', 'B', 'C']) {
            s.push(x);
            t.step('push', `**push**: ${x} kommt oben drauf.`, sView(s.length - 1));
          }
          for (let i = 0; i < 2; i++) {
            const x = s.pop()!;
            t.print(x);
            t.step('pop', `**pop**: Das oberste Element kommt herunter – ${x}. ${i === 0 ? 'Was zuletzt hineinkam, kommt zuerst heraus: **LIFO** (last in, first out).' : ''}`, sView());
          }
          const q: string[] = [];
          let vorn = 0;
          const qView = (hi?: number) => ({
            array: {
              label: 'Warteschlange (vorn ist links)',
              cells: q.slice(vorn),
              showIndex: false,
              hi: hi === undefined ? [] : [hi - vorn],
              pointers: (q.length > vorn ? { vorn: 0, hinten: q.length - 1 - vorn } : {}) as Record<string, number>,
            },
          });
          t.step('qinit', 'Eine **Warteschlange** (*queue*) funktioniert wie die Schlange an der Kasse: hinten anstellen, vorn drankommen.', qView());
          for (const x of ['A', 'B', 'C']) {
            q.push(x);
            t.step('enq', `${x} stellt sich hinten an.`, qView(q.length - 1));
          }
          for (let i = 0; i < 2; i++) {
            const x = q[vorn++];
            t.print(x);
            t.step('deq', `Vorn ist ${x} dran. ${i === 0 ? 'Wer zuerst kam, wird zuerst bedient: **FIFO** (first in, first out).' : ''}`, qView());
          }
        }),
    },
    liste: {
      title: 'Eine verkettete Liste entsteht',
      code: 'liste',
      build: (): Step[] =>
        trace((t) => {
          const nodes: { id: string; v: number }[] = [];
          t.step('init', 'Eine **verkettete Liste** besteht aus Knoten. Jeder Knoten enthält einen Wert und einen Verweis auf den nächsten. Anfangs ist die Liste leer: `kopf` zeigt auf nichts.', {
            list: { nodes: [], pointers: { kopf: 'null' } },
          });
          for (const v of [3, 2, 1]) {
            nodes.unshift({ id: `n${v}`, v });
            t.step('insert', `Ein neuer Knoten mit ${v} entsteht. Sein Verweis zeigt auf den bisherigen Anfang, und \`kopf\` zeigt auf ihn. Vorn einfügen kostet immer gleich viel – egal wie lang die Liste ist: **O(1)**.`, {
              list: { nodes: [...nodes], hi: `n${v}`, pointers: { kopf: `n${v}` } },
            });
          }
          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            t.step(i === 0 ? 'walk' : 'next', i === 0 ? 'Zum Durchlaufen startet `k` am Kopf.' : 'Weiter über den Verweis zum nächsten Knoten.', {
              list: { nodes: [...nodes], hi: n.id, pointers: { kopf: nodes[0].id, k: n.id } },
            });
            t.print(n.v);
            t.step('print', `Wert ausgeben: ${n.v}.`, { list: { nodes: [...nodes], hi: n.id, pointers: { kopf: nodes[0].id, k: n.id } } });
          }
          t.step('next', 'Der letzte Knoten zeigt auf nichts – die Schleife endet. Um an den dritten Knoten zu kommen, musste man über alle davor laufen: Zugriff per Position kostet **O(n)**, anders als beim Array.', {
            list: { nodes: [...nodes], pointers: { kopf: nodes[0].id, k: 'null' } },
          });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'klammern',
      title: 'Klammern prüfen',
      prompt:
        'Ein Ausdruck aus den Klammern `()`, `[]` und `{}` ist korrekt, wenn jede öffnende Klammer zur passenden schließenden gehört und sie richtig verschachtelt sind. `([]{})` ist korrekt, `(]` und `([)]` nicht.\n\nGib `ok` oder `fehler` aus. Der Startcode zählt nur, ob es gleich viele öffnende wie schließende Klammern gibt – das reicht nicht.\n\nDie Lösung ist ein **Stapel**: Öffnende Klammern kommen drauf. Bei einer schließenden muss oben die passende öffnende liegen; dann wird sie heruntergenommen.',
      tests: [
        { name: '([]{})', stdin: '([]{})\n', expected: 'ok\n' },
        { name: '(]', stdin: '(]\n', expected: 'fehler\n' },
        { name: '([)]', stdin: '([)]\n', expected: 'fehler\n' },
        { name: '((', stdin: '((\n', expected: 'fehler\n' },
        { name: ')(', stdin: ')(\n', expected: 'fehler\n' },
        { name: '{[()()]}', stdin: '{[()()]}\n', expected: 'ok\n' },
      ],
      hints: [
        'Für jede schließende Klammer gibt es drei Fehlerfälle: Der Stapel ist leer, oder oben liegt die falsche öffnende Klammer.',
        'Am Ende muss der Stapel leer sein – sonst ist eine Klammer offen geblieben.',
      ],
      code: {
        python: raw`
text = input().strip()
PASSEND = {")": "(", "]": "[", "}": "{"}

#:solution
stapel = []
korrekt = True
for z in text:
    if z in "([{":
        stapel.append(z)
    elif z in PASSEND:
        if not stapel or stapel.pop() != PASSEND[z]:
            korrekt = False
            break
if stapel:
    korrekt = False
#:starter
offen = sum(1 for z in text if z in "([{")
zu = sum(1 for z in text if z in ")]}")
korrekt = offen == zu
#:end

print("ok" if korrekt else "fehler")
`,
        java: raw`
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Scanner;

public class Main {
    static char passend(char zu) {
        return zu == ')' ? '(' : zu == ']' ? '[' : '{';
    }

    public static void main(String[] args) {
        String text = new Scanner(System.in).nextLine().trim();
        boolean korrekt = true;

//:solution
        Deque<Character> stapel = new ArrayDeque<>();
        for (char z : text.toCharArray()) {
            if (z == '(' || z == '[' || z == '{') {
                stapel.push(z);
            } else if (z == ')' || z == ']' || z == '}') {
                if (stapel.isEmpty() || stapel.pop() != passend(z)) {
                    korrekt = false;
                    break;
                }
            }
        }
        if (!stapel.isEmpty()) {
            korrekt = false;
        }
//:starter
        int saldo = 0;
        for (char z : text.toCharArray()) {
            if (z == '(' || z == '[' || z == '{') saldo++;
            if (z == ')' || z == ']' || z == '}') saldo--;
        }
        korrekt = saldo == 0;
//:end

        System.out.println(korrekt ? "ok" : "fehler");
    }
}
`,
        c: raw`
#include <stdbool.h>
#include <stdio.h>

char passend(char zu) {
    return zu == ')' ? '(' : zu == ']' ? '[' : '{';
}

int main(void) {
    char text[1000];
    scanf("%999s", text);
    bool korrekt = true;

//:solution
    char stapel[1000];
    int oben = 0;
    for (int i = 0; text[i] != '\0'; i++) {
        char z = text[i];
        if (z == '(' || z == '[' || z == '{') {
            stapel[oben++] = z;
        } else if (z == ')' || z == ']' || z == '}') {
            if (oben == 0 || stapel[--oben] != passend(z)) {
                korrekt = false;
                break;
            }
        }
    }
    if (oben != 0) {
        korrekt = false;
    }
//:starter
    int saldo = 0;
    for (int i = 0; text[i] != '\0'; i++) {
        char z = text[i];
        if (z == '(' || z == '[' || z == '{') saldo++;
        if (z == ')' || z == ']' || z == '}') saldo--;
    }
    korrekt = saldo == 0;
    (void)passend;
//:end

    printf("%s\n", korrekt ? "ok" : "fehler");
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <stack>
#include <string>

char passend(char zu) {
    return zu == ')' ? '(' : zu == ']' ? '[' : '{';
}

int main() {
    std::string text;
    std::cin >> text;
    bool korrekt = true;

//:solution
    std::stack<char> stapel;
    for (char z : text) {
        if (z == '(' || z == '[' || z == '{') {
            stapel.push(z);
        } else if (z == ')' || z == ']' || z == '}') {
            if (stapel.empty() || stapel.top() != passend(z)) {
                korrekt = false;
                break;
            }
            stapel.pop();
        }
    }
    if (!stapel.empty()) {
        korrekt = false;
    }
//:starter
    int saldo = 0;
    for (char z : text) {
        if (z == '(' || z == '[' || z == '{') saldo++;
        if (z == ')' || z == ']' || z == '}') saldo--;
    }
    korrekt = saldo == 0;
    (void)passend;
//:end

    std::cout << (korrekt ? "ok" : "fehler") << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn passend(zu: char) -> char {
    match zu {
        ')' => '(',
        ']' => '[',
        _ => '{',
    }
}

fn main() {
    let mut text = String::new();
    io::stdin().read_line(&mut text).unwrap();
    let text = text.trim();
    let mut korrekt = true;

//:solution
    let mut stapel: Vec<char> = Vec::new();
    for z in text.chars() {
        match z {
            '(' | '[' | '{' => stapel.push(z),
            ')' | ']' | '}' => {
                if stapel.pop() != Some(passend(z)) {
                    korrekt = false;
                    break;
                }
            }
            _ => {}
        }
    }
    if !stapel.is_empty() {
        korrekt = false;
    }
//:starter
    let mut saldo = 0;
    for z in text.chars() {
        if "([{".contains(z) {
            saldo += 1;
        }
        if ")]}".contains(z) {
            saldo -= 1;
        }
    }
    korrekt = korrekt && saldo == 0;
    let _ = passend;
//:end

    println!("{}", if korrekt { "ok" } else { "fehler" });
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'wofuer',
      title: 'Wofür welche Struktur?',
      question: 'Ein Drucker soll Aufträge in der Reihenfolge abarbeiten, in der sie eintreffen. Welche Struktur passt?',
      options: ['Ein Stapel (LIFO)', 'Eine Warteschlange (FIFO)', 'Eine Hash-Map', 'Ein sortiertes Array'],
      correct: 1,
      explain:
        'Wer zuerst kommt, wird zuerst gedruckt – das ist genau eine Warteschlange. Ein Stapel wäre richtig für „Rückgängig"-Funktionen (die letzte Aktion wird zuerst zurückgenommen), für den Aufrufstapel von Funktionen und eben für Klammern.',
    },
    {
      kind: 'quiz',
      id: 'liste-array',
      title: 'Array oder verkettete Liste?',
      question: 'Was kann eine verkettete Liste schneller als ein Array?',
      options: [
        'Auf das 1000. Element zugreifen.',
        'An einer Stelle, an der man schon steht, ein Element einfügen oder entfernen – ohne alle folgenden Elemente zu verschieben.',
        'Weniger Speicher pro Element belegen.',
        'Sortiert werden.',
      ],
      correct: 1,
      explain:
        'Beim Array müssen beim Einfügen in der Mitte alle folgenden Elemente eine Stelle weiterrücken: O(n). In der Liste werden nur zwei Verweise umgehängt: O(1). Dafür kostet der Zugriff per Position bei der Liste O(n), und jeder Knoten braucht zusätzlichen Platz für den Verweis. Weil moderne Prozessoren zusammenhängenden Speicher sehr schnell lesen, ist das Array in der Praxis trotzdem meist die bessere Wahl.',
    },
  ],
};

export default lesson;
