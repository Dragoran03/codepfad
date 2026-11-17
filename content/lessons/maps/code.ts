import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';
import { trace } from '../../util.ts';

const FAECHER = 5;
const hash = (s: string) => [...s].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

const lesson: LessonCode = {
  snippets: {
    preise: {
      python: raw`
preise = {}  #@neu
preise["apfel"] = 3  #@put1
preise["birne"] = 5  #@put2
preise["kiwi"] = 2  #@put3

print(preise["birne"])  #@get

if "mango" not in preise:  #@fehlt
    print("Mango führen wir nicht")
`,
      java: raw`
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> preise = new HashMap<>();  //@neu
        preise.put("apfel", 3);  //@put1
        preise.put("birne", 5);  //@put2
        preise.put("kiwi", 2);  //@put3

        System.out.println(preise.get("birne"));  //@get

        if (!preise.containsKey("mango")) {  //@fehlt
            System.out.println("Mango führen wir nicht");
        }
    }
}
`,
      c: raw`
#include <stdio.h>
#include <string.h>

// C hat keine eingebaute Map. Hier die einfachste Variante:
// eine Liste aus Paaren, die von vorn nach hinten durchsucht wird.
struct Eintrag {
    const char *schluessel;
    int wert;
};

struct Eintrag preise[10];  //@neu
int anzahl = 0;

void setze(const char *schluessel, int wert) {
    preise[anzahl].schluessel = schluessel;
    preise[anzahl].wert = wert;
    anzahl++;
}

// Liefert die Position des Schlüssels oder -1.
int finde(const char *schluessel) {
    for (int i = 0; i < anzahl; i++) {
        if (strcmp(preise[i].schluessel, schluessel) == 0) {
            return i;
        }
    }
    return -1;
}

int main(void) {
    setze("apfel", 3);  //@put1
    setze("birne", 5);  //@put2
    setze("kiwi", 2);  //@put3

    printf("%d\n", preise[finde("birne")].wert);  //@get

    if (finde("mango") == -1) {  //@fehlt
        printf("Mango führen wir nicht\n");
    }
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <string>
#include <unordered_map>

int main() {
    std::unordered_map<std::string, int> preise;  //@neu
    preise["apfel"] = 3;  //@put1
    preise["birne"] = 5;  //@put2
    preise["kiwi"] = 2;  //@put3

    std::cout << preise["birne"] << "\n";  //@get

    if (!preise.contains("mango")) {  //@fehlt
        std::cout << "Mango führen wir nicht\n";
    }
    return 0;
}
`,
      rust: raw`
use std::collections::HashMap;

fn main() {
    let mut preise = HashMap::new();  //@neu
    preise.insert("apfel", 3);  //@put1
    preise.insert("birne", 5);  //@put2
    preise.insert("kiwi", 2);  //@put3

    println!("{}", preise["birne"]);  //@get

    if !preise.contains_key("mango") {  //@fehlt
        println!("Mango führen wir nicht");
    }
}
`,
    },
  },

  scenes: {
    hash: {
      title: 'So findet eine Hash-Tabelle ihren Platz',
      code: 'preise',
      build: (_p, lang) =>
        trace((t) => {
          const buckets: string[][] = Array.from({ length: FAECHER }, () => []);
          const snap = () => buckets.map((b) => [...b]);
          const rechnung = (k: string) => `hash("${k}") = ${hash(k)}   →   ${hash(k)} % ${FAECHER} = Fach ${hash(k) % FAECHER}`;
          t.step(
            'neu',
            lang === 'c'
              ? 'Das C-Beispiel links durchsucht seine Liste einfach von vorn nach hinten. Die Animation zeigt, wie die eingebauten Maps der anderen Sprachen arbeiten – und wie man es auch in C bauen würde: mit einer **Hash-Tabelle**. Sie besteht aus nummerierten Fächern.'
              : 'Eine Map speichert Paare aus **Schlüssel** und **Wert**. Im Inneren steckt ein Array aus Fächern – hier fünf. Die Frage ist: In welches Fach kommt welcher Schlüssel?',
            { buckets: { buckets: snap() } },
          );
          const put = (tag: string, k: string, v: number, note: string) => {
            const f = hash(k) % FAECHER;
            t.step(tag, note, { buckets: { buckets: snap(), hi: f, hash: rechnung(k) } });
            buckets[f].push(`${k} → ${v}`);
            t.step(tag, `Das Paar landet in Fach ${f}.`, { buckets: { buckets: snap(), hi: f, hash: rechnung(k) } });
          };
          put('put1', 'apfel', 3, 'Eine **Hash-Funktion** rechnet den Schlüssel in eine Zahl um (hier vereinfacht: die Summe der Zeichencodes). Der Rest beim Teilen durch die Fächerzahl ergibt die Fachnummer.');
          put('put2', 'birne', 5, 'Derselbe Rechenweg für den nächsten Schlüssel. Die Verteilung wirkt zufällig, ist aber für denselben Schlüssel immer gleich.');
          put('put3', 'kiwi', 2, 'Und noch einmal. Beachte: Die Fächer füllen sich nicht der Reihe nach.');
          const fb = hash('birne') % FAECHER;
          t.step('get', 'Jetzt wird nachgeschlagen. Statt alle Einträge zu durchsuchen, wird **dieselbe Rechnung** wiederholt – sie führt direkt zum richtigen Fach.', {
            buckets: { buckets: snap(), hi: fb, hash: rechnung('birne') },
          });
          t.print(5);
          t.step('get', 'In Fach 3 liegt `birne`. Ein Rechenschritt, ein Blick – egal ob die Map drei Einträge hat oder drei Millionen.', {
            buckets: { buckets: snap(), hi: fb, hash: rechnung('birne') },
          });
          const fm = hash('mango') % FAECHER;
          t.step('fehlt', 'Gibt es `mango`? Die Rechnung führt zu Fach 0. Dort liegt zwar etwas, aber der Schlüssel `apfel` ist nicht `mango`. Zwei Schlüssel im selben Fach nennt man **Kollision** – deshalb wird im Fach immer noch der Schlüssel verglichen.', {
            buckets: { buckets: snap(), hi: fm, hash: rechnung('mango') },
          });
          t.print('Mango führen wir nicht');
          t.step('fehlt', 'Auch „nicht vorhanden" steht nach einem einzigen Blick fest.', { buckets: { buckets: snap(), hi: fm, hash: rechnung('mango') } });
        }),
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'stimmen',
      title: 'Stimmen auszählen',
      prompt:
        'Bei einer Abstimmung wurden `n` Stimmen abgegeben; jede Stimme ist ein Wort. Zähle, wie oft jedes Wort vorkommt. Das Programm gibt am Ende den Sieger und seine Stimmenzahl aus (das ist schon fertig) – es fehlt nur das Zählen.\n\nBeispiel: Aus `kiwi apfel kiwi birne kiwi apfel` wird `kiwi 3`.',
      tests: [
        { name: 'Sechs Stimmen', stdin: '6\nkiwi apfel kiwi birne kiwi apfel\n', expected: 'kiwi 3\n' },
        { name: 'Eine Stimme', stdin: '1\nmango\n', expected: 'mango 1\n' },
        { name: 'Zwei Kandidaten', stdin: '5\na b b a b\n', expected: 'b 3\n' },
      ],
      hints: [
        'Für jede Stimme gibt es zwei Fälle: Das Wort steht schon in der Map (dann den Zähler um 1 erhöhen) oder noch nicht (dann mit 1 eintragen).',
        'Viele Sprachen haben dafür eine Abkürzung: „Hole den Wert oder nimm 0, falls er fehlt" – und dann plus 1.',
      ],
      code: {
        python: raw`
n = int(input())
namen = input().split()

stimmen = {}
for name in namen:
#:solution
    if name in stimmen:
        stimmen[name] = stimmen[name] + 1
    else:
        stimmen[name] = 1
#:starter
    # Zähle die Stimme für name.
    pass
#:end

sieger = "niemand"
meiste = 0
for name in stimmen:
    if stimmen[name] > meiste:
        sieger = name
        meiste = stimmen[name]
print(sieger, meiste)
`,
        java: raw`
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();

        Map<String, Integer> stimmen = new HashMap<>();
        for (int i = 0; i < n; i++) {
            String name = in.next();
//:solution
            stimmen.put(name, stimmen.getOrDefault(name, 0) + 1);
//:starter
            // Zähle die Stimme für name.
            // Nützlich: stimmen.getOrDefault(name, 0) liefert 0, wenn name noch fehlt.
//:end
        }

        String sieger = "niemand";
        int meiste = 0;
        for (String name : stimmen.keySet()) {
            if (stimmen.get(name) > meiste) {
                sieger = name;
                meiste = stimmen.get(name);
            }
        }
        System.out.println(sieger + " " + meiste);
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    int n;
    scanf("%d", &n);

    // Zwei gleich lange Arrays bilden die "Map": namen[i] hat stimmen[i] Stimmen.
    char namen[100][21];
    int stimmen[100];
    int anzahl = 0;  // wie viele verschiedene Namen bisher

    for (int i = 0; i < n; i++) {
        char name[21];
        scanf("%20s", name);
//:solution
        int position = -1;
        for (int j = 0; j < anzahl; j++) {
            if (strcmp(namen[j], name) == 0) {
                position = j;
            }
        }
        if (position == -1) {
            strcpy(namen[anzahl], name);
            stimmen[anzahl] = 1;
            anzahl++;
        } else {
            stimmen[position]++;
        }
//:starter
        // Suche name in namen[0] bis namen[anzahl - 1] (vergleichen mit strcmp).
        // Gefunden: stimmen an dieser Position erhöhen.
        // Nicht gefunden: mit strcpy neu eintragen, stimmen dort auf 1 setzen, anzahl erhöhen.
//:end
    }

    if (anzahl == 0) {
        printf("niemand 0\n");
        return 0;
    }
    int sieger = 0;
    for (int j = 1; j < anzahl; j++) {
        if (stimmen[j] > stimmen[sieger]) {
            sieger = j;
        }
    }
    printf("%s %d\n", namen[sieger], stimmen[sieger]);
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <string>
#include <unordered_map>

int main() {
    int n;
    std::cin >> n;

    std::unordered_map<std::string, int> stimmen;
    for (int i = 0; i < n; i++) {
        std::string name;
        std::cin >> name;
//:solution
        stimmen[name] = stimmen[name] + 1;
//:starter
        // Zähle die Stimme für name.
        // Nützlich: stimmen[name] legt einen fehlenden Eintrag automatisch mit 0 an.
//:end
    }

    std::string sieger = "niemand";
    int meiste = 0;
    for (const auto &[name, zahl] : stimmen) {
        if (zahl > meiste) {
            sieger = name;
            meiste = zahl;
        }
    }
    std::cout << sieger << " " << meiste << "\n";
    return 0;
}
`,
        rust: raw`
use std::collections::HashMap;
use std::io::{self, Read};

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut woerter = eingabe.split_whitespace();
    let n: usize = woerter.next().unwrap().parse().unwrap();

    let mut stimmen: HashMap<String, i32> = HashMap::new();
    for name in woerter.take(n) {
//:solution
        *stimmen.entry(name.to_string()).or_insert(0) += 1;
//:starter
        // Zähle die Stimme für name.
        // Nützlich: stimmen.entry(name.to_string()).or_insert(0) liefert eine
        // veränderliche Referenz auf den Zähler (neu angelegt mit 0, falls er fehlt).
        // Mit einem * davor kannst du den Wert ändern.
        let _ = (name, &mut stimmen);
//:end
    }

    let mut sieger = String::from("niemand");
    let mut meiste = 0;
    for (name, zahl) in &stimmen {
        if *zahl > meiste {
            sieger = name.clone();
            meiste = *zahl;
        }
    }
    println!("{} {}", sieger, meiste);
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'schnell',
      title: 'Warum so schnell?',
      question: 'Eine Map enthält eine Million Einträge. Warum dauert das Nachschlagen eines Schlüssels trotzdem kaum länger als bei zehn Einträgen?',
      options: [
        'Weil die Einträge alphabetisch sortiert sind.',
        'Weil aus dem Schlüssel direkt berechnet wird, in welchem Fach der Eintrag liegen muss.',
        'Weil die Map die zuletzt benutzten Schlüssel zwischenspeichert.',
        'Weil moderne Prozessoren eine Million Vergleiche in null Zeit schaffen.',
      ],
      correct: 1,
      explain:
        'Die Hash-Funktion macht aus dem Schlüssel eine Fachnummer. Es wird nicht gesucht, sondern gerechnet – und der Rechenaufwand hängt nicht davon ab, wie voll die Map ist. Eine Liste dagegen müsste im schlimmsten Fall alle Einträge vergleichen.',
    },
    {
      kind: 'quiz',
      id: 'wahl',
      title: 'Liste oder Map?',
      question: 'Du speicherst zu 5.000 Artikelnummern jeweils den Lagerbestand und musst ständig den Bestand einer bestimmten Artikelnummer abfragen. Welche Struktur passt?',
      options: [
        'Eine Liste der Bestände in der Reihenfolge des Wareneingangs.',
        'Eine Map von Artikelnummer auf Bestand.',
        'Zwei Listen: eine mit Nummern, eine mit Beständen.',
        'Ein einziger langer String.',
      ],
      correct: 1,
      explain:
        'Sobald die Frage lautet „Was gehört zu **diesem** Schlüssel?", ist eine Map die richtige Wahl. Listen sind gut, wenn die Reihenfolge zählt oder du ohnehin alles der Reihe nach durchgehst.',
    },
  ],
};

export default lesson;
