import { raw } from '../../types.ts';
import type { LessonCode, Step, TableView, TopoView } from '../../types.ts';

const PCS = [
  { id: 'A', mac: 'aa:01', port: 1, x: 110, y: 50 },
  { id: 'B', mac: 'bb:02', port: 2, x: 530, y: 50 },
  { id: 'C', mac: 'cc:03', port: 3, x: 110, y: 230 },
  { id: 'D', mac: 'dd:04', port: 4, x: 530, y: 230 },
];

const topo = (packets: { to: string; from: string; label: string; t?: number }[], hi: string[] = []): TopoView => ({
  height: 280,
  nodes: [
    { id: 'sw', label: 'Switch', sub: 'Ports 1–4', kind: 'switch', x: 320, y: 140, hi: hi.includes('sw') },
    ...PCS.map((p) => ({ id: p.id, label: `PC ${p.id}`, sub: `MAC ${p.mac}`, kind: 'pc' as const, x: p.x, y: p.y, hi: hi.includes(p.id) })),
  ],
  links: PCS.map((p) => ({ a: p.id, b: 'sw', label: `Port ${p.port}`, hi: packets.some((k) => k.to === p.id || k.from === p.id) })),
  packets: packets.map((k) => ({ a: k.from, b: k.to, t: k.t ?? 0.5, label: k.label })),
});

const tabelle = (rows: [string, number][], hi?: number): TableView => ({ name: 'MAC-Tabelle des Switches', columns: ['MAC-Adresse', 'Port'], rows, hi: hi === undefined ? [] : [hi] });

const lesson: LessonCode = {
  scenes: {
    lernen: {
      title: 'Wie ein Switch lernt',
      build: (): Step[] => [
        {
          note: 'Vier Rechner an einem **Switch**. Jeder hat eine weltweit eindeutige **MAC-Adresse**, die in seiner Netzwerkkarte eingebrannt ist (hier gekürzt). Die Tabelle des Switches ist anfangs leer: Er weiß nicht, wer wo hängt.',
          topo: topo([]),
          tables: [tabelle([])],
        },
        {
          note: 'A schickt einen Rahmen an B. Der Switch liest die **Absenderadresse** und lernt: aa:01 erreicht man über Port 1.',
          topo: topo([{ from: 'A', to: 'sw', label: 'an bb:02', t: 0.6 }], ['A']),
          tables: [tabelle([['aa:01', 1]], 0)],
        },
        {
          note: 'Wo B hängt, weiß er noch nicht. Also schickt er den Rahmen an **alle** anderen Ports (*Flooding*). C und D sehen, dass er nicht für sie ist, und werfen ihn weg.',
          topo: topo([
            { from: 'sw', to: 'B', label: 'an bb:02' },
            { from: 'sw', to: 'C', label: 'an bb:02' },
            { from: 'sw', to: 'D', label: 'an bb:02' },
          ]),
          tables: [tabelle([['aa:01', 1]])],
        },
        {
          note: 'B antwortet. Wieder lernt der Switch aus der Absenderadresse: bb:02 hängt an Port 2.',
          topo: topo([{ from: 'B', to: 'sw', label: 'an aa:01', t: 0.6 }], ['B']),
          tables: [tabelle([['aa:01', 1], ['bb:02', 2]], 1)],
        },
        {
          note: 'Das Ziel aa:01 steht schon in der Tabelle. Der Rahmen geht **nur** an Port 1 – C und D bekommen nichts mehr mit. Genau das unterscheidet einen Switch von einem alten Hub, der alles an alle schickte.',
          topo: topo([{ from: 'sw', to: 'A', label: 'an aa:01' }]),
          tables: [tabelle([['aa:01', 1], ['bb:02', 2]], 0)],
        },
        {
          note: 'Ein **Broadcast** geht an die besondere Adresse ff:ff:ff:ff:ff:ff und wird immer an alle Ports geschickt – so fragt man etwa „Wer hat diese IP-Adresse?" (mehr dazu bei ARP). Dabei lernt der Switch nebenbei, dass cc:03 an Port 3 hängt.',
          topo: topo([
            { from: 'sw', to: 'A', label: 'an alle' },
            { from: 'sw', to: 'B', label: 'an alle' },
            { from: 'sw', to: 'D', label: 'an alle' },
          ], ['C']),
          tables: [tabelle([['aa:01', 1], ['bb:02', 2], ['cc:03', 3]], 2)],
        },
      ],
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'switch',
      title: 'Einen Switch programmieren',
      prompt:
        'Simuliere einen lernenden Switch. Jede Eingabezeile ist ein eintreffender Rahmen: `<Port> <Absender> <Ziel>`. Die Zieladresse `FF` steht für Broadcast.\n\nFür jeden Rahmen: Erst die Absenderadresse mit ihrem Port merken (eine spätere Zeile mit derselben Adresse überschreibt den alten Eintrag). Dann ausgeben, wohin der Rahmen geht:\n- `an Port <n>`, wenn das Ziel bekannt ist,\n- `an alle außer Port <n>` bei unbekanntem Ziel oder Broadcast (n ist der Eingangsport).',
      tests: [
        { name: 'Lernen und weiterleiten', stdin: '1 A B\n2 B A\n3 C FF\n1 A C\n', expected: 'an alle außer Port 1\nan Port 1\nan alle außer Port 3\nan Port 3\n' },
        { name: 'Ein Rechner zieht um', stdin: '1 A B\n4 A B\n2 B A\n', expected: 'an alle außer Port 1\nan alle außer Port 4\nan Port 4\n' },
      ],
      hints: [
        'Die MAC-Tabelle ist eine Map von Adresse auf Port – siehe Lektion „Maps und Dictionaries".',
        'Reihenfolge: zuerst lernen, dann nachschlagen. Ein Broadcast wird nie nachgeschlagen.',
      ],
      code: {
        python: raw`
import sys

tabelle = {}
for zeile in sys.stdin:
    teile = zeile.split()
    if len(teile) != 3:
        continue
    port, absender, ziel = int(teile[0]), teile[1], teile[2]
#:solution
    tabelle[absender] = port
    if ziel != "FF" and ziel in tabelle:
        print("an Port", tabelle[ziel])
    else:
        print("an alle außer Port", port)
#:starter
    print("an alle außer Port", port)
#:end
`,
        java: raw`
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Map<String, Integer> tabelle = new HashMap<>();
        while (in.hasNext()) {
            int port = in.nextInt();
            String absender = in.next();
            String ziel = in.next();
//:solution
            tabelle.put(absender, port);
            if (!ziel.equals("FF") && tabelle.containsKey(ziel)) {
                System.out.println("an Port " + tabelle.get(ziel));
            } else {
                System.out.println("an alle außer Port " + port);
            }
//:starter
            System.out.println("an alle außer Port " + port);
//:end
        }
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

// Eine kleine MAC-Tabelle: Adressen und Ports in zwei parallelen Arrays.
char adressen[100][16];
int ports[100];
int eintraege = 0;

int finde(const char *mac) {
    for (int i = 0; i < eintraege; i++) {
        if (strcmp(adressen[i], mac) == 0) {
            return i;
        }
    }
    return -1;
}

int main(void) {
    int port;
    char absender[16], ziel[16];
    while (scanf("%d %15s %15s", &port, absender, ziel) == 3) {
//:solution
        int i = finde(absender);
        if (i == -1) {
            i = eintraege++;
            strcpy(adressen[i], absender);
        }
        ports[i] = port;

        int z = finde(ziel);
        if (strcmp(ziel, "FF") != 0 && z != -1) {
            printf("an Port %d\n", ports[z]);
        } else {
            printf("an alle außer Port %d\n", port);
        }
//:starter
        printf("an alle außer Port %d\n", port);
//:end
    }
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <string>
#include <unordered_map>

int main() {
    std::unordered_map<std::string, int> tabelle;
    int port;
    std::string absender, ziel;
    while (std::cin >> port >> absender >> ziel) {
//:solution
        tabelle[absender] = port;
        auto treffer = tabelle.find(ziel);
        if (ziel != "FF" && treffer != tabelle.end()) {
            std::cout << "an Port " << treffer->second << "\n";
        } else {
            std::cout << "an alle außer Port " << port << "\n";
        }
//:starter
        std::cout << "an alle außer Port " << port << "\n";
//:end
    }
    return 0;
}
`,
        rust: raw`
use std::collections::HashMap;
use std::io::{self, BufRead};

fn main() {
    let mut tabelle: HashMap<String, u32> = HashMap::new();
    for zeile in io::stdin().lock().lines() {
        let zeile = zeile.unwrap();
        let teile: Vec<&str> = zeile.split_whitespace().collect();
        if teile.len() != 3 {
            continue;
        }
        let port: u32 = teile[0].parse().unwrap();
        let (absender, ziel) = (teile[1], teile[2]);
//:solution
        tabelle.insert(absender.to_string(), port);
        match tabelle.get(ziel) {
            Some(p) if ziel != "FF" => println!("an Port {}", p),
            _ => println!("an alle außer Port {}", port),
        }
//:starter
        let _ = (&mut tabelle, absender, ziel);
        println!("an alle außer Port {}", port);
//:end
    }
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'mac-ip',
      title: 'Zwei Adressen?',
      question: 'Jeder Rechner hat eine MAC-Adresse **und** eine IP-Adresse. Warum reicht nicht eine?',
      options: [
        'Aus Tradition.',
        'Die MAC-Adresse identifiziert die Netzwerkkarte und gilt nur im lokalen Netz. Die IP-Adresse beschreibt, **wo** im Internet ein Rechner hängt, und lässt sich deshalb für die Wegfindung über viele Netze hinweg benutzen.',
        'Die MAC-Adresse ist für WLAN, die IP-Adresse für Kabel.',
        'Die IP-Adresse ist nur eine verschlüsselte MAC-Adresse.',
      ],
      correct: 1,
      explain:
        'MAC-Adressen sind wie Personalausweisnummern: eindeutig, aber ohne Aussage über den Wohnort. Ein Router könnte damit nichts anfangen – er bräuchte eine Liste aller Netzwerkkarten der Welt. IP-Adressen sind wie Postanschriften: hierarchisch aufgebaut, sodass jeder Router nur wissen muss, in welche Richtung ein ganzer Adressbereich liegt.',
    },
  ],
};

export default lesson;
