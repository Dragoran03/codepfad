import { raw } from '../../types.ts';
import type { LessonCode, Step } from '../../types.ts';

const lesson: LessonCode = {
  snippets: {
    prozess: {
      python: raw`
import os

print("Meine Prozessnummer (PID):", os.getpid())
print("PID meines Elternprozesses:", os.getppid())
print("Prozessorkerne:", os.cpu_count())

# Ein Systemaufruf: direkt an das Betriebssystem schreiben (Kanal 1 = Ausgabe)
os.write(1, b"Hallo vom Systemaufruf write\n")
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        ProcessHandle ich = ProcessHandle.current();
        System.out.println("Meine Prozessnummer (PID): " + ich.pid());
        System.out.println("PID meines Elternprozesses: " + ich.parent().map(ProcessHandle::pid).orElse(-1L));
        System.out.println("Prozessorkerne: " + Runtime.getRuntime().availableProcessors());
    }
}
`,
      c: raw`
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main(void) {
    printf("Meine Prozessnummer (PID): %d\n", getpid());
    printf("PID meines Elternprozesses: %d\n", getppid());
    printf("Prozessorkerne: %ld\n", sysconf(_SC_NPROCESSORS_ONLN));
    fflush(stdout);

    // Ein Systemaufruf: direkt an das Betriebssystem schreiben (Kanal 1 = Ausgabe)
    const char *text = "Hallo vom Systemaufruf write\n";
    write(1, text, strlen(text));
    return 0;
}
`,
      cpp: raw`
#include <cstring>
#include <iostream>
#include <thread>
#include <unistd.h>

int main() {
    std::cout << "Meine Prozessnummer (PID): " << getpid() << "\n";
    std::cout << "PID meines Elternprozesses: " << getppid() << "\n";
    std::cout << "Prozessorkerne: " << std::thread::hardware_concurrency() << "\n";
    std::cout.flush();

    // Ein Systemaufruf: direkt an das Betriebssystem schreiben (Kanal 1 = Ausgabe)
    const char *text = "Hallo vom Systemaufruf write\n";
    write(1, text, std::strlen(text));
    return 0;
}
`,
      rust: raw`
use std::io::Write;

fn main() {
    println!("Meine Prozessnummer (PID): {}", std::process::id());
    println!("PID meines Elternprozesses: {}", std::os::unix::process::parent_id());
    println!("Prozessorkerne: {}", std::thread::available_parallelism().unwrap());

    // Unter jeder Ausgabe steckt ein Systemaufruf write – hier ohne Puffer
    std::io::stdout().write_all(b"Hallo vom Systemaufruf write\n").unwrap();
}
`,
    },
  },

  scenes: {
    zeitscheiben: {
      title: 'Ein Kern, drei Programme',
      build: (): Step[] => {
        const slots: string[] = [];
        const steps: Step[] = [];
        const plan = ['Browser', 'Musik', 'Editor', 'Browser', 'Musik', 'Editor', 'Browser', 'Editor'];
        const zustand = (laeuft: string, wartet: string[] = []): Record<string, string> => {
          const z: Record<string, string> = {};
          for (const p of ['Browser', 'Musik', 'Editor']) z[p] = p === laeuft ? 'läuft' : wartet.includes(p) ? 'wartet auf Ein-/Ausgabe' : 'bereit';
          return z;
        };
        steps.push({
          note: 'Drei Programme wollen gleichzeitig laufen, aber es gibt nur einen Prozessorkern. Der **Scheduler** des Betriebssystems teilt die Zeit in kleine **Zeitscheiben** (ein paar Millisekunden) und wechselt reihum.',
          array: { label: 'Zeitleiste des Prozessorkerns', cells: ['·'], showIndex: false },
          frames: [{ name: 'Prozesse', vars: zustand('') }],
        });
        plan.forEach((p, i) => {
          slots.push(p);
          const wartet = i === 4 ? ['Musik'] : [];
          steps.push({
            note:
              i === 0
                ? 'Der Browser bekommt die erste Zeitscheibe. Läuft sie ab, unterbricht ein Timer-Signal das Programm, und das Betriebssystem übernimmt.'
                : i === 1
                  ? '**Kontextwechsel**: Das Betriebssystem sichert alle Register des Browsers und lädt die des Musikprogramms. Das kostet ein paar Mikrosekunden.'
                  : i === 4
                    ? 'Das Musikprogramm will Daten von der Festplatte lesen. Statt zu warten, gibt es den Kern sofort frei und wird schlafen gelegt, bis die Daten da sind.'
                    : i === plan.length - 1
                      ? 'Für dich wirkt es, als liefen alle gleichzeitig – dabei wechselt der Kern Hunderte Male pro Sekunde. Mit mehreren Kernen laufen tatsächlich mehrere Prozesse gleichzeitig, das Prinzip bleibt dasselbe.'
                      : `${p} ist an der Reihe.`,
            array: { label: 'Zeitleiste des Prozessorkerns', cells: [...slots], showIndex: false, hi: [slots.length - 1] },
            frames: [{ name: 'Prozesse', vars: zustand(p, wartet) }],
          });
        });
        return steps;
      },
    },
  },

  exercises: [
    {
      kind: 'quiz',
      id: 'virtuell',
      title: 'Wessen Adresse?',
      question: 'Zwei Programme laufen gleichzeitig, und beide speichern einen Wert an der Adresse `0x1000`. Überschreiben sie sich gegenseitig?',
      options: [
        'Ja, der Arbeitsspeicher gibt es nur einmal.',
        'Nein. Jeder Prozess hat seinen eigenen **virtuellen Adressraum**. Das Betriebssystem bildet dieselbe virtuelle Adresse für jeden Prozess auf eine andere Stelle im echten Speicher ab.',
        'Nur, wenn beide in derselben Sprache geschrieben sind.',
        'Das Betriebssystem verbietet die Adresse 0x1000.',
      ],
      correct: 1,
      explain:
        'Mit **virtuellem Speicher** sieht jeder Prozess einen eigenen, scheinbar riesigen Speicher. Der Prozessor übersetzt bei jedem Zugriff blitzschnell (mit Hilfe der MMU und von Tabellen, die das Betriebssystem pflegt) in echte Adressen. Dadurch sind Prozesse voneinander abgeschottet: Ein Absturz in einem Programm reißt die anderen nicht mit. Ein Zugriff außerhalb des eigenen Bereichs endet mit dem bekannten *Segmentation fault*.',
    },
    {
      kind: 'quiz',
      id: 'syscall',
      title: 'Bitte, Betriebssystem',
      question: 'Was ist ein **Systemaufruf** (*system call*)?',
      options: [
        'Ein Anruf beim Support.',
        'Eine Anfrage eines Programms an das Betriebssystem, etwas zu tun, was es selbst nicht darf: Dateien öffnen, Daten ins Netz schicken, Speicher anfordern, einen neuen Prozess starten.',
        'Ein besonders schneller Funktionsaufruf innerhalb des Programms.',
        'Ein Befehl, der den Computer neu startet.',
      ],
      correct: 1,
      explain:
        'Programme laufen im eingeschränkten **Benutzermodus**. Für alles, was Hardware oder andere Prozesse betrifft, wechseln sie per Systemaufruf in den **Kernelmodus**, wo das Betriebssystem die Anfrage prüft und ausführt. `print` in Python, `printf` in C und `println!` in Rust landen am Ende alle beim Systemaufruf `write`.',
    },
  ],
};

export default lesson;
