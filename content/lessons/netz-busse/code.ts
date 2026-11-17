import { raw } from '../../types.ts';
import type { LessonCode, Step, TableView, TopoView } from '../../types.ts';

const IDS = [
  { name: 'Bremse', id: 0b00100110000 },
  { name: 'Motor', id: 0b00100101100 },
  { name: 'Radio', id: 0b01100000000 },
];

const busTopo = (sender: string[], hi?: string, packet?: string): TopoView => ({
  height: 190,
  nodes: [
    { id: 'bus', label: 'CAN-Bus', sub: 'zwei verdrillte Leitungen', kind: 'bus', x: 320, y: 140, w: 560 },
    ...IDS.map((n, i) => ({
      id: n.name,
      label: n.name,
      sub: `ID ${n.id.toString(2).padStart(11, '0')}`,
      kind: 'device' as const,
      x: 120 + i * 200,
      y: 50,
      hi: n.name === hi,
      dim: !sender.includes(n.name) && n.name !== hi,
    })),
  ],
  links: IDS.map((n) => ({ a: n.name, b: 'bus', hi: n.name === hi, dim: !sender.includes(n.name) && n.name !== hi })),
  packets: packet ? [{ a: packet, b: 'bus', t: 0.55, label: 'Nachricht' }] : [],
});

const bits = (upto: number): TableView => {
  const rows = IDS.map((n) => {
    const b = n.id.toString(2).padStart(11, '0').split('');
    return [n.name, ...b.map((x, i) => (i <= upto ? x : '·'))];
  });
  const busRow = ['Bus', ...Array.from({ length: 11 }, (_, i) => (i <= upto ? String(Math.min(...IDS.map((n) => Number(n.id.toString(2).padStart(11, '0')[i])))) : '·'))];
  return { name: 'Arbitrierung: Bits der Kennungen (0 setzt sich durch)', columns: ['', ...Array.from({ length: 11 }, (_, i) => String(10 - i))], rows: [...rows, busRow], hi: [3], hiCols: upto >= 0 ? [upto + 1] : [] };
};

const lesson: LessonCode = {
  scenes: {
    can: {
      title: 'CAN: Wer darf senden?',
      build: (): Step[] => {
        const steps: Step[] = [
          {
            note: 'Ein Auto hat Dutzende Steuergeräte, alle an **einer** gemeinsamen Leitung: einem **Bus**. Jedes hört alles. Problem: Was passiert, wenn mehrere gleichzeitig senden wollen? Hier wollen Bremse, Motor und Radio im selben Moment loslegen.',
            topo: busTopo(['Bremse', 'Motor', 'Radio']),
            tables: [bits(-1)],
          },
        ];
        const alive = new Set(IDS.map((n) => n.name));
        for (let i = 0; i < 11; i++) {
          const busBit = Math.min(...IDS.filter((n) => alive.has(n.name)).map((n) => Number(n.id.toString(2).padStart(11, '0')[i])));
          const raus = IDS.filter((n) => alive.has(n.name) && Number(n.id.toString(2).padStart(11, '0')[i]) !== busBit).map((n) => n.name);
          raus.forEach((r) => alive.delete(r));
          if (raus.length > 0 || i === 0) {
            steps.push({
              note:
                i === 0
                  ? 'Alle senden gleichzeitig ihre **Kennung** (ID), Bit für Bit, und hören dabei mit. Eine **0 ist dominant**: Sendet auch nur einer eine 0, liegt auf dem Bus eine 0 – egal, was die anderen senden.' +
                    (raus.length ? ` Das Radio sendet eine 1, hört aber eine 0 – es hat verloren und hört sofort auf zu senden.` : '')
                  : `Bit ${10 - i}: ${raus.join(' und ')} ${raus.length > 1 ? 'senden' : 'sendet'} eine 1, auf dem Bus liegt aber eine 0. ${raus.length > 1 ? 'Sie ziehen' : 'Zieht'} sich zurück.`,
              topo: busTopo([...alive]),
              tables: [bits(i)],
            });
          }
        }
        const sieger = [...alive][0];
        steps.push({
          note: `Übrig bleibt die **${sieger}** – die Nachricht mit der kleinsten Kennung, also der höchsten Priorität. Sie hat ihre Nachricht ungestört gesendet, ohne dass Zeit verloren ging. Die Verlierer versuchen es gleich danach erneut. Darum bekommen sicherheitskritische Nachrichten die kleinsten Kennungen.`,
          topo: busTopo([], sieger, sieger),
          tables: [bits(10)],
        });
        return steps;
      },
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'arbitrierung',
      title: 'Die Arbitrierung nachbauen',
      prompt:
        'Simuliere die CAN-Arbitrierung. Das Programm liest mehrere 11-Bit-Kennungen (Dezimalzahlen von 0 bis 2047, eine pro Gerät). Gehe die Bits vom höchsten (Bit 10) zum niedrigsten (Bit 0) durch: Auf dem Bus liegt eine 0, sobald irgendein noch aktives Gerät eine 0 sendet. Ein Gerät, das eine 1 sendet, während der Bus 0 zeigt, scheidet aus.\n\nGib für jedes Gerät in Eingabe-Reihenfolge eine Zeile aus: `<ID> verliert bei Bit <n>` oder `<ID> gewinnt`.',
      tests: [
        { name: 'Bremse, Motor, Radio', stdin: '304 300 768\n', expected: '304 verliert bei Bit 4\n300 gewinnt\n768 verliert bei Bit 9\n' },
        { name: 'Zwei Geräte', stdin: '5 4\n', expected: '5 verliert bei Bit 0\n4 gewinnt\n' },
        { name: 'Ein Gerät', stdin: '1000\n', expected: '1000 gewinnt\n' },
      ],
      hints: [
        'Bit n einer Zahl x bekommst du mit `(x >> n) & 1`.',
        'Merke dir für jedes Gerät, ob es noch aktiv ist und bei welchem Bit es ausgeschieden ist. Pro Bit: Erst das Bus-Bit aus allen aktiven Geräten bestimmen (Minimum), dann die mit einer 1 ausscheiden lassen.',
      ],
      code: {
        python: raw`
ids = list(map(int, input().split()))
verloren = [None] * len(ids)   # Bit, bei dem Gerät i verloren hat

#:solution
for bit in range(10, -1, -1):
    aktiv = [i for i in range(len(ids)) if verloren[i] is None]
    bus = min((ids[i] >> bit) & 1 for i in aktiv)
    for i in aktiv:
        if (ids[i] >> bit) & 1 != bus:
            verloren[i] = bit
#:starter
# Gehe die Bits von 10 bis 0 durch und trage ein, wer wann verliert.
#:end

for i, x in enumerate(ids):
    if verloren[i] is None:
        print(x, "gewinnt")
    else:
        print(x, "verliert bei Bit", verloren[i])
`,
        java: raw`
import java.util.Arrays;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        int[] ids = Arrays.stream(new Scanner(System.in).nextLine().trim().split("\\s+")).mapToInt(Integer::parseInt).toArray();
        int[] verloren = new int[ids.length];
        Arrays.fill(verloren, -1);   // -1 heißt: noch dabei

//:solution
        for (int bit = 10; bit >= 0; bit--) {
            int bus = 1;
            for (int i = 0; i < ids.length; i++) {
                if (verloren[i] == -1) {
                    bus = Math.min(bus, (ids[i] >> bit) & 1);
                }
            }
            for (int i = 0; i < ids.length; i++) {
                if (verloren[i] == -1 && ((ids[i] >> bit) & 1) != bus) {
                    verloren[i] = bit;
                }
            }
        }
//:starter
        // Gehe die Bits von 10 bis 0 durch und trage ein, wer wann verliert.
//:end

        for (int i = 0; i < ids.length; i++) {
            if (verloren[i] == -1) {
                System.out.println(ids[i] + " gewinnt");
            } else {
                System.out.println(ids[i] + " verliert bei Bit " + verloren[i]);
            }
        }
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int ids[64];
    int verloren[64];
    int n = 0;
    while (n < 64 && scanf("%d", &ids[n]) == 1) {
        verloren[n] = -1;   // -1 heißt: noch dabei
        n++;
    }

//:solution
    for (int bit = 10; bit >= 0; bit--) {
        int bus = 1;
        for (int i = 0; i < n; i++) {
            if (verloren[i] == -1 && ((ids[i] >> bit) & 1) == 0) {
                bus = 0;
            }
        }
        for (int i = 0; i < n; i++) {
            if (verloren[i] == -1 && ((ids[i] >> bit) & 1) != bus) {
                verloren[i] = bit;
            }
        }
    }
//:starter
    // Gehe die Bits von 10 bis 0 durch und trage ein, wer wann verliert.
//:end

    for (int i = 0; i < n; i++) {
        if (verloren[i] == -1) {
            printf("%d gewinnt\n", ids[i]);
        } else {
            printf("%d verliert bei Bit %d\n", ids[i], verloren[i]);
        }
    }
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> ids;
    for (int x; std::cin >> x;) {
        ids.push_back(x);
    }
    std::vector<int> verloren(ids.size(), -1);   // -1 heißt: noch dabei

//:solution
    for (int bit = 10; bit >= 0; bit--) {
        int bus = 1;
        for (std::size_t i = 0; i < ids.size(); i++) {
            if (verloren[i] == -1 && ((ids[i] >> bit) & 1) == 0) {
                bus = 0;
            }
        }
        for (std::size_t i = 0; i < ids.size(); i++) {
            if (verloren[i] == -1 && ((ids[i] >> bit) & 1) != bus) {
                verloren[i] = bit;
            }
        }
    }
//:starter
    // Gehe die Bits von 10 bis 0 durch und trage ein, wer wann verliert.
//:end

    for (std::size_t i = 0; i < ids.size(); i++) {
        if (verloren[i] == -1) {
            std::cout << ids[i] << " gewinnt\n";
        } else {
            std::cout << ids[i] << " verliert bei Bit " << verloren[i] << "\n";
        }
    }
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let ids: Vec<u32> = zeile.split_whitespace().map(|t| t.parse().unwrap()).collect();
    let mut verloren: Vec<Option<u32>> = vec![None; ids.len()];

//:solution
    for bit in (0..=10).rev() {
        let bus = (0..ids.len())
            .filter(|&i| verloren[i].is_none())
            .map(|i| (ids[i] >> bit) & 1)
            .min()
            .unwrap();
        for i in 0..ids.len() {
            if verloren[i].is_none() && (ids[i] >> bit) & 1 != bus {
                verloren[i] = Some(bit);
            }
        }
    }
//:starter
    // Gehe die Bits von 10 bis 0 durch und trage ein, wer wann verliert.
    let _ = &mut verloren;
//:end

    for (i, x) in ids.iter().enumerate() {
        match verloren[i] {
            None => println!("{} gewinnt", x),
            Some(bit) => println!("{} verliert bei Bit {}", x, bit),
        }
    }
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'bus-oder-stern',
      title: 'Bus oder Punkt-zu-Punkt?',
      question: 'USB und PCI Express heißen „Bus", verbinden technisch aber jedes Gerät einzeln mit dem Rechner. Warum hat man den gemeinsamen Draht aufgegeben?',
      options: [
        'Weil Kupfer zu teuer wurde.',
        'Weil sich auf einer gemeinsamen Leitung alle Geräte die Bandbreite teilen und auf das langsamste warten müssen. Eigene Verbindungen sind schneller und stören sich nicht gegenseitig.',
        'Weil Busse keine Daten übertragen können.',
        'Weil Busse nur im Auto erlaubt sind.',
      ],
      correct: 1,
      explain:
        'Echte Busse (CAN, I²C, das alte Ethernet mit Koaxialkabel) sind billig und einfach zu verkabeln, aber geteilt. Bei hohen Geschwindigkeiten machen elektrische Reflexionen und Abstimmung zwischen vielen Teilnehmern Probleme. Moderne schnelle Verbindungen sind deshalb Punkt-zu-Punkt-Leitungen, oft mehrere parallel (PCIe x16 = 16 Leitungspaare) – den Namen „Bus" haben sie behalten.',
    },
  ],
};

export default lesson;
