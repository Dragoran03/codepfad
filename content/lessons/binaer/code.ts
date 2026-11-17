import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';

const lesson: LessonCode = {
  // "ueberlauf" endet in C, C++ und Rust absichtlich mit einem Fehler.
  noVerify: ['ueberlauf'],

  snippets: {
    darstellung: {
      python: raw`
print(bin(42))        # binär
print(hex(255))       # hexadezimal
print(0b101010)       # Binärzahl im Code
print(ord("A"))       # Zeichen -> Nummer
print(chr(97))        # Nummer -> Zeichen
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        System.out.println(Integer.toBinaryString(42));  // binär
        System.out.println(Integer.toHexString(255));    // hexadezimal
        System.out.println(0b101010);                    // Binärzahl im Code
        System.out.println((int) 'A');                   // Zeichen -> Nummer
        System.out.println((char) 97);                   // Nummer -> Zeichen
    }
}
`,
      c: raw`
#include <stdio.h>

int main(void) {
    // Binär ausgeben: Bit für Bit, vom höchsten zum niedrigsten.
    for (int stelle = 7; stelle >= 0; stelle--) {
        printf("%d", (42 >> stelle) & 1);
    }
    printf("\n");

    printf("%x\n", 255);    // hexadezimal
    printf("%d\n", 0x2A);   // Hex-Zahl im Code
    printf("%d\n", 'A');    // Zeichen -> Nummer
    printf("%c\n", 97);     // Nummer -> Zeichen
    return 0;
}
`,
      cpp: raw`
#include <bitset>
#include <iostream>

int main() {
    std::cout << std::bitset<8>(42) << "\n";        // binär
    std::cout << std::hex << 255 << std::dec << "\n";  // hexadezimal
    std::cout << 0b101010 << "\n";                  // Binärzahl im Code
    std::cout << static_cast<int>('A') << "\n";     // Zeichen -> Nummer
    std::cout << static_cast<char>(97) << "\n";     // Nummer -> Zeichen
    return 0;
}
`,
      rust: raw`
fn main() {
    println!("{:b}", 42);          // binär
    println!("{:x}", 255);         // hexadezimal
    println!("{}", 0b101010);      // Binärzahl im Code
    println!("{}", 'A' as u32);    // Zeichen -> Nummer
    println!("{}", 97u8 as char);  // Nummer -> Zeichen
}
`,
    },
    ueberlauf: {
      python: raw`
groesste = 2147483647   # größter Wert einer 32-Bit-Zahl mit Vorzeichen
print(groesste + 1)     # Python-Zahlen wachsen einfach weiter
`,
      java: raw`
public class Main {
    public static void main(String[] args) {
        int groesste = Integer.MAX_VALUE;   // 2147483647
        System.out.println(groesste + 1);   // springt stillschweigend ins Negative
    }
}
`,
      c: raw`
#include <limits.h>
#include <stdio.h>

int main(void) {
    int groesste = INT_MAX;         // 2147483647
    printf("%d\n", groesste + 1);   // in C nicht definiert – das Prüfwerkzeug schlägt an
    return 0;
}
`,
      cpp: raw`
#include <climits>
#include <iostream>

int main() {
    int groesste = INT_MAX;             // 2147483647
    std::cout << groesste + 1 << "\n";  // in C++ nicht definiert – das Prüfwerkzeug schlägt an
    return 0;
}
`,
      rust: raw`
fn main() {
    let groesste: i32 = i32::MAX;   // 2147483647
    println!("{}", groesste + 1);   // Rust weigert sich
}
`,
    },
  },

  exercises: [
    {
      kind: 'code',
      id: 'binaer',
      title: 'Von Dezimal nach Binär',
      prompt:
        'Wandle die eingelesene Zahl (mindestens 1) in ihre Binärdarstellung um, ohne eine fertige Bibliotheksfunktion zu benutzen.\n\nDas Verfahren: Teile die Zahl wiederholt durch 2 und notiere jeweils den Rest. Die Reste ergeben – **von hinten nach vorn** gelesen – die Binärzahl. Beispiel: 10 → Reste 0, 1, 0, 1 → `1010`.',
      tests: [
        { name: '10', stdin: '10\n', expected: '1010\n' },
        { name: '1', stdin: '1\n', expected: '1\n' },
        { name: '255', stdin: '255\n', expected: '11111111\n' },
        { name: '6', stdin: '6\n', expected: '110\n' },
        { name: '1024', stdin: '1024\n', expected: '10000000000\n' },
      ],
      hints: [
        'Du brauchst eine Schleife, die läuft, solange die Zahl größer als 0 ist.',
        'In jedem Durchlauf: Rest (`zahl % 2`) merken, dann die Zahl ganzzahlig durch 2 teilen. Da die Reste rückwärts gelesen werden, setze jede neue Ziffer **vor** die bisherigen.',
      ],
      code: {
        python: raw`
zahl = int(input())
bits = ""

#:solution
while zahl > 0:
    bits = str(zahl % 2) + bits
    zahl = zahl // 2
#:starter
# Hänge die Ziffern vorn an bits an. str(...) macht aus einer Zahl Text.
#:end

print(bits)
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int zahl = in.nextInt();
        String bits = "";

//:solution
        while (zahl > 0) {
            bits = (zahl % 2) + bits;
            zahl = zahl / 2;
        }
//:starter
        // Hänge die Ziffern vorn an bits an.
//:end

        System.out.println(bits);
    }
}
`,
        c: raw`
#include <stdio.h>

int main(void) {
    int zahl;
    scanf("%d", &zahl);
    int ziffern[32];
    int anzahl = 0;

//:solution
    while (zahl > 0) {
        ziffern[anzahl] = zahl % 2;
        anzahl++;
        zahl = zahl / 2;
    }
//:starter
    // Lege die Reste nacheinander in ziffern ab und zähle anzahl mit.
//:end

    // Die Ziffern rückwärts ausgeben.
    for (int i = anzahl - 1; i >= 0; i--) {
        printf("%d", ziffern[i]);
    }
    printf("\n");
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <string>

int main() {
    int zahl;
    std::cin >> zahl;
    std::string bits = "";

//:solution
    while (zahl > 0) {
        bits = std::to_string(zahl % 2) + bits;
        zahl = zahl / 2;
    }
//:starter
    // Hänge die Ziffern vorn an bits an. std::to_string(...) macht aus einer Zahl Text.
//:end

    std::cout << bits << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let mut zahl: u32 = zeile.trim().parse().unwrap();
    let mut bits = String::new();

//:solution
    while zahl > 0 {
        bits = format!("{}{}", zahl % 2, bits);
        zahl = zahl / 2;
    }
//:starter
    // Hänge die Ziffern vorn an bits an: bits = format!("{}{}", ziffer, bits);
    zahl = zahl + 0;
    bits = bits + "";
//:end

    println!("{}", bits);
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'byte',
      title: 'Wie viel passt hinein?',
      question: 'Wie viele verschiedene Werte lassen sich mit einem Byte (8 Bit) darstellen?',
      options: ['8', '16', '256', '1024'],
      correct: 2,
      explain:
        'Jedes zusätzliche Bit verdoppelt die Zahl der Möglichkeiten: 2 · 2 · 2 · 2 · 2 · 2 · 2 · 2 = 256. Ohne Vorzeichen sind das die Werte 0 bis 255. Mit 32 Bit sind es gut 4 Milliarden, mit 64 Bit etwa 18 Trillionen.',
    },
    {
      kind: 'quiz',
      id: 'hex',
      title: 'Hexadezimal lesen',
      question: 'Farben werden im Web oft als Hex-Werte geschrieben, etwa `#FF0000`. Welchen Dezimalwert hat das Byte `FF`?',
      options: ['15', '100', '255', '1515'],
      correct: 2,
      explain:
        'Eine Hex-Ziffer steht für genau vier Bit; `F` ist 15, also `1111`. Zwei Ziffern ergeben ein Byte: `FF` ist 15 · 16 + 15 = 255, der größte Wert eines Bytes. `#FF0000` heißt also: Rot voll aufgedreht, Grün und Blau aus.',
    },
  ],
};

export default lesson;
