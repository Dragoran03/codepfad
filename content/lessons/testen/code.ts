import { raw } from '../../types.ts';
import type { LessonCode } from '../../types.ts';

const lesson: LessonCode = {
  snippets: {
    framework: {
      python: raw`
# Datei test_rechner.py – ausgeführt mit: python -m pytest
from rechner import addiere

def test_addiere_positive_zahlen():
    assert addiere(2, 3) == 5

def test_addiere_negative_zahlen():
    assert addiere(-2, -3) == -5
`,
      java: raw`
// Datei RechnerTest.java – ausgeführt mit: mvn test (JUnit 5)
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class RechnerTest {
    @Test
    void addiertPositiveZahlen() {
        assertEquals(5, Rechner.addiere(2, 3));
    }

    @Test
    void addiertNegativeZahlen() {
        assertEquals(-5, Rechner.addiere(-2, -3));
    }
}
`,
      c: raw`
// Datei test_rechner.c – C hat kein eingebautes Test-Framework.
// Oft genügt assert; größere Projekte nutzen z. B. Unity oder CMocka.
#include <assert.h>
#include "rechner.h"

int main(void) {
    assert(addiere(2, 3) == 5);
    assert(addiere(-2, -3) == -5);
    return 0;
}
`,
      cpp: raw`
// Datei rechner_test.cpp – mit GoogleTest, ausgeführt über ctest
#include <gtest/gtest.h>
#include "rechner.h"

TEST(Rechner, AddiertPositiveZahlen) {
    EXPECT_EQ(addiere(2, 3), 5);
}

TEST(Rechner, AddiertNegativeZahlen) {
    EXPECT_EQ(addiere(-2, -3), -5);
}
`,
      rust: raw`
// In derselben Datei wie der Code – ausgeführt mit: cargo test
fn addiere(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn addiert_positive_zahlen() {
        assert_eq!(addiere(2, 3), 5);
    }

    #[test]
    fn addiert_negative_zahlen() {
        assert_eq!(addiere(-2, -3), -5);
    }
}
`,
    },
  },
  fragments: ['framework'],

  exercises: [
    {
      kind: 'code',
      id: 'fizzbuzz',
      title: 'Gegen Tests entwickeln',
      prompt:
        'Hier ist es umgekehrt als sonst: Die **Tests stehen schon im Programm**, die Funktion fehlt. So arbeitet man bei *Test-Driven Development*: erst festlegen, was richtig ist, dann den Code schreiben, bis alle Tests grün sind.\n\nDie Funktion `fizzbuzz(n)` soll liefern:\n- `Fizz`, wenn n durch 3 teilbar ist,\n- `Buzz`, wenn n durch 5 teilbar ist,\n- `FizzBuzz`, wenn beides gilt,\n- sonst die Zahl selbst als Text.\n\nFühre das Programm aus, lies die Meldungen der fehlschlagenden Tests und verbessere die Funktion, bis alle bestehen.',
      tests: [{ name: 'Alle eingebauten Tests', expected: '6 von 6 Tests bestanden\n' }],
      hints: [
        'Die Reihenfolge der Prüfungen ist entscheidend: Was passiert bei 15, wenn du zuerst auf „durch 3 teilbar" prüfst?',
        'Prüfe den Fall „durch 3 **und** durch 5 teilbar" (also durch 15) zuerst.',
      ],
      code: {
        python: raw`
def fizzbuzz(n):
#:solution
    if n % 15 == 0:
        return "FizzBuzz"
    if n % 3 == 0:
        return "Fizz"
    if n % 5 == 0:
        return "Buzz"
    return str(n)
#:starter
    if n % 3 == 0:
        return "Fizz"
    return str(n)
#:end

# ---- Tests ----
faelle = [(1, "1"), (3, "Fizz"), (5, "Buzz"), (9, "Fizz"), (10, "Buzz"), (15, "FizzBuzz")]
bestanden = 0
for eingabe, erwartet in faelle:
    ergebnis = fizzbuzz(eingabe)
    if ergebnis == erwartet:
        bestanden += 1
    else:
        print(f"FEHLER: fizzbuzz({eingabe}) liefert {ergebnis!r}, erwartet {erwartet!r}")
print(f"{bestanden} von {len(faelle)} Tests bestanden")
`,
        java: raw`
public class Main {
    static String fizzbuzz(int n) {
//:solution
        if (n % 15 == 0) {
            return "FizzBuzz";
        }
        if (n % 3 == 0) {
            return "Fizz";
        }
        if (n % 5 == 0) {
            return "Buzz";
        }
        return String.valueOf(n);
//:starter
        if (n % 3 == 0) {
            return "Fizz";
        }
        return String.valueOf(n);
//:end
    }

    // ---- Tests ----
    public static void main(String[] args) {
        int[] eingaben = {1, 3, 5, 9, 10, 15};
        String[] erwartet = {"1", "Fizz", "Buzz", "Fizz", "Buzz", "FizzBuzz"};
        int bestanden = 0;
        for (int i = 0; i < eingaben.length; i++) {
            String ergebnis = fizzbuzz(eingaben[i]);
            if (ergebnis.equals(erwartet[i])) {
                bestanden++;
            } else {
                System.out.println("FEHLER: fizzbuzz(" + eingaben[i] + ") liefert \"" + ergebnis + "\", erwartet \"" + erwartet[i] + "\"");
            }
        }
        System.out.println(bestanden + " von " + eingaben.length + " Tests bestanden");
    }
}
`,
        c: raw`
#include <stdio.h>
#include <string.h>

// Schreibt das Ergebnis in puffer (mindestens 16 Zeichen groß).
void fizzbuzz(int n, char *puffer) {
//:solution
    if (n % 15 == 0) {
        strcpy(puffer, "FizzBuzz");
    } else if (n % 3 == 0) {
        strcpy(puffer, "Fizz");
    } else if (n % 5 == 0) {
        strcpy(puffer, "Buzz");
    } else {
        sprintf(puffer, "%d", n);
    }
//:starter
    if (n % 3 == 0) {
        strcpy(puffer, "Fizz");
    } else {
        sprintf(puffer, "%d", n);
    }
//:end
}

// ---- Tests ----
int main(void) {
    int eingaben[] = {1, 3, 5, 9, 10, 15};
    const char *erwartet[] = {"1", "Fizz", "Buzz", "Fizz", "Buzz", "FizzBuzz"};
    int bestanden = 0;
    for (int i = 0; i < 6; i++) {
        char ergebnis[16];
        fizzbuzz(eingaben[i], ergebnis);
        if (strcmp(ergebnis, erwartet[i]) == 0) {
            bestanden++;
        } else {
            printf("FEHLER: fizzbuzz(%d) liefert \"%s\", erwartet \"%s\"\n", eingaben[i], ergebnis, erwartet[i]);
        }
    }
    printf("%d von 6 Tests bestanden\n", bestanden);
    return 0;
}
`,
        cpp: raw`
#include <iostream>
#include <string>
#include <vector>

std::string fizzbuzz(int n) {
//:solution
    if (n % 15 == 0) {
        return "FizzBuzz";
    }
    if (n % 3 == 0) {
        return "Fizz";
    }
    if (n % 5 == 0) {
        return "Buzz";
    }
    return std::to_string(n);
//:starter
    if (n % 3 == 0) {
        return "Fizz";
    }
    return std::to_string(n);
//:end
}

// ---- Tests ----
int main() {
    std::vector<std::pair<int, std::string>> faelle = {
        {1, "1"}, {3, "Fizz"}, {5, "Buzz"}, {9, "Fizz"}, {10, "Buzz"}, {15, "FizzBuzz"}};
    int bestanden = 0;
    for (const auto &[eingabe, erwartet] : faelle) {
        std::string ergebnis = fizzbuzz(eingabe);
        if (ergebnis == erwartet) {
            bestanden++;
        } else {
            std::cout << "FEHLER: fizzbuzz(" << eingabe << ") liefert \"" << ergebnis << "\", erwartet \"" << erwartet << "\"\n";
        }
    }
    std::cout << bestanden << " von " << faelle.size() << " Tests bestanden\n";
    return 0;
}
`,
        rust: raw`
fn fizzbuzz(n: u32) -> String {
//:solution
    if n % 15 == 0 {
        return "FizzBuzz".to_string();
    }
    if n % 3 == 0 {
        return "Fizz".to_string();
    }
    if n % 5 == 0 {
        return "Buzz".to_string();
    }
    n.to_string()
//:starter
    if n % 3 == 0 {
        return "Fizz".to_string();
    }
    n.to_string()
//:end
}

// ---- Tests ----
fn main() {
    let faelle = [(1, "1"), (3, "Fizz"), (5, "Buzz"), (9, "Fizz"), (10, "Buzz"), (15, "FizzBuzz")];
    let mut bestanden = 0;
    for (eingabe, erwartet) in faelle {
        let ergebnis = fizzbuzz(eingabe);
        if ergebnis == erwartet {
            bestanden += 1;
        } else {
            println!("FEHLER: fizzbuzz({}) liefert {:?}, erwartet {:?}", eingabe, ergebnis, erwartet);
        }
    }
    println!("{} von {} Tests bestanden", bestanden, faelle.len());
}
`,
      },
    },
    {
      kind: 'quiz',
      id: 'randfaelle',
      title: 'Gute Testfälle',
      question: 'Du testest eine Funktion, die den Durchschnitt einer Liste berechnet. Welche Auswahl an Testfällen ist am wertvollsten?',
      options: [
        'Zehn Listen mit jeweils fünf positiven Zahlen.',
        'Eine normale Liste, eine Liste mit einem Element, eine leere Liste und eine mit negativen Zahlen.',
        'Eine einzige, sehr lange Liste.',
        'Keine – der Code ist offensichtlich richtig.',
      ],
      correct: 1,
      explain:
        'Fehler verstecken sich an den **Rändern**: leere Eingaben, ein einziges Element, null, negative Werte, sehr große Werte. Zehn ähnliche Tests prüfen zehnmal dasselbe. Und was passiert eigentlich bei der leeren Liste – Division durch null? Genau solche Fragen bringt ein guter Test ans Licht, bevor ein Nutzer sie stellt.',
    },
    {
      kind: 'quiz',
      id: 'pyramide',
      title: 'Die Testpyramide',
      question: 'Was besagt die „Testpyramide"?',
      options: [
        'Man sollte mit den schwierigsten Tests anfangen.',
        'Viele schnelle Unit-Tests für einzelne Funktionen, weniger Integrationstests für das Zusammenspiel, und nur wenige langsame End-to-End-Tests für das ganze System.',
        'Tests sollten in Form einer Pyramide eingerückt werden.',
        'Jede Funktion braucht genau drei Tests.',
      ],
      correct: 1,
      explain:
        'Unit-Tests laufen in Millisekunden und zeigen genau, wo etwas kaputt ist. End-to-End-Tests (etwa ein simulierter Nutzer, der durch eine Webseite klickt) prüfen das Gesamtbild, sind aber langsam und bei Fehlschlag schwer zu deuten. Die Mischung macht es – mit dem Schwerpunkt auf der breiten, schnellen Basis.',
    },
  ],
};

export default lesson;
