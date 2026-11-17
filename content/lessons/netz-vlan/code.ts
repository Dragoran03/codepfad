import { raw } from '../../types.ts';
import type { LessonCode, Step, TopoView } from '../../types.ts';

const PCS = [
  { id: 'v1', label: 'Vertrieb 1', vlan: 10, sw: 's1', x: 70, y: 40 },
  { id: 'e1', label: 'Entwicklung 1', vlan: 20, sw: 's1', x: 70, y: 240 },
  { id: 'v2', label: 'Vertrieb 2', vlan: 10, sw: 's2', x: 570, y: 40 },
  { id: 'e2', label: 'Entwicklung 2', vlan: 20, sw: 's2', x: 570, y: 240 },
  { id: 'e3', label: 'Entwicklung 3', vlan: 20, sw: 's2', x: 570, y: 140 },
];
const tone = (vlan: number) => (vlan === 10 ? 0 : 1);

const topo = (packets: { a: string; b: string; label: string; vlan?: number }[], hi: string[] = [], dim: string[] = []): TopoView => ({
  height: 280,
  nodes: [
    { id: 's1', label: 'Switch 1', sub: 'Erdgeschoss', kind: 'switch', x: 230, y: 140 },
    { id: 's2', label: 'Switch 2', sub: '1. Stock', kind: 'switch', x: 410, y: 140 },
    ...PCS.map((p) => ({ id: p.id, label: p.label, sub: `VLAN ${p.vlan}`, kind: 'pc' as const, x: p.x, y: p.y, tone: tone(p.vlan), hi: hi.includes(p.id), dim: dim.includes(p.id) })),
  ],
  links: [
    ...PCS.map((p) => ({ a: p.id, b: p.sw, tone: tone(p.vlan), dim: dim.includes(p.id) })),
    { a: 's1', b: 's2', label: 'Trunk (10, 20)', hi: packets.some((k) => (k.a === 's1' && k.b === 's2') || (k.a === 's2' && k.b === 's1')) },
  ],
  packets: packets.map((k) => ({ a: k.a, b: k.b, label: k.label, tone: k.vlan === undefined ? undefined : tone(k.vlan) })),
});

const lesson: LessonCode = {
  scenes: {
    vlan: {
      title: 'Zwei Netze auf denselben Switches',
      build: (): Step[] => [
        {
          note: 'Zwei Abteilungen, zwei Stockwerke, zwei Switches. Vertrieb und Entwicklung sollen getrennte Netze haben – aber niemand will doppelte Kabel und Switches. Die Lösung: **VLANs** (*virtuelle LANs*). Jeder Port wird einem VLAN zugeordnet: Vertrieb = 10 (blau), Entwicklung = 20 (orange).',
          topo: topo([]),
        },
        {
          note: 'Entwicklung 1 schickt einen **Broadcast**. Ohne VLANs ginge er an alle. Der Switch weiß aber: Der Rahmen kam aus VLAN 20. Er darf nur an Ports desselben VLANs.',
          topo: topo([{ a: 'e1', b: 's1', label: 'an alle', vlan: 20 }], ['e1']),
        },
        {
          note: 'Zwischen den Switches liegt ein **Trunk**: eine Leitung, die mehrere VLANs gleichzeitig trägt. Damit der andere Switch weiß, zu welchem VLAN ein Rahmen gehört, fügt Switch 1 eine **Markierung** (*Tag*) mit der VLAN-Nummer ein.',
          topo: topo([{ a: 's1', b: 's2', label: 'Tag: VLAN 20', vlan: 20 }]),
          layers: { layers: [{ label: 'Ethernet', sub: 'an ff:ff:ff:ff:ff:ff', tone: 3 }, { label: '802.1Q-Tag', sub: 'VLAN 20', tone: 1 }], payload: 'Nutzdaten', hi: 1 },
        },
        {
          note: 'Switch 2 entfernt den Tag und verteilt den Rahmen nur an die Ports von VLAN 20. Der Vertrieb bekommt ihn nie zu sehen – als hingen die Abteilungen an völlig getrennten Switches.',
          topo: topo([
            { a: 's2', b: 'e2', label: 'an alle', vlan: 20 },
            { a: 's2', b: 'e3', label: 'an alle', vlan: 20 },
          ], ['e2', 'e3'], ['v1', 'v2']),
        },
        {
          note: 'Und wenn Vertrieb 1 mit Entwicklung 2 reden will? Auf Schicht 2 geht das gar nicht mehr – die VLANs sind getrennte Netze. Der Weg führt über einen **Router**, der beide VLANs kennt und Regeln durchsetzen kann (etwa: Entwicklung darf auf den Vertriebsserver, aber nicht umgekehrt).',
          topo: topo([], ['v1', 'e2']),
        },
      ],
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'broadcast',
      title: 'Wer bekommt den Broadcast?',
      prompt:
        'Ein Switch hat mehrere Ports, jeder gehört zu einem VLAN. Die erste Eingabezeile nennt die VLAN-Nummern der Ports 1, 2, 3 … der Reihe nach. Jede weitere Zeile ist ein Port, an dem ein **Broadcast** eintrifft.\n\nGib für jeden Broadcast die Ports aus, an die der Switch ihn weiterleitet – alle Ports desselben VLANs außer dem Eingangsport, aufsteigend, durch Leerzeichen getrennt. Gibt es keinen, gib `keiner` aus.',
      tests: [
        { name: 'Zwei VLANs', stdin: '10 10 20 20 10\n1\n3\n', expected: '2 5\n4\n' },
        { name: 'Allein im VLAN', stdin: '10 20 30\n2\n', expected: 'keiner\n' },
        { name: 'Ohne VLAN-Trennung', stdin: '1 1 1 1\n4\n', expected: '1 2 3\n' },
      ],
      hints: ['Merke dir das VLAN des Eingangsports und gehe dann alle Ports durch.', 'Die Ports sind ab 1 nummeriert, Arrays ab 0 – achte auf den Versatz.'],
      code: {
        python: raw`
import sys

zeilen = sys.stdin.read().split("\n")
vlans = list(map(int, zeilen[0].split()))
for zeile in zeilen[1:]:
    if not zeile.strip():
        continue
    eingang = int(zeile)
#:solution
    ziele = [str(p) for p in range(1, len(vlans) + 1) if p != eingang and vlans[p - 1] == vlans[eingang - 1]]
    print(" ".join(ziele) if ziele else "keiner")
#:starter
    ziele = [str(p) for p in range(1, len(vlans) + 1) if p != eingang]
    print(" ".join(ziele))
#:end
`,
        java: raw`
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String[] teile = in.nextLine().trim().split("\\s+");
        int[] vlans = new int[teile.length];
        for (int i = 0; i < teile.length; i++) {
            vlans[i] = Integer.parseInt(teile[i]);
        }
        while (in.hasNextInt()) {
            int eingang = in.nextInt();
            List<String> ziele = new ArrayList<>();
            for (int p = 1; p <= vlans.length; p++) {
//:solution
                if (p != eingang && vlans[p - 1] == vlans[eingang - 1]) {
//:starter
                if (p != eingang) {
//:end
                    ziele.add(String.valueOf(p));
                }
            }
            System.out.println(ziele.isEmpty() ? "keiner" : String.join(" ", ziele));
        }
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char zeile[1000];
    int vlans[64];
    int n = 0;
    fgets(zeile, sizeof zeile, stdin);
    for (char *t = strtok(zeile, " \n"); t; t = strtok(NULL, " \n")) {
        sscanf(t, "%d", &vlans[n++]);
    }
    int eingang;
    while (scanf("%d", &eingang) == 1) {
        int gefunden = 0;
        for (int p = 1; p <= n; p++) {
//:solution
            if (p != eingang && vlans[p - 1] == vlans[eingang - 1]) {
//:starter
            if (p != eingang) {
//:end
                printf("%s%d", gefunden ? " " : "", p);
                gefunden = 1;
            }
        }
        printf("%s\n", gefunden ? "" : "keiner");
    }
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int main() {
    std::string zeile;
    std::getline(std::cin, zeile);
    std::istringstream z(zeile);
    std::vector<int> vlans;
    for (int v; z >> v;) {
        vlans.push_back(v);
    }
    for (int eingang; std::cin >> eingang;) {
        bool gefunden = false;
        for (int p = 1; p <= static_cast<int>(vlans.size()); p++) {
//:solution
            if (p != eingang && vlans[p - 1] == vlans[eingang - 1]) {
//:starter
            if (p != eingang) {
//:end
                std::cout << (gefunden ? " " : "") << p;
                gefunden = true;
            }
        }
        std::cout << (gefunden ? "" : "keiner") << "\n";
    }
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut zeilen = eingabe.lines();
    let vlans: Vec<u32> = zeilen.next().unwrap().split_whitespace().map(|t| t.parse().unwrap()).collect();
    for zeile in zeilen {
        if zeile.trim().is_empty() {
            continue;
        }
        let eingang: usize = zeile.trim().parse().unwrap();
        let ziele: Vec<String> = (1..=vlans.len())
//:solution
            .filter(|&p| p != eingang && vlans[p - 1] == vlans[eingang - 1])
//:starter
            .filter(|&p| p != eingang)
//:end
            .map(|p| p.to_string())
            .collect();
        println!("{}", if ziele.is_empty() { "keiner".to_string() } else { ziele.join(" ") });
    }
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'warum-vlan',
      title: 'Wozu VLANs?',
      question: 'Welcher Grund spricht **nicht** für VLANs?',
      options: [
        'Sicherheit: Gäste-WLAN, Büro-PCs und Server-Verwaltung voneinander trennen.',
        'Weniger Broadcast-Verkehr, weil jeder Broadcast nur sein eigenes VLAN erreicht.',
        'Flexibilität: Wer umzieht, bleibt in seinem Netz – nur der Port wird umkonfiguriert, kein Kabel neu verlegt.',
        'Höhere Geschwindigkeit jedes einzelnen Kabels.',
      ],
      correct: 3,
      explain:
        'VLANs ändern nichts an der Leitungsgeschwindigkeit. Sie trennen Netze logisch: weniger unnötiger Verkehr, klare Sicherheitsgrenzen, flexible Zuordnung. In Firmen sind sie Standard – typische Aufteilungen sind Mitarbeiter, Gäste, Telefone, Drucker und Server.',
    },
  ],
};

export default lesson;
