import { raw } from '../../types.ts';
import type { LessonCode, Step, TableView, TopoView } from '../../types.ts';

const topo = (packet?: { a: string; b: string; label: string; t?: number }, hi: string[] = []): TopoView => ({
  height: 260,
  nodes: [
    { id: 'pc', label: 'Laptop', sub: '192.168.1.20/24', kind: 'pc', x: 70, y: 70, hi: hi.includes('pc') },
    { id: 'sw', label: 'Switch', sub: 'Heimnetz', kind: 'switch', x: 230, y: 70 },
    { id: 'drucker', label: 'Drucker', sub: '192.168.1.50', kind: 'device', x: 230, y: 200, hi: hi.includes('drucker') },
    { id: 'r1', label: 'Router', sub: '192.168.1.1', kind: 'router', x: 400, y: 70, hi: hi.includes('r1') },
    { id: 'isp', label: 'Provider', sub: 'viele Router', kind: 'cloud', x: 560, y: 70, hi: hi.includes('isp') },
    { id: 'srv', label: 'Server', sub: '93.184.215.14', kind: 'server', x: 560, y: 200, hi: hi.includes('srv') },
  ],
  links: [
    { a: 'pc', b: 'sw' },
    { a: 'sw', b: 'drucker' },
    { a: 'sw', b: 'r1' },
    { a: 'r1', b: 'isp' },
    { a: 'isp', b: 'srv' },
  ],
  packets: packet ? [{ ...packet, t: packet.t ?? 0.55 }] : [],
});

const arp = (rows: string[][], hi?: number): TableView => ({ name: 'ARP-Tabelle des Laptops', columns: ['IP-Adresse', 'MAC-Adresse'], rows, hi: hi === undefined ? [] : [hi] });
const routen: TableView = {
  name: 'Routing-Tabelle des Routers',
  columns: ['Ziel', 'über', 'Schnittstelle'],
  rows: [
    ['192.168.1.0/24', 'direkt', 'LAN'],
    ['0.0.0.0/0', 'Provider', 'Internet'],
  ],
};

const lesson: LessonCode = {
  scenes: {
    weg: {
      title: 'Ein Paket verlässt das Heimnetz',
      build: (): Step[] => [
        {
          note: 'Der Laptop will ein Paket an `93.184.215.14` schicken. Erste Frage: Liegt das Ziel in meinem Netz? 93.184.215.14 UND 255.255.255.0 = 93.184.215.0 ≠ 192.168.1.0. **Nein** – also geht das Paket an das Standard-Gateway, den Router.',
          topo: topo(undefined, ['pc']),
          tables: [arp([])],
        },
        {
          note: 'Für den Ethernet-Rahmen braucht der Laptop aber die **MAC-Adresse** des Routers. Er kennt nur dessen IP. Also fragt er per **ARP**-Broadcast ins lokale Netz: „Wer hat 192.168.1.1? Sag es 192.168.1.20."',
          topo: topo({ a: 'pc', b: 'sw', label: 'ARP: Wer hat .1?' }, ['pc']),
          tables: [arp([])],
        },
        {
          note: 'Nur der Router antwortet: „192.168.1.1 hat die MAC 3c:22:fb:…". Der Laptop speichert das in seiner ARP-Tabelle, damit er nicht jedes Mal fragen muss.',
          topo: topo({ a: 'r1', b: 'sw', label: 'ARP: Das bin ich' }, ['r1']),
          tables: [arp([['192.168.1.1', '3c:22:fb:…']], 0)],
        },
        {
          note: 'Jetzt geht das Paket los: **IP-Ziel** ist der Server, aber das **Ethernet-Ziel** ist der Router. Die IP-Adressen bleiben auf dem ganzen Weg gleich, die MAC-Adressen wechseln bei jedem Teilstück.',
          topo: topo({ a: 'sw', b: 'r1', label: 'IP an .14, MAC an Router' }),
          tables: [arp([['192.168.1.1', '3c:22:fb:…']])],
        },
        {
          note: 'Der Router schaut in seine **Routing-Tabelle**. Für das Heimnetz ist er selbst zuständig, für alles andere gilt die **Standardroute** `0.0.0.0/0`: ab zum Provider. Dabei zieht er die **TTL** im IP-Kopf um eins herunter – erreicht sie 0, wird das Paket verworfen. So können Pakete nicht ewig im Kreis laufen.',
          topo: topo({ a: 'r1', b: 'isp', label: 'weiter' }, ['r1']),
          tables: [{ ...routen, hi: [1] }],
        },
        {
          note: 'Im Internet wiederholt sich das bei jedem Router: Tabelle befragen, nächsten Router wählen, neuen Rahmen bauen. Typisch sind 10 bis 20 solcher Etappen (*Hops*). Mit `traceroute` kannst du sie sichtbar machen.',
          topo: topo({ a: 'isp', b: 'srv', label: 'angekommen' }, ['srv']),
          tables: [routen],
        },
      ],
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'praefix',
      title: 'Die längste Übereinstimmung',
      prompt:
        'Ein Router muss für jede Zieladresse den passenden Eintrag seiner Routing-Tabelle finden. Passen mehrere, gewinnt der **spezifischste** – der mit der **längsten Präfixlänge** (*longest prefix match*).\n\nDie erste Zeile nennt die Zahl der Routen, dann folgt je Zeile `Netz/Präfix Ziel`. Danach kommen Zieladressen, für die jeweils das Ziel der gewählten Route ausgegeben werden soll. Der Startcode nimmt einfach die **erste** passende Route.',
      tests: [
        {
          name: 'Spezifisch vor allgemein',
          stdin: '3\n10.0.0.0/8 RouterA\n10.1.0.0/16 RouterB\n0.0.0.0/0 Internet\n10.1.2.3\n10.200.0.1\n8.8.8.8\n',
          expected: 'RouterB\nRouterA\nInternet\n',
        },
        {
          name: 'Reihenfolge egal',
          stdin: '3\n0.0.0.0/0 Internet\n192.168.0.0/16 Firma\n192.168.5.0/24 Labor\n192.168.5.9\n192.168.6.1\n',
          expected: 'Labor\nFirma\n',
        },
      ],
      hints: [
        'Eine Route passt, wenn Zieladresse UND Maske gleich der Netzadresse ist. Achtung: Bei Präfix 0 ist die Maske 0 – in C, C++, Java und Rust darf man nicht um 32 Stellen schieben, behandle das als Sonderfall.',
        'Gehe alle Routen durch und merke dir unter den passenden die mit der größten Präfixlänge.',
      ],
      code: {
        python: raw`
import sys

def zahl(ip):
    a, b, c, d = map(int, ip.split("."))
    return (a << 24) | (b << 16) | (c << 8) | d

def maske(prefix):
    return 0 if prefix == 0 else (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF

zeilen = sys.stdin.read().split("\n")
anzahl = int(zeilen[0])
routen = []
for zeile in zeilen[1:anzahl + 1]:
    netz, ziel = zeile.split()
    adresse, prefix = netz.split("/")
    routen.append((zahl(adresse), int(prefix), ziel))

for zeile in zeilen[anzahl + 1:]:
    if not zeile.strip():
        continue
    ip = zahl(zeile.strip())
#:solution
    beste = None
    for netz, prefix, ziel in routen:
        if ip & maske(prefix) == netz and (beste is None or prefix > beste[0]):
            beste = (prefix, ziel)
    print(beste[1])
#:starter
    for netz, prefix, ziel in routen:
        if ip & maske(prefix) == netz:
            print(ziel)
            break
#:end
`,
        java: raw`
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class Main {
    record Route(long netz, int prefix, String ziel) {}

    static long zahl(String ip) {
        long z = 0;
        for (String teil : ip.split("\\.")) {
            z = (z << 8) | Long.parseLong(teil);
        }
        return z;
    }

    static long maske(int prefix) {
        return prefix == 0 ? 0 : (0xFFFFFFFFL << (32 - prefix)) & 0xFFFFFFFFL;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int anzahl = in.nextInt();
        List<Route> routen = new ArrayList<>();
        for (int i = 0; i < anzahl; i++) {
            String[] netz = in.next().split("/");
            routen.add(new Route(zahl(netz[0]), Integer.parseInt(netz[1]), in.next()));
        }
        while (in.hasNext()) {
            long ip = zahl(in.next());
//:solution
            Route beste = null;
            for (Route r : routen) {
                if ((ip & maske(r.prefix())) == r.netz() && (beste == null || r.prefix() > beste.prefix())) {
                    beste = r;
                }
            }
            System.out.println(beste.ziel());
//:starter
            for (Route r : routen) {
                if ((ip & maske(r.prefix())) == r.netz()) {
                    System.out.println(r.ziel());
                    break;
                }
            }
//:end
        }
    }
}
`,
        c: raw`
#include <stdint.h>
#include <stdio.h>

uint32_t zahl(const char *ip) {
    unsigned a, b, c, d;
    sscanf(ip, "%u.%u.%u.%u", &a, &b, &c, &d);
    return (a << 24) | (b << 16) | (c << 8) | d;
}

uint32_t maske(int prefix) {
    return prefix == 0 ? 0 : 0xFFFFFFFFu << (32 - prefix);
}

int main(void) {
    int anzahl;
    scanf("%d", &anzahl);
    uint32_t netze[50];
    int praefixe[50];
    char ziele[50][32];
    for (int i = 0; i < anzahl; i++) {
        char adresse[32];
        scanf(" %31[^/]/%d %31s", adresse, &praefixe[i], ziele[i]);
        netze[i] = zahl(adresse);
    }
    char text[32];
    while (scanf("%31s", text) == 1) {
        uint32_t ip = zahl(text);
//:solution
        int beste = -1;
        for (int i = 0; i < anzahl; i++) {
            if ((ip & maske(praefixe[i])) == netze[i] && (beste == -1 || praefixe[i] > praefixe[beste])) {
                beste = i;
            }
        }
        printf("%s\n", ziele[beste]);
//:starter
        for (int i = 0; i < anzahl; i++) {
            if ((ip & maske(praefixe[i])) == netze[i]) {
                printf("%s\n", ziele[i]);
                break;
            }
        }
//:end
    }
    return 0;
}
`,
        cpp: raw`
#include <cstdint>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

struct Route {
    std::uint32_t netz;
    int prefix;
    std::string ziel;
};

std::uint32_t zahl(const std::string &ip) {
    std::istringstream s(ip);
    std::uint32_t z = 0;
    std::string teil;
    while (std::getline(s, teil, '.')) {
        z = (z << 8) | static_cast<std::uint32_t>(std::stoi(teil));
    }
    return z;
}

std::uint32_t maske(int prefix) {
    return prefix == 0 ? 0 : 0xFFFFFFFFu << (32 - prefix);
}

int main() {
    int anzahl;
    std::cin >> anzahl;
    std::vector<Route> routen;
    for (int i = 0; i < anzahl; i++) {
        std::string netz, ziel;
        std::cin >> netz >> ziel;
        auto schraeg = netz.find('/');
        routen.push_back({zahl(netz.substr(0, schraeg)), std::stoi(netz.substr(schraeg + 1)), ziel});
    }
    for (std::string text; std::cin >> text;) {
        std::uint32_t ip = zahl(text);
//:solution
        const Route *beste = nullptr;
        for (const auto &r : routen) {
            if ((ip & maske(r.prefix)) == r.netz && (beste == nullptr || r.prefix > beste->prefix)) {
                beste = &r;
            }
        }
        std::cout << beste->ziel << "\n";
//:starter
        for (const auto &r : routen) {
            if ((ip & maske(r.prefix)) == r.netz) {
                std::cout << r.ziel << "\n";
                break;
            }
        }
//:end
    }
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn zahl(ip: &str) -> u32 {
    ip.split('.').fold(0, |z, teil| (z << 8) | teil.parse::<u32>().unwrap())
}

fn maske(prefix: u32) -> u32 {
    if prefix == 0 { 0 } else { u32::MAX << (32 - prefix) }
}

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let mut zeilen = eingabe.lines();
    let anzahl: usize = zeilen.next().unwrap().trim().parse().unwrap();
    let mut routen: Vec<(u32, u32, String)> = Vec::new();
    for _ in 0..anzahl {
        let zeile = zeilen.next().unwrap();
        let mut teile = zeile.split_whitespace();
        let netz = teile.next().unwrap();
        let ziel = teile.next().unwrap().to_string();
        let (adresse, prefix) = netz.split_once('/').unwrap();
        routen.push((zahl(adresse), prefix.parse().unwrap(), ziel));
    }
    for zeile in zeilen {
        if zeile.trim().is_empty() {
            continue;
        }
        let ip = zahl(zeile.trim());
//:solution
        let beste = routen
            .iter()
            .filter(|(netz, prefix, _)| ip & maske(*prefix) == *netz)
            .max_by_key(|(_, prefix, _)| *prefix)
            .unwrap();
        println!("{}", beste.2);
//:starter
        let erste = routen.iter().find(|(netz, prefix, _)| ip & maske(*prefix) == *netz).unwrap();
        println!("{}", erste.2);
//:end
    }
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'switch-router',
      title: 'Switch oder Router?',
      question: 'Ein Paket geht vom Laptop zu einem Drucker im **selben** Heimnetz. Ist der Router daran beteiligt?',
      options: [
        'Ja, jedes Paket läuft über den Router.',
        'Nein. Das Ziel liegt im eigenen Subnetz, der Laptop holt sich per ARP die MAC-Adresse des Druckers und schickt den Rahmen direkt – nur der Switch leitet ihn weiter.',
        'Nur bei großen Dateien.',
        'Nur, wenn der Drucker ausgeschaltet ist.',
      ],
      correct: 1,
      explain:
        'Router sind nur für den Weg **zwischen** Netzen zuständig. Innerhalb eines Subnetzes reicht Schicht 2. Viele Heimrouter enthalten allerdings einen eingebauten Switch – physisch kann der Rahmen also durch dasselbe Gerät laufen, logisch übernimmt dann aber dessen Switch-Teil die Arbeit.',
    },
  ],
};

export default lesson;
