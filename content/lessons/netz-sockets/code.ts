import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  snippets: {
    echo: {
      python: raw`
import socket
import threading

# --- Server: wartet auf einem freien Port auf eine Verbindung ---
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(("127.0.0.1", 0))      # Port 0: das Betriebssystem wählt einen freien
server.listen()
port = server.getsockname()[1]

def bediene():
    verbindung, _ = server.accept()          # wartet, bis jemand anruft
    daten = verbindung.recv(1024)
    verbindung.sendall(daten.upper())        # Antwort: alles in Großbuchstaben
    verbindung.close()

faden = threading.Thread(target=bediene)
faden.start()

# --- Client: verbindet sich, schickt etwas, liest die Antwort ---
client = socket.create_connection(("127.0.0.1", port))
client.sendall("hallo netzwerk".encode())
print("Antwort:", client.recv(1024).decode())
client.close()
faden.join()
server.close()
`,
      java: raw`
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

public class Main {
    public static void main(String[] args) throws Exception {
        // --- Server: wartet auf einem freien Port auf eine Verbindung ---
        ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress());
        Thread faden = new Thread(() -> {
            try (Socket verbindung = server.accept()) {           // wartet, bis jemand anruft
                byte[] puffer = new byte[1024];
                int n = verbindung.getInputStream().read(puffer);
                String text = new String(puffer, 0, n, StandardCharsets.UTF_8);
                verbindung.getOutputStream().write(text.toUpperCase().getBytes(StandardCharsets.UTF_8));
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
        faden.start();

        // --- Client: verbindet sich, schickt etwas, liest die Antwort ---
        try (Socket client = new Socket(InetAddress.getLoopbackAddress(), server.getLocalPort())) {
            OutputStream raus = client.getOutputStream();
            InputStream rein = client.getInputStream();
            raus.write("hallo netzwerk".getBytes(StandardCharsets.UTF_8));
            byte[] puffer = new byte[1024];
            int n = rein.read(puffer);
            System.out.println("Antwort: " + new String(puffer, 0, n, StandardCharsets.UTF_8));
        }
        faden.join();
        server.close();
    }
}
`,
      c: raw`
#include <arpa/inet.h>
#include <ctype.h>
#include <pthread.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

static int server;

static void *bediene(void *arg) {
    (void) arg;
    int verbindung = accept(server, NULL, NULL);       // wartet, bis jemand anruft
    char puffer[1024];
    ssize_t n = recv(verbindung, puffer, sizeof puffer, 0);
    for (ssize_t i = 0; i < n; i++) {
        puffer[i] = toupper((unsigned char) puffer[i]);
    }
    send(verbindung, puffer, n, 0);                    // Antwort: alles in Großbuchstaben
    close(verbindung);
    return NULL;
}

int main(void) {
    // --- Server: wartet auf einem freien Port auf eine Verbindung ---
    server = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in adresse = {0};
    adresse.sin_family = AF_INET;
    adresse.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    adresse.sin_port = 0;                              // Port 0: das System wählt einen freien
    bind(server, (struct sockaddr *) &adresse, sizeof adresse);
    listen(server, 1);
    socklen_t laenge = sizeof adresse;
    getsockname(server, (struct sockaddr *) &adresse, &laenge);

    pthread_t faden;
    pthread_create(&faden, NULL, bediene, NULL);

    // --- Client: verbindet sich, schickt etwas, liest die Antwort ---
    int client = socket(AF_INET, SOCK_STREAM, 0);
    connect(client, (struct sockaddr *) &adresse, sizeof adresse);
    const char *text = "hallo netzwerk";
    send(client, text, strlen(text), 0);
    char antwort[1024];
    ssize_t n = recv(client, antwort, sizeof antwort - 1, 0);
    antwort[n > 0 ? n : 0] = '\0';
    printf("Antwort: %s\n", antwort);

    close(client);
    pthread_join(faden, NULL);
    close(server);
    return 0;
}
`,
      cpp: raw`
#include <arpa/inet.h>
#include <cctype>
#include <iostream>
#include <string>
#include <sys/socket.h>
#include <thread>
#include <unistd.h>

int main() {
    // --- Server: wartet auf einem freien Port auf eine Verbindung ---
    int server = socket(AF_INET, SOCK_STREAM, 0);
    sockaddr_in adresse{};
    adresse.sin_family = AF_INET;
    adresse.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    adresse.sin_port = 0;                              // Port 0: das System wählt einen freien
    bind(server, reinterpret_cast<sockaddr *>(&adresse), sizeof adresse);
    listen(server, 1);
    socklen_t laenge = sizeof adresse;
    getsockname(server, reinterpret_cast<sockaddr *>(&adresse), &laenge);

    std::thread faden([server] {
        int verbindung = accept(server, nullptr, nullptr);   // wartet, bis jemand anruft
        char puffer[1024];
        ssize_t n = recv(verbindung, puffer, sizeof puffer, 0);
        for (ssize_t i = 0; i < n; i++) {
            puffer[i] = static_cast<char>(std::toupper(static_cast<unsigned char>(puffer[i])));
        }
        send(verbindung, puffer, n, 0);                      // Antwort: alles in Großbuchstaben
        close(verbindung);
    });

    // --- Client: verbindet sich, schickt etwas, liest die Antwort ---
    int client = socket(AF_INET, SOCK_STREAM, 0);
    connect(client, reinterpret_cast<sockaddr *>(&adresse), sizeof adresse);
    std::string text = "hallo netzwerk";
    send(client, text.data(), text.size(), 0);
    char antwort[1024];
    ssize_t n = recv(client, antwort, sizeof antwort, 0);
    std::cout << "Antwort: " << std::string(antwort, n > 0 ? n : 0) << "\n";

    close(client);
    faden.join();
    close(server);
    return 0;
}
`,
      rust: raw`
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;

fn main() {
    // --- Server: wartet auf einem freien Port auf eine Verbindung ---
    let server = TcpListener::bind("127.0.0.1:0").unwrap();   // Port 0: das System wählt
    let adresse = server.local_addr().unwrap();

    let faden = thread::spawn(move || {
        let (mut verbindung, _) = server.accept().unwrap();    // wartet, bis jemand anruft
        let mut puffer = [0u8; 1024];
        let n = verbindung.read(&mut puffer).unwrap();
        let antwort = String::from_utf8_lossy(&puffer[..n]).to_uppercase();
        verbindung.write_all(antwort.as_bytes()).unwrap();     // Antwort: Großbuchstaben
    });

    // --- Client: verbindet sich, schickt etwas, liest die Antwort ---
    let mut client = TcpStream::connect(adresse).unwrap();
    client.write_all("hallo netzwerk".as_bytes()).unwrap();
    let mut puffer = [0u8; 1024];
    let n = client.read(&mut puffer).unwrap();
    println!("Antwort: {}", String::from_utf8_lossy(&puffer[..n]));

    faden.join().unwrap();
}
`,
    },
  },

  scenes: {
    ablauf: {
      title: 'Die Socket-Befehle im Gespräch',
      build: (): Step[] => {
        const actors = ['Client', 'Betriebssystem', 'Server'];
        const msgs: { from: number; to: number; label: string; sub?: string; tone?: number }[] = [
          { from: 2, to: 1, label: 'socket(), bind(), listen()', sub: '„Ich nehme Anrufe auf Port 8080 an"', tone: 2 },
          { from: 2, to: 1, label: 'accept()', sub: 'wartet …', tone: 2 },
          { from: 0, to: 1, label: 'socket(), connect()', sub: 'an 127.0.0.1:8080', tone: 0 },
          { from: 1, to: 2, label: 'neue Verbindung', sub: 'Handschlag erledigt das System', tone: 2 },
          { from: 0, to: 2, label: 'send("hallo")', tone: 0 },
          { from: 2, to: 0, label: 'send("HALLO")', tone: 2 },
          { from: 0, to: 2, label: 'close()', tone: 0 },
        ];
        const notes = [
          'Der **Server** legt einen Socket an, bindet ihn an eine Adresse und einen **Port** und meldet dem Betriebssystem: Ich bin bereit für Verbindungen.',
          '`accept()` blockiert: Das Programm schläft, bis jemand anruft.',
          'Der **Client** legt ebenfalls einen Socket an und ruft `connect()` mit Adresse und Port des Servers. Den Drei-Wege-Handschlag von TCP erledigt das Betriebssystem im Hintergrund.',
          '`accept()` kehrt mit einem **neuen** Socket zurück, der nur für diese eine Verbindung zuständig ist. Der ursprüngliche Socket kann weiter auf neue Anrufe warten.',
          'Jetzt schicken beide Seiten Bytes mit `send()` und lesen mit `recv()`. Was die Bytes bedeuten, legt das Anwendungsprotokoll fest.',
          'Die Antwort des Servers.',
          '`close()` beendet die Verbindung. Diese Handvoll Befehle steckt unter jedem Webserver, jedem Browser, jeder Datenbankverbindung.',
        ];
        return msgs.map((_, i) => ({ note: notes[i], seq: { actors, msgs: msgs.slice(0, i + 1) } }));
      },
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'bytes-zaehlen',
      title: 'Ein Server, der Bytes zählt',
      prompt:
        'Das Programm liest eine Nachricht von der Eingabe und schickt sie per TCP an einen Server im selben Programm. Der Server soll antworten, **wie viele Bytes** er empfangen hat – als Text, etwa `5`. Der Client gibt die Antwort aus.\n\nClient und Verbindungsaufbau sind fertig. Der Server schickt bisher einfach die Nachricht zurück. Ändere ihn so, dass er die Anzahl der empfangenen Bytes antwortet.\n\nAchtung: Bytes, nicht Zeichen! Umlaute belegen in UTF-8 zwei Bytes.',
      tests: [
        { name: 'hallo', stdin: 'hallo\n', expected: 'Antwort: 5\n' },
        { name: 'Mit Umlauten', stdin: 'Grüße\n', expected: 'Antwort: 7\n' },
        { name: 'Ein Satz', stdin: 'Netzwerke sind toll\n', expected: 'Antwort: 19\n' },
      ],
      hints: ['`recv` bzw. `read` liefert die Anzahl der empfangenen Bytes. Wandle sie in Text um und schicke diesen Text zurück.'],
      code: {
        python: raw`
import socket
import threading

nachricht = input()

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(("127.0.0.1", 0))
server.listen()
port = server.getsockname()[1]

def bediene():
    verbindung, _ = server.accept()
    daten = verbindung.recv(1024)
#:solution
    verbindung.sendall(str(len(daten)).encode())
#:starter
    verbindung.sendall(daten)
#:end
    verbindung.close()

faden = threading.Thread(target=bediene)
faden.start()

client = socket.create_connection(("127.0.0.1", port))
client.sendall(nachricht.encode())
print("Antwort:", client.recv(1024).decode())
client.close()
faden.join()
`,
        java: raw`
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) throws Exception {
        String nachricht = new Scanner(System.in).nextLine();
        ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress());
        Thread faden = new Thread(() -> {
            try (Socket verbindung = server.accept()) {
                byte[] puffer = new byte[1024];
                int n = verbindung.getInputStream().read(puffer);
//:solution
                verbindung.getOutputStream().write(String.valueOf(n).getBytes(StandardCharsets.UTF_8));
//:starter
                verbindung.getOutputStream().write(puffer, 0, n);
//:end
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
        faden.start();

        try (Socket client = new Socket(InetAddress.getLoopbackAddress(), server.getLocalPort())) {
            client.getOutputStream().write(nachricht.getBytes(StandardCharsets.UTF_8));
            byte[] puffer = new byte[1024];
            int n = client.getInputStream().read(puffer);
            System.out.println("Antwort: " + new String(puffer, 0, n, StandardCharsets.UTF_8));
        }
        faden.join();
        server.close();
    }
}
`,
        c: raw`
#include <arpa/inet.h>
#include <pthread.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

static int server;

static void *bediene(void *arg) {
    (void) arg;
    int verbindung = accept(server, NULL, NULL);
    char puffer[1024];
    ssize_t n = recv(verbindung, puffer, sizeof puffer, 0);
//:solution
    char antwort[32];
    int laenge = snprintf(antwort, sizeof antwort, "%zd", n);
    send(verbindung, antwort, laenge, 0);
//:starter
    send(verbindung, puffer, n, 0);
//:end
    close(verbindung);
    return NULL;
}

int main(void) {
    char nachricht[1000];
    if (!fgets(nachricht, sizeof nachricht, stdin)) {
        return 1;
    }
    nachricht[strcspn(nachricht, "\n")] = '\0';

    server = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in adresse = {0};
    adresse.sin_family = AF_INET;
    adresse.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    bind(server, (struct sockaddr *) &adresse, sizeof adresse);
    listen(server, 1);
    socklen_t laenge = sizeof adresse;
    getsockname(server, (struct sockaddr *) &adresse, &laenge);

    pthread_t faden;
    pthread_create(&faden, NULL, bediene, NULL);

    int client = socket(AF_INET, SOCK_STREAM, 0);
    connect(client, (struct sockaddr *) &adresse, sizeof adresse);
    send(client, nachricht, strlen(nachricht), 0);
    char antwort[1024];
    ssize_t n = recv(client, antwort, sizeof antwort - 1, 0);
    antwort[n > 0 ? n : 0] = '\0';
    printf("Antwort: %s\n", antwort);

    close(client);
    pthread_join(faden, NULL);
    close(server);
    return 0;
}
`,
        cpp: raw`
#include <arpa/inet.h>
#include <iostream>
#include <string>
#include <sys/socket.h>
#include <thread>
#include <unistd.h>

int main() {
    std::string nachricht;
    std::getline(std::cin, nachricht);

    int server = socket(AF_INET, SOCK_STREAM, 0);
    sockaddr_in adresse{};
    adresse.sin_family = AF_INET;
    adresse.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    bind(server, reinterpret_cast<sockaddr *>(&adresse), sizeof adresse);
    listen(server, 1);
    socklen_t laenge = sizeof adresse;
    getsockname(server, reinterpret_cast<sockaddr *>(&adresse), &laenge);

    std::thread faden([server] {
        int verbindung = accept(server, nullptr, nullptr);
        char puffer[1024];
        ssize_t n = recv(verbindung, puffer, sizeof puffer, 0);
//:solution
        std::string antwort = std::to_string(n);
        send(verbindung, antwort.data(), antwort.size(), 0);
//:starter
        send(verbindung, puffer, n, 0);
//:end
        close(verbindung);
    });

    int client = socket(AF_INET, SOCK_STREAM, 0);
    connect(client, reinterpret_cast<sockaddr *>(&adresse), sizeof adresse);
    send(client, nachricht.data(), nachricht.size(), 0);
    char antwort[1024];
    ssize_t n = recv(client, antwort, sizeof antwort, 0);
    std::cout << "Antwort: " << std::string(antwort, n > 0 ? n : 0) << "\n";

    close(client);
    faden.join();
    close(server);
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;

fn main() {
    let mut nachricht = String::new();
    io::stdin().read_line(&mut nachricht).unwrap();
    let nachricht = nachricht.trim_end().to_string();

    let server = TcpListener::bind("127.0.0.1:0").unwrap();
    let adresse = server.local_addr().unwrap();
    let faden = thread::spawn(move || {
        let (mut verbindung, _) = server.accept().unwrap();
        let mut puffer = [0u8; 1024];
        let n = verbindung.read(&mut puffer).unwrap();
//:solution
        verbindung.write_all(n.to_string().as_bytes()).unwrap();
//:starter
        verbindung.write_all(&puffer[..n]).unwrap();
//:end
    });

    let mut client = TcpStream::connect(adresse).unwrap();
    client.write_all(nachricht.as_bytes()).unwrap();
    let mut puffer = [0u8; 1024];
    let n = client.read(&mut puffer).unwrap();
    println!("Antwort: {}", String::from_utf8_lossy(&puffer[..n]));
    faden.join().unwrap();
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'ports',
      title: 'Wozu Ports?',
      question: 'Auf deinem Laptop laufen gleichzeitig ein Browser mit zehn Tabs, ein Mailprogramm und ein Musikdienst. Alle empfangen Daten über dieselbe IP-Adresse. Wie weiß das Betriebssystem, welches Paket zu welchem Programm gehört?',
      options: [
        'Es rät.',
        'An der **Portnummer** im TCP- bzw. UDP-Kopf. Jede Verbindung ist eindeutig durch die vier Werte Absender-IP, Absender-Port, Ziel-IP und Ziel-Port bestimmt.',
        'An der MAC-Adresse.',
        'Jedes Programm hat eine eigene IP-Adresse.',
      ],
      correct: 1,
      explain:
        'Server lauschen auf **bekannten Ports** – 80 für HTTP, 443 für HTTPS, 22 für SSH, 53 für DNS, 5432 für PostgreSQL. Clients bekommen vom Betriebssystem einen zufälligen hohen Port (*ephemeral port*) zugeteilt. So können zehn Tabs gleichzeitig mit demselben Webserver verbunden sein: Sie unterscheiden sich im Absender-Port.',
    },
  ],
};

export default lesson;
