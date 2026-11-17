import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';

const lesson: LessonCode = {
  exercises: [
    {
      kind: 'code',
      id: 'gleiches-netz',
      title: 'Liegen beide im selben Netz?',
      prompt:
        'Das Programm liest zwei IPv4-Adressen und eine Präfixlänge, z. B. `192.168.1.20 192.168.1.200 24`. Gib zuerst die **Netzadresse** der ersten Adresse mit Präfix aus (`192.168.1.0/24`) und dann `gleiches Netz` oder `anderes Netz`.\n\nDas Umwandeln der Adressen in 32-Bit-Zahlen ist vorgegeben. Es fehlen die Netzmaske und der Vergleich.',
      tests: [
        { name: '/24, gleiches Netz', stdin: '192.168.1.20 192.168.1.200 24\n', expected: '192.168.1.0/24\ngleiches Netz\n' },
        { name: '/23, anderes Netz', stdin: '10.0.5.1 10.0.6.1 23\n', expected: '10.0.4.0/23\nanderes Netz\n' },
        { name: '/16, gleiches Netz', stdin: '172.16.0.1 172.16.255.254 16\n', expected: '172.16.0.0/16\ngleiches Netz\n' },
        { name: '/30', stdin: '192.168.0.5 192.168.0.9 30\n', expected: '192.168.0.4/30\nanderes Netz\n' },
      ],
      hints: [
        'Die Maske hat vorne `prefix` Einsen und hinten Nullen. Eine Möglichkeit: 32 Einsen (`0xFFFFFFFF`) um `32 - prefix` Stellen nach links schieben – und auf 32 Bit begrenzen.',
        'Netzadresse = Adresse UND Maske (`&`). Zwei Adressen liegen im selben Netz, wenn ihre Netzadressen gleich sind.',
      ],
      code: {
        python: raw`
def zahl(ip):
    a, b, c, d = map(int, ip.split("."))
    return (a << 24) | (b << 16) | (c << 8) | d

def text(z):
    return ".".join(str((z >> s) & 255) for s in (24, 16, 8, 0))

ip1, ip2, prefix = input().split()
a, b, prefix = zahl(ip1), zahl(ip2), int(prefix)

#:solution
maske = (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF
netz = a & maske
gleich = (b & maske) == netz
#:starter
maske = 0xFFFFFFFF
netz = a
gleich = a == b
#:end

print(f"{text(netz)}/{prefix}")
print("gleiches Netz" if gleich else "anderes Netz")
`,
        java: raw`
import java.util.Scanner;

public class Main {
    static long zahl(String ip) {
        long z = 0;
        for (String teil : ip.split("\\.")) {
            z = (z << 8) | Long.parseLong(teil);
        }
        return z;
    }

    static String text(long z) {
        return ((z >> 24) & 255) + "." + ((z >> 16) & 255) + "." + ((z >> 8) & 255) + "." + (z & 255);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        long a = zahl(in.next());
        long b = zahl(in.next());
        int prefix = in.nextInt();

//:solution
        long maske = (0xFFFFFFFFL << (32 - prefix)) & 0xFFFFFFFFL;
        long netz = a & maske;
        boolean gleich = (b & maske) == netz;
//:starter
        long maske = 0xFFFFFFFFL;
        long netz = a;
        boolean gleich = a == b;
//:end

        System.out.println(text(netz) + "/" + prefix);
        System.out.println(gleich ? "gleiches Netz" : "anderes Netz");
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

int main(void) {
    char ip1[32], ip2[32];
    int prefix;
    scanf("%31s %31s %d", ip1, ip2, &prefix);
    uint32_t a = zahl(ip1), b = zahl(ip2);

//:solution
    uint32_t maske = 0xFFFFFFFFu << (32 - prefix);
    uint32_t netz = a & maske;
    int gleich = (b & maske) == netz;
//:starter
    uint32_t maske = 0xFFFFFFFFu;
    uint32_t netz = a;
    int gleich = a == b;
//:end
    (void)maske;

    printf("%u.%u.%u.%u/%d\n", netz >> 24, (netz >> 16) & 255, (netz >> 8) & 255, netz & 255, prefix);
    printf("%s\n", gleich ? "gleiches Netz" : "anderes Netz");
    return 0;
}
`,
        cpp: raw`
#include <cstdint>
#include <cstdio>
#include <iostream>
#include <sstream>
#include <string>

std::uint32_t zahl(const std::string &ip) {
    std::istringstream s(ip);
    std::uint32_t z = 0;
    std::string teil;
    while (std::getline(s, teil, '.')) {
        z = (z << 8) | static_cast<std::uint32_t>(std::stoi(teil));
    }
    return z;
}

int main() {
    std::string ip1, ip2;
    int prefix;
    std::cin >> ip1 >> ip2 >> prefix;
    std::uint32_t a = zahl(ip1), b = zahl(ip2);

//:solution
    std::uint32_t maske = 0xFFFFFFFFu << (32 - prefix);
    std::uint32_t netz = a & maske;
    bool gleich = (b & maske) == netz;
//:starter
    std::uint32_t maske = 0xFFFFFFFFu;
    std::uint32_t netz = a;
    bool gleich = a == b;
//:end
    (void)maske;

    std::printf("%u.%u.%u.%u/%d\n", netz >> 24, (netz >> 16) & 255, (netz >> 8) & 255, netz & 255, prefix);
    std::cout << (gleich ? "gleiches Netz" : "anderes Netz") << "\n";
    return 0;
}
`,
        rust: raw`
use std::io;

fn zahl(ip: &str) -> u32 {
    ip.split('.').fold(0, |z, teil| (z << 8) | teil.parse::<u32>().unwrap())
}

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let teile: Vec<&str> = zeile.split_whitespace().collect();
    let (a, b) = (zahl(teile[0]), zahl(teile[1]));
    let prefix: u32 = teile[2].parse().unwrap();

//:solution
    let maske: u32 = u32::MAX << (32 - prefix);
    let netz = a & maske;
    let gleich = (b & maske) == netz;
//:starter
    let maske: u32 = u32::MAX;
    let netz = a;
    let gleich = a == b;
//:end
    let _ = maske;

    println!("{}.{}.{}.{}/{}", netz >> 24, (netz >> 16) & 255, (netz >> 8) & 255, netz & 255, prefix);
    println!("{}", if gleich { "gleiches Netz" } else { "anderes Netz" });
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'privat',
      title: 'Private Adressen',
      question: 'Dein Laptop zu Hause hat die Adresse `192.168.178.23`, der Laptop deiner Nachbarin dieselbe. Wie kann das gehen?',
      options: [
        'Gar nicht – eine der beiden Adressen ist ungültig.',
        '`192.168.x.x` ist ein **privater** Bereich, der nur innerhalb eines lokalen Netzes gilt und überall wiederverwendet wird. Ins Internet gehen beide über ihren Router, der eine eigene öffentliche Adresse hat und die Adressen umschreibt (NAT).',
        'Das Internet erkennt sie an der Hausnummer.',
        'Weil IPv4-Adressen nur für eine Stunde gelten.',
      ],
      correct: 1,
      explain:
        'IPv4 hat nur rund 4,3 Milliarden Adressen – zu wenige für alle Geräte der Welt. Deshalb sind `10.0.0.0/8`, `172.16.0.0/12` und `192.168.0.0/16` für private Netze reserviert. Der Router übersetzt bei jeder Verbindung die private Absenderadresse in seine öffentliche (*Network Address Translation*). IPv6 löst das Problem grundsätzlich: Mit 2¹²⁸ Adressen kann jedes Gerät eine eigene, weltweit eindeutige bekommen.',
    },
  ],
};

export default lesson;
