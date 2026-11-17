import { raw } from '../../types.ts';
import type { LessonCode, SeqView, Step } from '../../types.ts';

const A = ['Browser', 'Server'];

const seq = (msgs: SeqView['msgs']): SeqView => ({ actors: A, msgs });

const lesson: LessonCode = {
  snippets: {
    udp: {
      python: raw`
import socket

empfaenger = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
empfaenger.bind(("127.0.0.1", 0))
adresse = empfaenger.getsockname()

sender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sender.sendto(b"Temperatur: 21.5", adresse)   # kein Verbindungsaufbau

daten, absender = empfaenger.recvfrom(1024)
print("Empfangen:", daten.decode())
`,
      java: raw`
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;

public class Main {
    public static void main(String[] args) throws Exception {
        try (DatagramSocket empfaenger = new DatagramSocket(0, InetAddress.getLoopbackAddress());
             DatagramSocket sender = new DatagramSocket()) {
            byte[] daten = "Temperatur: 21.5".getBytes(StandardCharsets.UTF_8);
            sender.send(new DatagramPacket(daten, daten.length, InetAddress.getLoopbackAddress(), empfaenger.getLocalPort()));

            DatagramPacket paket = new DatagramPacket(new byte[1024], 1024);
            empfaenger.receive(paket);
            System.out.println("Empfangen: " + new String(paket.getData(), 0, paket.getLength(), StandardCharsets.UTF_8));
        }
    }
}
`,
      c: raw`
#include <arpa/inet.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

int main(void) {
    int empfaenger = socket(AF_INET, SOCK_DGRAM, 0);
    struct sockaddr_in adresse = {0};
    adresse.sin_family = AF_INET;
    adresse.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    bind(empfaenger, (struct sockaddr *) &adresse, sizeof adresse);
    socklen_t laenge = sizeof adresse;
    getsockname(empfaenger, (struct sockaddr *) &adresse, &laenge);

    int sender = socket(AF_INET, SOCK_DGRAM, 0);
    const char *text = "Temperatur: 21.5";
    sendto(sender, text, strlen(text), 0, (struct sockaddr *) &adresse, sizeof adresse);

    char puffer[1024];
    ssize_t n = recvfrom(empfaenger, puffer, sizeof puffer - 1, 0, NULL, NULL);
    puffer[n > 0 ? n : 0] = '\0';
    printf("Empfangen: %s\n", puffer);
    close(sender);
    close(empfaenger);
    return 0;
}
`,
      cpp: raw`
#include <arpa/inet.h>
#include <iostream>
#include <string>
#include <sys/socket.h>
#include <unistd.h>

int main() {
    int empfaenger = socket(AF_INET, SOCK_DGRAM, 0);
    sockaddr_in adresse{};
    adresse.sin_family = AF_INET;
    adresse.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    bind(empfaenger, reinterpret_cast<sockaddr *>(&adresse), sizeof adresse);
    socklen_t laenge = sizeof adresse;
    getsockname(empfaenger, reinterpret_cast<sockaddr *>(&adresse), &laenge);

    int sender = socket(AF_INET, SOCK_DGRAM, 0);
    std::string text = "Temperatur: 21.5";
    sendto(sender, text.data(), text.size(), 0, reinterpret_cast<sockaddr *>(&adresse), sizeof adresse);

    char puffer[1024];
    ssize_t n = recvfrom(empfaenger, puffer, sizeof puffer, 0, nullptr, nullptr);
    std::cout << "Empfangen: " << std::string(puffer, n > 0 ? n : 0) << "\n";
    close(sender);
    close(empfaenger);
    return 0;
}
`,
      rust: raw`
use std::net::UdpSocket;

fn main() {
    let empfaenger = UdpSocket::bind("127.0.0.1:0").unwrap();
    let adresse = empfaenger.local_addr().unwrap();

    let sender = UdpSocket::bind("127.0.0.1:0").unwrap();
    sender.send_to(b"Temperatur: 21.5", adresse).unwrap();   // kein Verbindungsaufbau

    let mut puffer = [0u8; 1024];
    let (n, _absender) = empfaenger.recv_from(&mut puffer).unwrap();
    println!("Empfangen: {}", String::from_utf8_lossy(&puffer[..n]));
}
`,
    },
  },

  scenes: {
    tcp: {
      title: 'TCP: Verbindung, Bestätigung, Wiederholung',
      build: (): Step[] => {
        const all: SeqView['msgs'] = [
          { from: 0, to: 1, label: 'SYN', sub: 'Nr. 1000 – Verbindung?' },
          { from: 1, to: 0, label: 'SYN-ACK', sub: 'Nr. 5000, bestätige 1001' },
          { from: 0, to: 1, label: 'ACK', sub: 'bestätige 5001' },
          { from: 0, to: 1, label: 'Daten 1001–1100', tone: 0 },
          { from: 0, to: 1, label: 'Daten 1101–1200', tone: 0, lost: true },
          { from: 1, to: 0, label: 'ACK 1101', sub: '„bis 1100 alles da"' },
          { from: 0, to: 1, label: 'Daten 1101–1200', sub: 'Wiederholung', tone: 0 },
          { from: 1, to: 0, label: 'ACK 1201' },
          { from: 0, to: 1, label: 'FIN', sub: 'Ich bin fertig' },
          { from: 1, to: 0, label: 'FIN-ACK' },
        ];
        const notes = [
          '**Drei-Wege-Handschlag**, Schritt 1: Der Browser schlägt eine Verbindung vor (SYN = *synchronize*) und nennt eine zufällige Startnummer.',
          'Der Server stimmt zu, bestätigt die Nummer des Browsers (+1) und nennt seine eigene Startnummer.',
          'Der Browser bestätigt. Die Verbindung steht – das hat eine volle Hin- und Rückreise gekostet, bevor das erste Nutzbyte unterwegs ist.',
          'Jetzt fließen Daten. Jedes Byte hat eine Nummer, damit der Empfänger Reihenfolge und Lücken erkennen kann.',
          'Dieses Segment geht unterwegs verloren – ein überlasteter Router hat es verworfen. Für IP ist das völlig normal.',
          'Der Server bestätigt immer **bis zur ersten Lücke**: „Ich habe alles bis 1100, schick mir 1101." Kommt diese Bestätigung mehrfach oder bleibt die Bestätigung für 1200 aus, weiß der Browser, dass etwas fehlt.',
          'Der Browser schickt das fehlende Stück erneut. Die Anwendung auf der anderen Seite merkt davon nichts – sie bekommt einen lückenlosen, geordneten Datenstrom.',
          'Alles angekommen.',
          'Der Browser will die Verbindung schließen.',
          'Der Server bestätigt. Für jede Verbindung führen beide Seiten Buch: Nummern, Puffer, Zeitgeber. Diese Verlässlichkeit hat ihren Preis an Zeit und Aufwand.',
        ];
        return all.map((_, i) => ({ note: notes[i], seq: seq(all.slice(0, i + 1)) }));
      },
    },
    udp: {
      title: 'UDP: einfach losschicken',
      build: (): Step[] => {
        const actors = ['Spiel (du)', 'Spielserver'];
        const all: SeqView['msgs'] = [
          { from: 0, to: 1, label: 'Position x=10', tone: 1 },
          { from: 0, to: 1, label: 'Position x=11', tone: 1, lost: true },
          { from: 0, to: 1, label: 'Position x=12', tone: 1 },
          { from: 1, to: 0, label: 'Spielstand', tone: 2 },
        ];
        const notes = [
          'Kein Handschlag: Das erste Datagramm geht sofort los. Jedes UDP-Datagramm steht für sich, mit Absender- und Zielport, Länge und Prüfsumme – das ist alles.',
          'Ein Datagramm geht verloren. UDP merkt das nicht und wiederholt nichts.',
          'Bei einem Online-Spiel ist das genau richtig: Die alte Position wäre beim Wiederholen schon veraltet. Lieber gleich die neue schicken.',
          'UDP ist schnell und schlank. Was an Verlässlichkeit gebraucht wird, baut die Anwendung selbst – oder benutzt ein Protokoll darüber, wie QUIC, das HTTP/3 antreibt.',
        ];
        return all.map((_, i) => ({ note: notes[i], seq: { actors, msgs: all.slice(0, i + 1) } }));
      },
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'zusammensetzen',
      title: 'Segmente wieder zusammensetzen',
      prompt:
        'Wie der Empfänger bei TCP: Das Programm bekommt Segmente in beliebiger Reihenfolge, jedes als Zeile `<Position> <Text>`. Die Position ist die Nummer des ersten Zeichens im Gesamttext (ab 0). Manche Segmente kommen **doppelt** an.\n\nGib den vollständigen Text aus.',
      tests: [
        { name: 'Durcheinander', stdin: '5 netz\n0 hallo\n9 werk\n', expected: 'hallonetzwerk\n' },
        { name: 'Mit Duplikat', stdin: '0 hallo\n5 welt\n0 hallo\n', expected: 'hallowelt\n' },
        { name: 'Schon geordnet', stdin: '0 a\n1 b\n2 c\n', expected: 'abc\n' },
      ],
      hints: [
        'Sortiere die Segmente nach ihrer Position. Duplikate erkennst du daran, dass ihre Position schon vorkam.',
        'Eine Map von Position auf Text erledigt beides: Doppelte überschreiben sich, und am Ende gibst du die Einträge nach aufsteigender Position aus.',
      ],
      code: {
        python: raw`
import sys

segmente = []
for zeile in sys.stdin:
    if zeile.strip():
        pos, text = zeile.split()
        segmente.append((int(pos), text))

#:solution
eindeutig = dict(segmente)
print("".join(eindeutig[p] for p in sorted(eindeutig)))
#:starter
print("".join(text for pos, text in segmente))
#:end
`,
        java: raw`
import java.util.Map;
import java.util.Scanner;
import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        StringBuilder ergebnis = new StringBuilder();
//:solution
        Map<Integer, String> segmente = new TreeMap<>();   // TreeMap hält die Schlüssel sortiert
        while (in.hasNextInt()) {
            segmente.put(in.nextInt(), in.next());
        }
        for (String text : segmente.values()) {
            ergebnis.append(text);
        }
//:starter
        while (in.hasNextInt()) {
            in.nextInt();
            ergebnis.append(in.next());
        }
//:end
        System.out.println(ergebnis);
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    int positionen[100];
    char texte[100][64];
    int n = 0;
    while (n < 100 && scanf("%d %63s", &positionen[n], texte[n]) == 2) {
        n++;
    }

//:solution
    // Einfaches Einfügesortieren nach Position
    for (int i = 1; i < n; i++) {
        for (int j = i; j > 0 && positionen[j - 1] > positionen[j]; j--) {
            int p = positionen[j];
            positionen[j] = positionen[j - 1];
            positionen[j - 1] = p;
            char t[64];
            strcpy(t, texte[j]);
            strcpy(texte[j], texte[j - 1]);
            strcpy(texte[j - 1], t);
        }
    }
    for (int i = 0; i < n; i++) {
        if (i > 0 && positionen[i] == positionen[i - 1]) {
            continue;   // Duplikat
        }
        printf("%s", texte[i]);
    }
//:starter
    for (int i = 0; i < n; i++) {
        printf("%s", texte[i]);
    }
//:end
    printf("\n");
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <map>
#include <string>

int main() {
    std::string ergebnis;
    int pos;
    std::string text;
//:solution
    std::map<int, std::string> segmente;   // std::map hält die Schlüssel sortiert
    while (std::cin >> pos >> text) {
        segmente[pos] = text;
    }
    for (const auto &[p, t] : segmente) {
        ergebnis += t;
    }
//:starter
    while (std::cin >> pos >> text) {
        ergebnis += text;
    }
//:end
    std::cout << ergebnis << "\n";
    return 0;
}
`,
        rust: raw`
use std::collections::BTreeMap;
use std::io::{self, Read};

fn main() {
    let mut eingabe = String::new();
    io::stdin().read_to_string(&mut eingabe).unwrap();
    let segmente: Vec<(u32, &str)> = eingabe
        .lines()
        .filter(|z| !z.trim().is_empty())
        .map(|z| {
            let (pos, text) = z.split_once(' ').unwrap();
            (pos.parse().unwrap(), text.trim())
        })
        .collect();

//:solution
    let geordnet: BTreeMap<u32, &str> = segmente.into_iter().collect();   // sortiert, ohne Duplikate
    let ergebnis: String = geordnet.values().copied().collect();
//:starter
    let ergebnis: String = segmente.iter().map(|(_, t)| *t).collect();
    let _ = BTreeMap::<u32, &str>::new();
//:end
    println!("{}", ergebnis);
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'welches',
      title: 'TCP oder UDP?',
      question: 'Für welche Anwendung passt UDP besser als TCP?',
      options: ['Eine Datei herunterladen', 'Eine E-Mail verschicken', 'Ein Videotelefonat', 'Eine Webseite laden'],
      correct: 2,
      explain:
        'Bei einem Videotelefonat zählt jede Millisekunde. Ein verlorenes Bild nachzuliefern wäre sinnlos – es wäre längst veraltet, und das Warten darauf würde alle folgenden Bilder aufhalten. Dateien, E-Mails und Webseiten müssen dagegen vollständig und fehlerfrei ankommen; dafür nimmt man die kleine Verzögerung von TCP gern in Kauf.',
    },
  ],
};

export default lesson;
