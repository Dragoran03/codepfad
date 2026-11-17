import { raw } from '../../types.ts';
import type { LessonCode, SeqView, Step } from '../../types.ts';

const lesson: LessonCode = {
  scenes: {
    seitenaufruf: {
      title: 'Was beim Aufruf von https://example.org passiert',
      build: (): Step[] => {
        const actors = ['Browser', 'DNS-Resolver', 'Webserver'];
        const all: SeqView['msgs'] = [
          { from: 0, to: 1, label: 'example.org?', tone: 3 },
          { from: 1, to: 0, label: '93.184.215.14', tone: 3 },
          { from: 0, to: 2, label: 'SYN', tone: 1 },
          { from: 2, to: 0, label: 'SYN-ACK', tone: 1 },
          { from: 0, to: 2, label: 'ACK + ClientHello', sub: 'TLS-Versionen, Schlüsselanteil', tone: 2 },
          { from: 2, to: 0, label: 'ServerHello + Zertifikat', sub: 'Schlüsselanteil, Unterschrift', tone: 2 },
          { from: 0, to: 2, label: 'GET / HTTP/1.1', sub: 'verschlüsselt', tone: 0 },
          { from: 2, to: 0, label: '200 OK + HTML', sub: 'verschlüsselt', tone: 0 },
          { from: 0, to: 2, label: 'GET /stil.css, /bild.png …', sub: 'über dieselbe Verbindung', tone: 0 },
        ];
        const notes = [
          '**DNS:** Zuerst braucht der Browser die IP-Adresse (falls er sie nicht schon im Cache hat).',
          'Antwort vom Resolver.',
          '**TCP:** Verbindung zu Port 443 aufbauen – der Drei-Wege-Handschlag.',
          'Der Server stimmt zu.',
          '**TLS:** Gleich mit dem letzten Handschlag-Paket schlägt der Browser eine Verschlüsselung vor und schickt seinen Teil eines Schlüsselaustauschs.',
          'Der Server antwortet mit seinem Teil und einem **Zertifikat**: einer digital unterschriebenen Bestätigung, dass er wirklich `example.org` ist. Der Browser prüft die Unterschrift gegen die Zertifizierungsstellen, denen er vertraut. Beide Seiten berechnen nun denselben geheimen Schlüssel – ohne ihn je übertragen zu haben.',
          '**HTTP:** Erst jetzt die eigentliche Anfrage. Für jeden auf dem Weg ist sie nur noch Zeichensalat.',
          'Die Antwort: Statuscode, Kopfzeilen, die HTML-Seite.',
          'Der Browser liest das HTML und findet Stylesheets, Skripte und Bilder – Dutzende weitere Anfragen. Darum hält er die Verbindung offen (*keep-alive*); HTTP/2 schickt sogar viele Anfragen gleichzeitig über dieselbe Verbindung.',
        ];
        return all.map((_, i) => ({ note: notes[i], seq: { actors, msgs: all.slice(0, i + 1) } }));
      },
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'antwort',
      title: 'Eine HTTP-Antwort zerlegen',
      prompt:
        'Das Programm bekommt eine HTTP-Antwort als Text: Statuszeile, Kopfzeilen, eine Leerzeile, dann der Inhalt. Gib drei Zeilen aus:\n`Status: <Statuscode>`\n`Typ: <Wert der Kopfzeile Content-Type>`\n`Inhalt: <erste Zeile des Inhalts>`\n\nDer Startcode gibt nur die Statuszeile aus.',
      tests: [
        {
          name: '200 OK',
          stdin: 'HTTP/1.1 200 OK\nContent-Type: text/html\nContent-Length: 13\n\n<h1>Hallo</h1>\n',
          expected: 'Status: 200\nTyp: text/html\nInhalt: <h1>Hallo</h1>\n',
        },
        {
          name: '404 mit anderer Reihenfolge',
          stdin: 'HTTP/1.1 404 Not Found\nServer: codepfad\nContent-Type: text/plain\n\nNicht gefunden\n',
          expected: 'Status: 404\nTyp: text/plain\nInhalt: Nicht gefunden\n',
        },
      ],
      hints: [
        'Der Statuscode ist das zweite Wort der ersten Zeile.',
        'Lies danach Zeile für Zeile: Beginnt sie mit `Content-Type:`, merke dir den Rest. Nach der ersten leeren Zeile beginnt der Inhalt.',
      ],
      code: {
        python: raw`
import sys

zeilen = sys.stdin.read().split("\n")
#:solution
status = zeilen[0].split()[1]
typ = ""
i = 1
while zeilen[i] != "":
    name, wert = zeilen[i].split(":", 1)
    if name == "Content-Type":
        typ = wert.strip()
    i += 1
inhalt = zeilen[i + 1]
print("Status:", status)
print("Typ:", typ)
print("Inhalt:", inhalt)
#:starter
print(zeilen[0])
#:end
`,
        java: raw`
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        List<String> zeilen = new ArrayList<>();
        while (in.hasNextLine()) {
            zeilen.add(in.nextLine());
        }
//:solution
        String status = zeilen.get(0).split(" ")[1];
        String typ = "";
        int i = 1;
        while (!zeilen.get(i).isEmpty()) {
            String[] teile = zeilen.get(i).split(":", 2);
            if (teile[0].equals("Content-Type")) {
                typ = teile[1].trim();
            }
            i++;
        }
        System.out.println("Status: " + status);
        System.out.println("Typ: " + typ);
        System.out.println("Inhalt: " + zeilen.get(i + 1));
//:starter
        System.out.println(zeilen.get(0));
//:end
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

int main(void) {
    char zeile[1024];
    fgets(zeile, sizeof zeile, stdin);
//:solution
    char version[32];
    int status;
    sscanf(zeile, "%31s %d", version, &status);
    char typ[256] = "";
    while (fgets(zeile, sizeof zeile, stdin) && strcmp(zeile, "\n") != 0) {
        if (strncmp(zeile, "Content-Type:", 13) == 0) {
            sscanf(zeile + 13, " %255[^\n]", typ);
        }
    }
    char inhalt[1024] = "";
    if (fgets(inhalt, sizeof inhalt, stdin)) {
        inhalt[strcspn(inhalt, "\n")] = '\0';
    }
    printf("Status: %d\n", status);
    printf("Typ: %s\n", typ);
    printf("Inhalt: %s\n", inhalt);
//:starter
    printf("%s", zeile);
//:end
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::string zeile;
    std::getline(std::cin, zeile);
//:solution
    std::istringstream erste(zeile);
    std::string version, status;
    erste >> version >> status;
    std::string typ;
    while (std::getline(std::cin, zeile) && !zeile.empty()) {
        const std::string name = "Content-Type:";
        if (zeile.rfind(name, 0) == 0) {
            typ = zeile.substr(name.size());
            typ.erase(0, typ.find_first_not_of(' '));
        }
    }
    std::string inhalt;
    std::getline(std::cin, inhalt);
    std::cout << "Status: " << status << "\n";
    std::cout << "Typ: " << typ << "\n";
    std::cout << "Inhalt: " << inhalt << "\n";
//:starter
    std::cout << zeile << "\n";
//:end
    return 0;
}
`,
        rust: raw`
use std::io::{self, Read};

fn main() {
    let mut text = String::new();
    io::stdin().read_to_string(&mut text).unwrap();
    let mut zeilen = text.lines();
    let erste = zeilen.next().unwrap();
//:solution
    let status = erste.split_whitespace().nth(1).unwrap();
    let mut typ = "";
    for zeile in zeilen.by_ref() {
        if zeile.is_empty() {
            break;
        }
        if let Some((name, wert)) = zeile.split_once(':') {
            if name == "Content-Type" {
                typ = wert.trim();
            }
        }
    }
    let inhalt = zeilen.next().unwrap_or("");
    println!("Status: {}", status);
    println!("Typ: {}", typ);
    println!("Inhalt: {}", inhalt);
//:starter
    let _ = zeilen;
    println!("{}", erste);
//:end
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'statuscodes',
      title: 'Statuscodes',
      question: 'Ein Server antwortet mit `503 Service Unavailable`. Wer hat den Fehler gemacht?',
      options: [
        'Der Browser – er hat eine falsche Anfrage geschickt.',
        'Der Server – er ist gerade überlastet oder in Wartung. Ein späterer Versuch kann klappen.',
        'Niemand, 5xx bedeutet Erfolg.',
        'Der DNS-Resolver.',
      ],
      correct: 1,
      explain:
        'Die erste Ziffer verrät die Klasse: **2xx** Erfolg (200 OK, 201 Created), **3xx** Umleitung (301 dauerhaft verschoben, 304 nicht geändert), **4xx** Fehler des Clients (400 ungültige Anfrage, 401 nicht angemeldet, 403 verboten, 404 nicht gefunden), **5xx** Fehler des Servers (500 interner Fehler, 503 nicht verfügbar).',
    },
    {
      kind: 'quiz',
      id: 'tls',
      title: 'Was schützt HTTPS?',
      question: 'Du rufst `https://bank.example/konto` in einem öffentlichen WLAN auf. Was kann jemand sehen, der den Funkverkehr mitschneidet?',
      options: [
        'Alles, auch den Kontostand.',
        'Nichts, nicht einmal, dass eine Verbindung besteht.',
        'Dass du mit dem Server `bank.example` sprichst, wann und wie viele Daten fließen – aber nicht den Pfad `/konto`, keine Formulareingaben und keine Inhalte.',
        'Nur das Passwort.',
      ],
      correct: 2,
      explain:
        'TLS verschlüsselt alles ab dem HTTP-Teil: Pfad, Kopfzeilen, Cookies, Inhalte. Sichtbar bleiben IP-Adressen, Zeitpunkte, Datenmengen – und meist der Servername, weil der Browser ihn beim Verbindungsaufbau unverschlüsselt nennt, damit der Server das passende Zertifikat wählen kann. Das Zertifikat verhindert außerdem, dass sich jemand als die Bank ausgibt.',
    },
  ],
};

export default lesson;
