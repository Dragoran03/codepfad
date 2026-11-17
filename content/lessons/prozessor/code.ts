import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  snippets: {
    cache: {
      python: raw`
import time

N = 800
feld = [[1] * N for _ in range(N)]

start = time.perf_counter()
s = 0
for zeile in range(N):
    for spalte in range(N):
        s += feld[zeile][spalte]
zeilenweise = time.perf_counter() - start

start = time.perf_counter()
s = 0
for spalte in range(N):
    for zeile in range(N):
        s += feld[zeile][spalte]
spaltenweise = time.perf_counter() - start

print(f"zeilenweise:  {zeilenweise * 1000:.1f} ms")
print(f"spaltenweise: {spaltenweise * 1000:.1f} ms")
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int n = 4096;
        int[][] feld = new int[n][n];
        for (int[] zeile : feld) {
            java.util.Arrays.fill(zeile, 1);
        }

        long start = System.nanoTime();
        long s = 0;
        for (int z = 0; z < n; z++) {
            for (int sp = 0; sp < n; sp++) {
                s += feld[z][sp];
            }
        }
        long zeilenweise = System.nanoTime() - start;

        start = System.nanoTime();
        for (int sp = 0; sp < n; sp++) {
            for (int z = 0; z < n; z++) {
                s += feld[z][sp];
            }
        }
        long spaltenweise = System.nanoTime() - start;

        System.out.printf("zeilenweise:  %.1f ms%n", zeilenweise / 1e6);
        System.out.printf("spaltenweise: %.1f ms%n", spaltenweise / 1e6);
        System.out.println("(Prüfsumme " + s + ")");
    }
}
`,
      c: raw`
#include <stdio.h>
#include <time.h>

#define N 4096
static int feld[N][N];

static double jetzt(void) {
    struct timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec * 1e3 + t.tv_nsec / 1e6;
}

int main(void) {
    for (int z = 0; z < N; z++)
        for (int s = 0; s < N; s++)
            feld[z][s] = 1;

    double start = jetzt();
    long long summe = 0;
    for (int z = 0; z < N; z++)
        for (int s = 0; s < N; s++)
            summe += feld[z][s];
    double zeilenweise = jetzt() - start;

    start = jetzt();
    for (int s = 0; s < N; s++)
        for (int z = 0; z < N; z++)
            summe += feld[z][s];
    double spaltenweise = jetzt() - start;

    printf("zeilenweise:  %.1f ms\n", zeilenweise);
    printf("spaltenweise: %.1f ms\n", spaltenweise);
    printf("(Prüfsumme %lld)\n", summe);
    return 0;
}
`,
      cpp: raw`
#include <chrono>
#include <cstdio>
#include <vector>

int main() {
    const int n = 4096;
    std::vector<int> feld(n * n, 1);   // eine Zeile nach der anderen im Speicher
    using uhr = std::chrono::steady_clock;

    auto start = uhr::now();
    long long summe = 0;
    for (int z = 0; z < n; z++)
        for (int s = 0; s < n; s++)
            summe += feld[z * n + s];
    double zeilenweise = std::chrono::duration<double, std::milli>(uhr::now() - start).count();

    start = uhr::now();
    for (int s = 0; s < n; s++)
        for (int z = 0; z < n; z++)
            summe += feld[z * n + s];
    double spaltenweise = std::chrono::duration<double, std::milli>(uhr::now() - start).count();

    std::printf("zeilenweise:  %.1f ms\n", zeilenweise);
    std::printf("spaltenweise: %.1f ms\n", spaltenweise);
    std::printf("(Prüfsumme %lld)\n", summe);
    return 0;
}
`,
      rust: raw`
use std::time::Instant;

fn main() {
    let n = 4096;
    let feld = vec![1i64; n * n];   // eine Zeile nach der anderen im Speicher

    let start = Instant::now();
    let mut summe = 0;
    for z in 0..n {
        for s in 0..n {
            summe += feld[z * n + s];
        }
    }
    let zeilenweise = start.elapsed();

    let start = Instant::now();
    for s in 0..n {
        for z in 0..n {
            summe += feld[z * n + s];
        }
    }
    let spaltenweise = start.elapsed();

    println!("zeilenweise:  {:.1} ms", zeilenweise.as_secs_f64() * 1000.0);
    println!("spaltenweise: {:.1} ms", spaltenweise.as_secs_f64() * 1000.0);
    println!("(Prüfsumme {})", summe);
}
`,
    },
  },

  scenes: {
    zyklus: {
      title: 'Holen, entschlüsseln, ausführen',
      build: (): Step[] => {
        const mem: (string | number)[] = ['LOAD A, [6]', 'ADD A, [7]', 'STORE A, [8]', 'HALT', '', '', 30, 12, 0];
        const steps: Step[] = [];
        const show = (pc: number, ir: string, a: number | string, note: string, hi: number[]) =>
          steps.push({
            note,
            array: { label: 'Arbeitsspeicher (Adresse unter jeder Zelle)', cells: [...mem].map((c) => (c === '' ? '·' : c)), pointers: pc >= 0 ? { PC: pc } : {}, hi },
            frames: [{ name: 'Prozessor', vars: { PC: pc, Befehl: ir, A: a } }],
          });
        show(0, '–', 0, 'Ein stark vereinfachter Prozessor. Im **Arbeitsspeicher** liegen Befehle **und** Daten nebeneinander – nur Zahlen, deren Bedeutung vom Zusammenhang abhängt. Der **Befehlszähler** (PC) zeigt auf den nächsten Befehl.', []);
        show(0, 'LOAD A, [6]', 0, '**Holen** (*fetch*): Der Befehl an der Adresse im PC wird in den Prozessor geladen. **Entschlüsseln** (*decode*): „Lade den Wert von Adresse 6 in Register A."', [0]);
        show(1, 'LOAD A, [6]', 30, '**Ausführen** (*execute*): A = 30. Danach rückt der PC zum nächsten Befehl.', [6]);
        show(1, 'ADD A, [7]', 30, 'Holen und entschlüsseln: „Addiere den Wert von Adresse 7 zu A."', [1]);
        show(2, 'ADD A, [7]', 42, 'Ausführen: 30 + 12 = 42.', [7]);
        mem[8] = 42;
        show(3, 'STORE A, [8]', 42, '„Speichere A an Adresse 8." Das Ergebnis steht jetzt im Arbeitsspeicher.', [2, 8]);
        show(3, 'HALT', 42, 'Fertig. Ein echter Prozessor wiederholt diesen Zyklus mehrere Milliarden Mal pro Sekunde – und überlappt dabei viele Befehle gleichzeitig (*Pipelining*), wie an einem Fließband.', [3]);
        return steps;
      },
    },
  },

  exercises: [
    {
      kind: 'quiz',
      id: 'cache',
      title: 'Zeilen oder Spalten?',
      question: 'Im Messprogramm ist das zeilenweise Durchlaufen meist deutlich schneller, obwohl beide Schleifen genau gleich viele Werte addieren. Warum?',
      options: [
        'Weil der Compiler die zweite Schleife nicht übersetzt.',
        'Weil der Prozessor Speicher immer in Blöcken (Cache-Zeilen) in seinen schnellen Cache lädt. Zeilenweise liegen die nächsten Werte schon im Cache, spaltenweise springt jeder Zugriff weit weg und muss oft aus dem langsamen Arbeitsspeicher geholt werden.',
        'Weil Spalten im Speicher verschlüsselt sind.',
        'Weil Additionen von oben nach unten langsamer sind.',
      ],
      correct: 1,
      explain:
        'Ein Zugriff auf den Arbeitsspeicher kostet etwa 100-mal so viel Zeit wie einer auf den L1-Cache. Deshalb lädt der Prozessor nie einzelne Werte, sondern 64-Byte-Blöcke – und rät, welche als Nächstes gebraucht werden (*Prefetching*). Code, der Speicher der Reihe nach liest, ist cache-freundlich. Das ist auch der Grund, warum Arrays in der Praxis meist schneller sind als verkettete Listen.',
    },
    {
      kind: 'quiz',
      id: 'takt',
      title: 'Wie schnell ist schnell?',
      question: 'Ein Prozessor läuft mit 3 GHz. Wie lange dauert ungefähr ein Takt?',
      options: ['Eine Millisekunde', 'Eine Mikrosekunde', 'Etwa ein Drittel Nanosekunde', 'Eine Sekunde'],
      correct: 2,
      explain:
        '3 Milliarden Takte pro Sekunde heißt: ein Takt dauert 1/3 Nanosekunde. In dieser Zeit legt Licht gerade einmal 10 cm zurück. Moderne Prozessoren schaffen pro Takt sogar mehrere Befehle. Ein Zugriff auf den Arbeitsspeicher kostet dagegen rund 100 Nanosekunden – also Hunderte Takte, in denen der Prozessor warten müsste.',
    },
  ],
};

export default lesson;
