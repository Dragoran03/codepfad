import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';

const lesson: LessonCode = {
  snippets: {
    zaehler: {
      python: raw`
import threading

zaehler = 0
sperre = threading.Lock()

def arbeite():
    global zaehler
    for _ in range(100_000):
        with sperre:              # nur ein Thread gleichzeitig
            zaehler += 1

threads = [threading.Thread(target=arbeite) for _ in range(2)]
for t in threads:
    t.start()
for t in threads:
    t.join()                      # warten, bis alle fertig sind
print(zaehler)
`,
      java: raw`
public class Main {
    static int zaehler = 0;
    static final Object sperre = new Object();

    public static void main(String[] args) throws InterruptedException {
        Runnable arbeite = () -> {
            for (int i = 0; i < 100_000; i++) {
                synchronized (sperre) {   // nur ein Thread gleichzeitig
                    zaehler++;
                }
            }
        };
        Thread a = new Thread(arbeite);
        Thread b = new Thread(arbeite);
        a.start();
        b.start();
        a.join();                         // warten, bis beide fertig sind
        b.join();
        System.out.println(zaehler);
    }
}
`,
      c: raw`
#include <pthread.h>
#include <stdio.h>

int zaehler = 0;
pthread_mutex_t sperre = PTHREAD_MUTEX_INITIALIZER;

void *arbeite(void *arg) {
    (void)arg;
    for (int i = 0; i < 100000; i++) {
        pthread_mutex_lock(&sperre);    // nur ein Thread gleichzeitig
        zaehler++;
        pthread_mutex_unlock(&sperre);
    }
    return NULL;
}

int main(void) {
    pthread_t a, b;
    pthread_create(&a, NULL, arbeite, NULL);
    pthread_create(&b, NULL, arbeite, NULL);
    pthread_join(a, NULL);              // warten, bis beide fertig sind
    pthread_join(b, NULL);
    printf("%d\n", zaehler);
    return 0;
}
`,
      cpp: raw`
#include <iostream>
#include <mutex>
#include <thread>

int main() {
    int zaehler = 0;
    std::mutex sperre;

    auto arbeite = [&] {
        for (int i = 0; i < 100000; i++) {
            std::lock_guard<std::mutex> halten(sperre);  // nur ein Thread gleichzeitig
            zaehler++;
        }
    };

    std::thread a(arbeite);
    std::thread b(arbeite);
    a.join();                  // warten, bis beide fertig sind
    b.join();
    std::cout << zaehler << "\n";
    return 0;
}
`,
      rust: raw`
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let zaehler = Arc::new(Mutex::new(0));
    let mut griffe = Vec::new();

    for _ in 0..2 {
        let zaehler = Arc::clone(&zaehler);
        griffe.push(thread::spawn(move || {
            for _ in 0..100_000 {
                *zaehler.lock().unwrap() += 1;   // nur ein Thread gleichzeitig
            }
        }));
    }
    for g in griffe {
        g.join().unwrap();                       // warten, bis alle fertig sind
    }
    println!("{}", *zaehler.lock().unwrap());
}
`,
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'aufteilen',
      title: 'Arbeit aufteilen',
      prompt:
        'Die Summe 1 + 2 + … + n soll auf **zwei Threads** verteilt werden: Der erste rechnet die untere Hälfte (1 bis n/2), der zweite die obere (n/2 + 1 bis n). Jeder schreibt sein Teilergebnis in einen eigenen Platz, am Ende werden beide addiert.\n\nDer erste Thread ist fertig. Starte den zweiten und warte auf ihn. Weil jeder Thread nur in seinen eigenen Platz schreibt, braucht es hier keine Sperre.',
      tests: [
        { name: 'n = 10', stdin: '10\n', expected: '55\n' },
        { name: 'n = 100', stdin: '100\n', expected: '5050\n' },
        { name: 'n = 1', stdin: '1\n', expected: '1\n' },
        { name: 'n = 9', stdin: '9\n', expected: '45\n' },
      ],
      hints: [
        'Schau dir genau an, wie der erste Thread gestartet und auf ihn gewartet wird. Der zweite funktioniert genauso – nur mit dem Bereich `mitte + 1` bis `n` und dem Ergebnisplatz 1.',
        'Vergiss das Warten (`join`) nicht: Sonst wird das Ergebnis womöglich gelesen, bevor der Thread fertig ist.',
      ],
      code: {
        python: raw`
import threading

def teilsumme(von, bis, ergebnis, platz):
    ergebnis[platz] = sum(range(von, bis + 1))

n = int(input())
mitte = n // 2
ergebnis = [0, 0]

erster = threading.Thread(target=teilsumme, args=(1, mitte, ergebnis, 0))
erster.start()
#:solution
zweiter = threading.Thread(target=teilsumme, args=(mitte + 1, n, ergebnis, 1))
zweiter.start()
#:starter
# Starte hier den zweiten Thread.
#:end

erster.join()
#:solution
zweiter.join()
#:starter
# Warte hier auf den zweiten Thread.
#:end
print(ergebnis[0] + ergebnis[1])
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        int n = new Scanner(System.in).nextInt();
        int mitte = n / 2;
        long[] ergebnis = new long[2];

        Thread erster = new Thread(() -> {
            for (int i = 1; i <= mitte; i++) {
                ergebnis[0] += i;
            }
        });
        erster.start();
//:solution
        Thread zweiter = new Thread(() -> {
            for (int i = mitte + 1; i <= n; i++) {
                ergebnis[1] += i;
            }
        });
        zweiter.start();
//:starter
        // Starte hier den zweiten Thread.
//:end

        erster.join();
//:solution
        zweiter.join();
//:starter
        // Warte hier auf den zweiten Thread.
//:end
        System.out.println(ergebnis[0] + ergebnis[1]);
    }
}
`,
        c: raw`
#include <pthread.h>
#include <stdio.h>

struct Auftrag {
    int von;
    int bis;
    long long ergebnis;
};

void *teilsumme(void *arg) {
    struct Auftrag *a = arg;
    a->ergebnis = 0;
    for (int i = a->von; i <= a->bis; i++) {
        a->ergebnis += i;
    }
    return NULL;
}

int main(void) {
    int n;
    scanf("%d", &n);
    int mitte = n / 2;

    struct Auftrag erster_auftrag = {1, mitte, 0};
    struct Auftrag zweiter_auftrag = {mitte + 1, n, 0};
    pthread_t erster;
    pthread_create(&erster, NULL, teilsumme, &erster_auftrag);
//:solution
    pthread_t zweiter;
    pthread_create(&zweiter, NULL, teilsumme, &zweiter_auftrag);
//:starter
    // Starte hier den zweiten Thread mit zweiter_auftrag.
//:end

    pthread_join(erster, NULL);
//:solution
    pthread_join(zweiter, NULL);
//:starter
    // Warte hier auf den zweiten Thread.
//:end
    printf("%lld\n", erster_auftrag.ergebnis + zweiter_auftrag.ergebnis);
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <thread>

long long teilsumme(int von, int bis) {
    long long s = 0;
    for (int i = von; i <= bis; i++) {
        s += i;
    }
    return s;
}

int main() {
    int n;
    std::cin >> n;
    int mitte = n / 2;
    long long ergebnis[2] = {0, 0};

    std::thread erster([&] { ergebnis[0] = teilsumme(1, mitte); });
//:solution
    std::thread zweiter([&] { ergebnis[1] = teilsumme(mitte + 1, n); });
//:starter
    // Starte hier den zweiten Thread.
//:end

    erster.join();
//:solution
    zweiter.join();
//:starter
    // Warte hier auf den zweiten Thread.
//:end
    std::cout << ergebnis[0] + ergebnis[1] << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;
use std::thread;

fn teilsumme(von: u64, bis: u64) -> u64 {
    (von..=bis).sum()
}

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let n: u64 = zeile.trim().parse().unwrap();
    let mitte = n / 2;

    let erster = thread::spawn(move || teilsumme(1, mitte));
//:solution
    let zweiter = thread::spawn(move || teilsumme(mitte + 1, n));
//:starter
    // Starte hier den zweiten Thread. In Rust liefert join() das Ergebnis des Threads.
//:end

    let a = erster.join().unwrap();
//:solution
    let b = zweiter.join().unwrap();
//:starter
    let b = 0;
//:end
    println!("{}", a + b);
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'deadlock',
      title: 'Gegenseitiges Warten',
      question:
        'Thread 1 hält Sperre A und wartet auf Sperre B. Thread 2 hält Sperre B und wartet auf Sperre A. Was passiert?',
      options: [
        'Das Betriebssystem löst das automatisch auf.',
        'Beide warten für immer – ein **Deadlock**. Das Programm hängt.',
        'Der schnellere Thread gewinnt.',
        'Beide bekommen beide Sperren gleichzeitig.',
      ],
      correct: 1,
      explain:
        'Keiner gibt nach, weil jeder auf den anderen wartet. Die klassische Abhilfe: Sperren immer in derselben, festen Reihenfolge anfordern. Noch besser ist es, geteilten veränderlichen Zustand ganz zu vermeiden – etwa indem Threads sich Nachrichten schicken (Channels) statt gemeinsame Variablen zu benutzen.',
    },
    {
      kind: 'quiz',
      id: 'rust-sicher',
      title: 'Sicher durch den Compiler',
      question: 'Was passiert, wenn man in Rust versucht, eine normale veränderliche Variable ohne `Mutex` aus zwei Threads gleichzeitig zu verändern?',
      options: [
        'Es funktioniert, liefert aber manchmal falsche Ergebnisse.',
        'Der Compiler lehnt das Programm ab.',
        'Rust fügt automatisch eine Sperre ein.',
        'Das Programm stürzt beim Start ab.',
      ],
      correct: 1,
      explain:
        'Rusts Besitz- und Ausleihregeln gelten auch über Threads hinweg: Eine Variable darf nicht gleichzeitig von mehreren Seiten verändert werden. Wer Daten teilen will, muss es ausdrücklich tun (`Arc` für geteilten Besitz, `Mutex` für exklusiven Zugriff). Race Conditions auf Daten sind in sicherem Rust damit ausgeschlossen – in C, C++, Java und Python muss man selbst aufpassen.',
    },
  ],
};

export default lesson;
