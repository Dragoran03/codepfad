import { raw } from '../../types.ts';
import type { LessonCode, SeqView, Step } from '../../types.ts';

const lesson: LessonCode = {
  snippets: {
    aufloesen: {
      python: raw`
import socket

print("localhost →", socket.gethostbyname("localhost"))
`,
      java: raw`
import java.net.Inet4Address;
import java.net.InetAddress;

public class Main {
    public static void main(String[] args) throws Exception {
        for (InetAddress a : InetAddress.getAllByName("localhost")) {
            if (a instanceof Inet4Address) {
                System.out.println("localhost → " + a.getHostAddress());
            }
        }
    }
}
`,
      c: raw`
#include <arpa/inet.h>
#include <netdb.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    struct addrinfo wunsch, *ergebnis;
    memset(&wunsch, 0, sizeof wunsch);
    wunsch.ai_family = AF_INET;          // nur IPv4
    wunsch.ai_socktype = SOCK_STREAM;
    if (getaddrinfo("localhost", NULL, &wunsch, &ergebnis) != 0) {
        printf("Name nicht gefunden\n");
        return 1;
    }
    char text[INET_ADDRSTRLEN];
    struct sockaddr_in *adresse = (struct sockaddr_in *) ergebnis->ai_addr;
    inet_ntop(AF_INET, &adresse->sin_addr, text, sizeof text);
    printf("localhost → %s\n", text);
    freeaddrinfo(ergebnis);
    return 0;
}
`,
      cpp: raw`
#include <arpa/inet.h>
#include <iostream>
#include <netdb.h>

int main() {
    addrinfo wunsch{};
    wunsch.ai_family = AF_INET;          // nur IPv4
    wunsch.ai_socktype = SOCK_STREAM;
    addrinfo *ergebnis = nullptr;
    if (getaddrinfo("localhost", nullptr, &wunsch, &ergebnis) != 0) {
        std::cout << "Name nicht gefunden\n";
        return 1;
    }
    char text[INET_ADDRSTRLEN];
    auto *adresse = reinterpret_cast<sockaddr_in *>(ergebnis->ai_addr);
    inet_ntop(AF_INET, &adresse->sin_addr, text, sizeof text);
    std::cout << "localhost → " << text << "\n";
    freeaddrinfo(ergebnis);
    return 0;
}
`,
      rust: raw`
use std::net::ToSocketAddrs;

fn main() {
    for adresse in ("localhost", 0).to_socket_addrs().unwrap() {
        if adresse.is_ipv4() {
            println!("localhost → {}", adresse.ip());
            break;
        }
    }
}
`,
    },
  },

  scenes: {
    aufloesung: {
      title: 'Wer kennt www.example.org?',
      build: (): Step[] => {
        const actors = ['Laptop', 'Resolver', 'Root', '.org', 'example.org'];
        const all: SeqView['msgs'] = [
          { from: 0, to: 1, label: 'www.example.org?', tone: 0 },
          { from: 1, to: 2, label: 'www.example.org?' },
          { from: 2, to: 1, label: 'frag .org', sub: 'Server für .org: …' },
          { from: 1, to: 3, label: 'www.example.org?' },
          { from: 3, to: 1, label: 'frag example.org', sub: 'Server: ns1.example.org' },
          { from: 1, to: 4, label: 'www.example.org?' },
          { from: 4, to: 1, label: '93.184.215.14', sub: 'gültig für 1 Stunde', tone: 2 },
          { from: 1, to: 0, label: '93.184.215.14', tone: 2 },
        ];
        const notes = [
          'Der Laptop fragt seinen **Resolver** – meist der Router oder ein Server des Providers. Er selbst macht sich die Mühe nicht.',
          'Der Resolver kennt die Antwort noch nicht und beginnt ganz oben: bei einem der 13 logischen **Root-Server** (dahinter stehen über 1.500 Server weltweit).',
          'Der Root-Server kennt `www.example.org` nicht – aber er weiß, wer für die Endung `.org` zuständig ist.',
          'Also fragt der Resolver dort.',
          'Auch der `.org`-Server kennt die Adresse nicht, verweist aber an die Namensserver der Domain `example.org`.',
          'Endlich der **autoritative** Server: Er ist für diese Domain zuständig und kennt die Antwort sicher.',
          'Die Antwort kommt mit einer **TTL** (*time to live*): So lange darf sie zwischengespeichert werden.',
          'Der Resolver gibt die Adresse an den Laptop weiter und merkt sie sich. Fragt in der nächsten Stunde jemand dasselbe, antwortet er sofort aus seinem **Cache**. Darum dauern die meisten DNS-Anfragen nur Millisekunden.',
        ];
        return all.map((_, i) => ({ note: notes[i], seq: { actors, msgs: all.slice(0, i + 1) } }));
      },
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'hierarchie',
      title: 'Von oben nach unten',
      prompt:
        'Ein Resolver fragt sich von der Wurzel nach unten durch. Schreibe ein Programm, das für einen Domainnamen die Zonen in dieser Reihenfolge ausgibt – jede mit abschließendem Punkt, beginnend mit der Wurzel `.`.\n\nAus `www.example.org` wird:\n`.`\n`org.`\n`example.org.`\n`www.example.org.`',
      tests: [
        { name: 'www.example.org', stdin: 'www.example.org\n', expected: '.\norg.\nexample.org.\nwww.example.org.\n' },
        { name: 'de', stdin: 'de\n', expected: '.\nde.\n' },
        { name: 'mail.uni-koeln.de', stdin: 'mail.uni-koeln.de\n', expected: '.\nde.\nuni-koeln.de.\nmail.uni-koeln.de.\n' },
      ],
      hints: [
        'Zerlege den Namen an den Punkten. Die Teile von **hinten** nach vorn bilden die Zonen.',
        'Baue den Namen schrittweise auf: Jede Zeile setzt das nächste Teil vor die vorige Zone.',
      ],
      code: {
        python: raw`
name = input().strip()
teile = name.split(".")

print(".")
#:solution
zone = ""
for teil in reversed(teile):
    zone = teil + "." + zone
    print(zone)
#:starter
print(name + ".")
#:end
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        String name = new Scanner(System.in).nextLine().trim();
        String[] teile = name.split("\\.");

        System.out.println(".");
//:solution
        String zone = "";
        for (int i = teile.length - 1; i >= 0; i--) {
            zone = teile[i] + "." + zone;
            System.out.println(zone);
        }
//:starter
        System.out.println(name + ".");
//:end
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char name[256];
    scanf("%255s", name);
    int laenge = strlen(name);

    printf(".\n");
//:solution
    // Von hinten nach vorn: Eine Zone beginnt am Anfang oder direkt hinter einem Punkt.
    for (int i = laenge - 1; i >= 0; i--) {
        if (i == 0 || name[i - 1] == '.') {
            printf("%s.\n", name + i);
        }
    }
//:starter
    (void)laenge;
    printf("%s.\n", name);
//:end
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int main() {
    std::string name;
    std::cin >> name;
    std::vector<std::string> teile;
    std::istringstream s(name);
    for (std::string teil; std::getline(s, teil, '.');) {
        teile.push_back(teil);
    }

    std::cout << ".\n";
//:solution
    std::string zone;
    for (auto it = teile.rbegin(); it != teile.rend(); ++it) {
        zone = *it + "." + zone;
        std::cout << zone << "\n";
    }
//:starter
    std::cout << name << ".\n";
//:end
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut name = String::new();
    io::stdin().read_line(&mut name).unwrap();
    let name = name.trim();
    let teile: Vec<&str> = name.split('.').collect();

    println!(".");
//:solution
    let mut zone = String::new();
    for teil in teile.iter().rev() {
        zone = format!("{}.{}", teil, zone);
        println!("{}", zone);
    }
//:starter
    let _ = &teile;
    println!("{}.", name);
//:end
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'udp-dns',
      title: 'Warum UDP?',
      question: 'DNS-Anfragen laufen normalerweise über UDP statt über TCP. Warum?',
      options: [
        'Weil DNS verschlüsselt ist.',
        'Weil Anfrage und Antwort meist in je ein einziges kleines Paket passen. Der Verbindungsaufbau von TCP würde die Zeit mindestens verdoppeln – und geht eine Anfrage verloren, fragt man einfach noch einmal.',
        'Weil TCP keine Namen übertragen kann.',
        'Weil Root-Server kein TCP kennen.',
      ],
      correct: 1,
      explain:
        'DNS ist das Paradebeispiel für UDP: kurze Frage, kurze Antwort, Wiederholung bei Bedarf. Für große Antworten weicht DNS auf TCP aus. Und weil klassisches DNS unverschlüsselt ist (jeder auf dem Weg sieht, welche Seiten du aufrufst), gibt es heute auch DNS über HTTPS oder TLS.',
    },
  ],
};

export default lesson;
