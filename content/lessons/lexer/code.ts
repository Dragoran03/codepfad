import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';

const lesson: LessonCode = {
  exercises: [
    {
      kind: 'code',
      id: 'tokenizer',
      title: 'Ein eigener Tokenizer',
      prompt:
        'Schreibe einen kleinen Lexer für Rechenausdrücke. Er liest eine Zeile und gibt jedes Token in einer eigenen Zeile aus:\n- `ZAHL 12` für eine Folge von Ziffern\n- `NAME summe` für einen Namen aus Buchstaben\n- `OP +` für einen der Operatoren `+ - * /`\n- `KLAMMER (` für runde Klammern\n\nLeerzeichen werden übersprungen. Der Startcode behandelt jedes **Zeichen** als eigenes Token – das ist falsch, sobald eine Zahl oder ein Name aus mehreren Zeichen besteht.',
      tests: [
        { name: 'x+12*(y-3)', stdin: 'x+12*(y-3)\n', expected: 'NAME x\nOP +\nZAHL 12\nOP *\nKLAMMER (\nNAME y\nOP -\nZAHL 3\nKLAMMER )\n' },
        { name: 'Mit Leerzeichen', stdin: 'summe / 250\n', expected: 'NAME summe\nOP /\nZAHL 250\n' },
        { name: 'Nur eine Zahl', stdin: '2024\n', expected: 'ZAHL 2024\n' },
      ],
      hints: [
        'Wenn du auf eine Ziffer triffst, lies mit einer inneren Schleife weiter, **solange** Ziffern kommen. Erst dann gib das ganze Token aus.',
        'Für Namen genauso, nur mit Buchstaben. Achte darauf, den Index in der inneren Schleife weiterzuzählen, damit die äußere Schleife hinter dem Token weitermacht.',
      ],
      code: {
        python: raw`
text = input()
i = 0
while i < len(text):
    c = text[i]
#:solution
    if c.isdigit():
        start = i
        while i < len(text) and text[i].isdigit():
            i += 1
        print("ZAHL", text[start:i])
        continue
    if c.isalpha():
        start = i
        while i < len(text) and text[i].isalpha():
            i += 1
        print("NAME", text[start:i])
        continue
#:starter
    if c.isdigit():
        print("ZAHL", c)
    elif c.isalpha():
        print("NAME", c)
#:end
    if c in "+-*/":
        print("OP", c)
    elif c in "()":
        print("KLAMMER", c)
    i += 1
`,
        java: raw`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        String text = new Scanner(System.in).nextLine();
        int i = 0;
        while (i < text.length()) {
            char c = text.charAt(i);
//:solution
            if (Character.isDigit(c)) {
                int start = i;
                while (i < text.length() && Character.isDigit(text.charAt(i))) {
                    i++;
                }
                System.out.println("ZAHL " + text.substring(start, i));
                continue;
            }
            if (Character.isLetter(c)) {
                int start = i;
                while (i < text.length() && Character.isLetter(text.charAt(i))) {
                    i++;
                }
                System.out.println("NAME " + text.substring(start, i));
                continue;
            }
//:starter
            if (Character.isDigit(c)) {
                System.out.println("ZAHL " + c);
            } else if (Character.isLetter(c)) {
                System.out.println("NAME " + c);
            }
//:end
            if ("+-*/".indexOf(c) >= 0) {
                System.out.println("OP " + c);
            } else if (c == '(' || c == ')') {
                System.out.println("KLAMMER " + c);
            }
            i++;
        }
    }
}
`,
        c: raw`
#include <ctype.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    char text[1000];
    if (!fgets(text, sizeof text, stdin)) {
        return 0;
    }
    int n = strlen(text);
    int i = 0;
    while (i < n) {
        char c = text[i];
//:solution
        if (isdigit((unsigned char) c)) {
            int start = i;
            while (i < n && isdigit((unsigned char) text[i])) {
                i++;
            }
            printf("ZAHL %.*s\n", i - start, text + start);
            continue;
        }
        if (isalpha((unsigned char) c)) {
            int start = i;
            while (i < n && isalpha((unsigned char) text[i])) {
                i++;
            }
            printf("NAME %.*s\n", i - start, text + start);
            continue;
        }
//:starter
        if (isdigit((unsigned char) c)) {
            printf("ZAHL %c\n", c);
        } else if (isalpha((unsigned char) c)) {
            printf("NAME %c\n", c);
        }
//:end
        if (strchr("+-*/", c) && c != '\0') {
            printf("OP %c\n", c);
        } else if (c == '(' || c == ')') {
            printf("KLAMMER %c\n", c);
        }
        i++;
    }
    return 0;
}
`,
        cpp: raw`
#include <cctype>
#include <iostream>
#include <string>

int main() {
    std::string text;
    std::getline(std::cin, text);
    std::size_t i = 0;
    while (i < text.size()) {
        char c = text[i];
//:solution
        if (std::isdigit(static_cast<unsigned char>(c))) {
            std::size_t start = i;
            while (i < text.size() && std::isdigit(static_cast<unsigned char>(text[i]))) {
                i++;
            }
            std::cout << "ZAHL " << text.substr(start, i - start) << "\n";
            continue;
        }
        if (std::isalpha(static_cast<unsigned char>(c))) {
            std::size_t start = i;
            while (i < text.size() && std::isalpha(static_cast<unsigned char>(text[i]))) {
                i++;
            }
            std::cout << "NAME " << text.substr(start, i - start) << "\n";
            continue;
        }
//:starter
        if (std::isdigit(static_cast<unsigned char>(c))) {
            std::cout << "ZAHL " << c << "\n";
        } else if (std::isalpha(static_cast<unsigned char>(c))) {
            std::cout << "NAME " << c << "\n";
        }
//:end
        if (std::string("+-*/").find(c) != std::string::npos) {
            std::cout << "OP " << c << "\n";
        } else if (c == '(' || c == ')') {
            std::cout << "KLAMMER " << c << "\n";
        }
        i++;
    }
    return 0;
}
`,
        rust: raw`
use std::io;

fn main() {
    let mut zeile = String::new();
    io::stdin().read_line(&mut zeile).unwrap();
    let text: Vec<char> = zeile.trim_end().chars().collect();
    let mut i = 0;
    while i < text.len() {
        let c = text[i];
//:solution
        if c.is_ascii_digit() {
            let start = i;
            while i < text.len() && text[i].is_ascii_digit() {
                i += 1;
            }
            println!("ZAHL {}", text[start..i].iter().collect::<String>());
            continue;
        }
        if c.is_alphabetic() {
            let start = i;
            while i < text.len() && text[i].is_alphabetic() {
                i += 1;
            }
            println!("NAME {}", text[start..i].iter().collect::<String>());
            continue;
        }
//:starter
        if c.is_ascii_digit() {
            println!("ZAHL {}", c);
        } else if c.is_alphabetic() {
            println!("NAME {}", c);
        }
//:end
        if "+-*/".contains(c) {
            println!("OP {}", c);
        } else if c == '(' || c == ')' {
            println!("KLAMMER {}", c);
        }
        i += 1;
    }
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'kommentar',
      title: 'Was bleibt übrig?',
      question: 'Was passiert im Lexer typischerweise mit Leerzeichen und Kommentaren?',
      options: [
        'Sie werden zu eigenen Tokens, die der Parser auswerten muss.',
        'Sie werden übersprungen – für die Bedeutung des Programms spielen sie keine Rolle (mit Ausnahmen wie Pythons Einrückung).',
        'Sie werden in Maschinencode übersetzt.',
        'Sie führen zu einem Fehler.',
      ],
      correct: 1,
      explain:
        'Leerraum trennt Tokens, trägt aber meist keine Bedeutung: `x+1` und `x + 1` ergeben dieselben Tokens. Python ist die Ausnahme: Dort erzeugt der Lexer aus der Einrückung eigene Tokens (`INDENT`, `DEDENT`), die für den Parser so wichtig sind wie geschweifte Klammern in anderen Sprachen.',
    },
  ],
};

export default lesson;
