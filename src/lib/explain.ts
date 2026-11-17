// Fehler-Erklärer: übersetzt häufige Compiler- und Laufzeitmeldungen in verständliches Deutsch.

import type { Lang } from '../../content/types.ts';

export interface Explanation {
  title: string;
  text: string;
  lesson?: string;
}

interface Rule extends Explanation {
  langs: Lang[];
  pattern: RegExp;
}

const RULES: Rule[] = [
  // ---------- Python ----------
  {
    langs: ['python'],
    pattern: /IndentationError|TabError/,
    title: 'Einrückung stimmt nicht',
    text: 'Python erkennt Blöcke an der Einrückung. Alle Zeilen eines Blocks (nach `if`, `for`, `def` …) müssen gleich weit eingerückt sein – üblich sind 4 Leerzeichen.',
    lesson: 'bedingungen',
  },
  {
    langs: ['python'],
    pattern: /NameError: name '(\w+)' is not defined/,
    title: 'Unbekannter Name',
    text: 'Du verwendest einen Namen, den Python nicht kennt. Meist ist es ein Tippfehler oder die Variable wurde noch nicht (oder nur in einer anderen Funktion) angelegt.',
    lesson: 'gueltigkeit',
  },
  {
    langs: ['python'],
    pattern: /TypeError: (can only concatenate|unsupported operand)/,
    title: 'Typen passen nicht zusammen',
    text: 'Du verknüpfst Werte unterschiedlicher Typen, etwa Text und Zahl. Wandle vorher um: `str(zahl)` macht Text, `int(text)` macht eine Zahl.',
    lesson: 'variablen',
  },
  {
    langs: ['python'],
    pattern: /SyntaxError/,
    title: 'Syntaxfehler',
    text: 'Python konnte die Zeile nicht lesen. Häufige Ursachen: fehlender Doppelpunkt nach `if`/`for`/`def`, eine nicht geschlossene Klammer oder ein fehlendes Anführungszeichen.',
  },
  {
    langs: ['python'],
    pattern: /IndexError: list index out of range/,
    title: 'Index außerhalb der Liste',
    text: 'Du greifst auf eine Position zu, die es nicht gibt. Eine Liste mit n Elementen hat die Positionen 0 bis n−1.',
    lesson: 'arrays',
  },
  {
    langs: ['python'],
    pattern: /KeyError/,
    title: 'Schlüssel nicht vorhanden',
    text: 'Das Dictionary enthält diesen Schlüssel nicht. Prüfe vorher mit `in` oder nutze `d.get(schluessel, standardwert)`.',
    lesson: 'maps',
  },
  {
    langs: ['python'],
    pattern: /ValueError: invalid literal for int\(\)/,
    title: 'Text lässt sich nicht in eine Zahl umwandeln',
    text: '`int(...)` hat etwas bekommen, das keine ganze Zahl ist – zum Beispiel eine leere Zeile oder zwei Zahlen auf einmal.',
  },
  {
    langs: ['python'],
    pattern: /RecursionError/,
    title: 'Rekursion endet nicht',
    text: 'Die Funktion ruft sich immer wieder selbst auf, ohne je den Basisfall zu erreichen.',
    lesson: 'rekursion',
  },
  {
    langs: ['python'],
    pattern: /ZeroDivisionError/,
    title: 'Division durch null',
    text: 'Durch null lässt sich nicht teilen. Prüfe den Teiler vorher mit einer Bedingung.',
  },

  // ---------- Java ----------
  {
    langs: ['java'],
    pattern: /error: ';' expected/,
    title: 'Semikolon fehlt',
    text: 'In Java endet jede Anweisung mit einem Semikolon. Schau in die gemeldete Zeile – oft fehlt es auch in der Zeile direkt davor.',
  },
  {
    langs: ['java'],
    pattern: /error: cannot find symbol/,
    title: 'Unbekannter Name',
    text: 'Der Compiler kennt diesen Namen nicht. Typische Ursachen: Tippfehler, falsche Groß-/Kleinschreibung, Variable nicht deklariert oder außerhalb ihres Blocks verwendet.',
    lesson: 'gueltigkeit',
  },
  {
    langs: ['java'],
    pattern: /error: incompatible types/,
    title: 'Typen passen nicht zusammen',
    text: 'Java prüft Typen schon beim Kompilieren. Der Wert rechts passt nicht zum Typ links – z. B. Kommazahl in `int` oder Text in Zahl.',
    lesson: 'variablen',
  },
  {
    langs: ['java'],
    pattern: /error: missing return statement/,
    title: 'Rückgabe fehlt',
    text: 'Eine Methode mit Rückgabetyp muss auf jedem möglichen Weg ein `return` erreichen.',
    lesson: 'funktionen',
  },
  {
    langs: ['java'],
    pattern: /might not have been initialized/,
    title: 'Variable ohne Startwert',
    text: 'Java lässt dich eine lokale Variable erst lesen, wenn ihr sicher ein Wert zugewiesen wurde.',
    lesson: 'variablen',
  },
  {
    langs: ['java'],
    pattern: /ArrayIndexOutOfBoundsException|IndexOutOfBoundsException/,
    title: 'Index außerhalb des Arrays',
    text: 'Ein Array mit n Elementen hat die Positionen 0 bis n−1. Prüfe die Grenzen deiner Schleife.',
    lesson: 'arrays',
  },
  {
    langs: ['java'],
    pattern: /NullPointerException/,
    title: 'Zugriff auf null',
    text: 'Die Variable zeigt auf kein Objekt (`null`), du rufst aber etwas darauf auf. Prüfe, wo sie ihren Wert bekommen sollte.',
    lesson: 'zeiger',
  },
  {
    langs: ['java'],
    pattern: /StackOverflowError/,
    title: 'Rekursion endet nicht',
    text: 'Die Methode ruft sich endlos selbst auf, bis der Aufrufstapel voll ist. Es fehlt ein erreichbarer Basisfall.',
    lesson: 'rekursion',
  },
  {
    langs: ['java'],
    pattern: /NoSuchElementException|InputMismatchException/,
    title: 'Eingabe passt nicht',
    text: 'Der `Scanner` hat keine (passende) Eingabe mehr gefunden. Lies genau so viele Werte, wie die Aufgabe liefert.',
  },

  // ---------- C / C++ ----------
  {
    langs: ['c', 'cpp'],
    pattern: /error: expected ';'/,
    title: 'Semikolon fehlt',
    text: 'Jede Anweisung endet mit einem Semikolon – auch die Definition einer `struct` oder `class` nach der schließenden Klammer.',
  },
  {
    langs: ['c', 'cpp'],
    pattern: /error: use of undeclared identifier/,
    title: 'Unbekannter Name',
    text: 'Der Name wurde nicht deklariert. Tippfehler? Fehlt ein `#include`? Oder liegt die Variable in einem anderen Block?',
    lesson: 'gueltigkeit',
  },
  {
    langs: ['c', 'cpp'],
    pattern: /call to undeclared (library )?function|implicit declaration of function/,
    title: 'Funktion unbekannt',
    text: 'Die Funktion ist an dieser Stelle noch nicht bekannt. Binde die passende Header-Datei ein (z. B. `<stdio.h>`, `<string.h>`) oder definiere die Funktion vor ihrem ersten Aufruf.',
    lesson: 'funktionen',
  },
  {
    langs: ['c', 'cpp'],
    pattern: /index -?\d+ out of bounds/,
    title: 'Zugriff außerhalb des Arrays',
    text: 'C prüft Array-Grenzen normalerweise nicht – hier hat es der Sanitizer bemerkt. Ein Array mit n Elementen hat die Positionen 0 bis n−1.',
    lesson: 'arrays',
  },
  {
    langs: ['c', 'cpp'],
    pattern: /heap-use-after-free/,
    title: 'Zugriff auf freigegebenen Speicher',
    text: 'Der Speicher wurde bereits mit `free`/`delete` zurückgegeben, wird aber noch benutzt (hängender Zeiger).',
    lesson: 'speicherverwaltung',
  },
  {
    langs: ['c', 'cpp'],
    pattern: /heap-buffer-overflow|stack-buffer-overflow/,
    title: 'Über das Ende des Speichers hinaus',
    text: 'Du liest oder schreibst hinter dem Ende eines Arrays oder reservierten Speicherblocks.',
    lesson: 'arrays',
  },
  {
    langs: ['c', 'cpp', 'rust'],
    pattern: /Undefined symbols|undefined reference|linker command failed|linking with `cc` failed/,
    title: 'Linker-Fehler',
    text: 'Der Code wurde übersetzt, aber beim Zusammenfügen fehlt die Definition einer Funktion. Sie ist zwar angekündigt (deklariert), aber nirgends geschrieben – oder ihr Name ist falsch geschrieben, oder eine Bibliothek fehlt.',
    lesson: 'linker',
  },
  {
    langs: ['c', 'cpp', 'rust'],
    pattern: /stack-overflow|overflowed its stack/,
    title: 'Stapelüberlauf',
    text: 'Zu viele Funktionsaufrufe sind gleichzeitig offen, der Stack ist voll. Fast immer ruft sich eine Funktion endlos selbst auf, weil der Basisfall fehlt oder nie erreicht wird.',
    lesson: 'rekursion',
  },
  {
    langs: ['c', 'cpp'],
    pattern: /null pointer|SEGV|Segmentation fault/i,
    title: 'Ungültiger Zeiger',
    text: 'Das Programm hat auf eine Adresse zugegriffen, die ihm nicht gehört – meist ein Null-Zeiger oder ein nicht initialisierter Zeiger.',
    lesson: 'zeiger',
  },
  {
    langs: ['c', 'cpp'],
    pattern: /signed integer overflow/,
    title: 'Zahl zu groß für den Typ',
    text: 'Das Ergebnis passt nicht mehr in den Ganzzahltyp. Ein `int` reicht meist nur bis etwa 2,1 Milliarden – nimm `long long` für größere Werte.',
    lesson: 'variablen',
  },
  {
    langs: ['c', 'cpp'],
    pattern: /warning: variable '\w+' is uninitialized|is used uninitialized/,
    title: 'Variable ohne Startwert',
    text: 'Eine lokale Variable hat in C/C++ ohne Zuweisung einen zufälligen Wert. Gib ihr beim Anlegen einen Startwert.',
    lesson: 'variablen',
  },
  {
    langs: ['c', 'cpp'],
    pattern: /format specifies type/,
    title: 'Platzhalter passt nicht zum Wert',
    text: 'Der Platzhalter in `printf`/`scanf` muss zum Typ passen: `%d` für `int`, `%lld` für `long long`, `%f` für `double` (bei `scanf`: `%lf`), `%s` für Text, `%c` für ein Zeichen.',
  },

  // ---------- Rust ----------
  {
    langs: ['rust'],
    pattern: /E0382/,
    title: 'Wert wurde bereits verschoben (E0382)',
    text: 'In Rust hat jeder Wert genau einen Besitzer. Nach `let b = a;` oder der Übergabe an eine Funktion gehört der Wert dem neuen Besitzer – `a` ist danach ungültig. Leihe stattdessen mit `&a` aus oder kopiere bewusst mit `.clone()`.',
    lesson: 'speicherverwaltung',
  },
  {
    langs: ['rust'],
    pattern: /E0384/,
    title: 'Variable ist nicht veränderlich (E0384)',
    text: 'Variablen sind in Rust standardmäßig unveränderlich. Schreibe `let mut name = …`, wenn du den Wert später ändern willst.',
    lesson: 'variablen',
  },
  {
    langs: ['rust'],
    pattern: /E0596/,
    title: 'Veränderliches Ausleihen nicht möglich (E0596)',
    text: 'Zum Ändern brauchst du eine veränderliche Variable (`let mut`) und eine veränderliche Referenz (`&mut`).',
    lesson: 'zeiger',
  },
  {
    langs: ['rust'],
    pattern: /E0499|E0502/,
    title: 'Ausleih-Regel verletzt',
    text: 'Zur selben Zeit sind entweder beliebig viele lesende Referenzen (`&`) oder genau eine schreibende (`&mut`) erlaubt – nie beides. Das verhindert, dass Daten unter dir verändert werden.',
    lesson: 'zeiger',
  },
  {
    langs: ['rust'],
    pattern: /E0308/,
    title: 'Typen passen nicht zusammen (E0308)',
    text: 'Rust wandelt Typen nie stillschweigend um. Wandle ausdrücklich um (z. B. `x as f64`, `text.parse::<i32>()`), oder prüfe, ob am Ende einer Funktion ein Semikolon zu viel den Rückgabewert verschluckt.',
    lesson: 'typsysteme',
  },
  {
    langs: ['rust'],
    pattern: /E0425/,
    title: 'Unbekannter Name (E0425)',
    text: 'Dieser Name existiert hier nicht. Tippfehler, oder die Variable lebt in einem anderen Block?',
    lesson: 'gueltigkeit',
  },
  {
    langs: ['rust'],
    pattern: /E0106|E0597|E0515/,
    title: 'Referenz lebt länger als ihr Wert',
    text: 'Eine Referenz darf nie länger existieren als der Wert, auf den sie zeigt. Gib den Wert selbst zurück (Besitz übergeben), statt eine Referenz auf etwas Lokales.',
    lesson: 'speicherverwaltung',
  },
  {
    langs: ['rust'],
    pattern: /index out of bounds/,
    title: 'Index außerhalb des Bereichs',
    text: 'Rust prüft jeden Zugriff. Ein Vektor mit n Elementen hat die Positionen 0 bis n−1.',
    lesson: 'arrays',
  },
  {
    langs: ['rust'],
    pattern: /called `(Option|Result)::unwrap\(\)` on a/,
    title: '`unwrap` auf einem leeren oder fehlerhaften Wert',
    text: '`unwrap()` bricht das Programm ab, wenn kein Wert da ist. Behandle den Fall mit `match`, `if let` oder `unwrap_or(...)`.',
    lesson: 'fehler',
  },
  {
    langs: ['rust'],
    pattern: /attempt to (add|subtract|multiply) with overflow/,
    title: 'Zahl zu groß für den Typ',
    text: 'Das Ergebnis passt nicht in den Ganzzahltyp. Rust bricht dann lieber ab, als falsch weiterzurechnen. Nimm einen größeren Typ wie `i64` oder `u64`.',
    lesson: 'variablen',
  },

  // ---------- Terminal ----------
  {
    langs: ['bash'],
    pattern: /command not found/,
    title: 'Befehl unbekannt',
    text: 'Die Shell kennt diesen Befehl nicht. Tippfehler? Groß- und Kleinschreibung zählen. Eigene Skripte startet man mit vorangestelltem `./` oder über `bash skript.sh`.',
    lesson: 'terminal-skripte',
  },
  {
    langs: ['bash'],
    pattern: /No such file or directory/,
    title: 'Datei oder Ordner nicht gefunden',
    text: 'Den Pfad gibt es (hier) nicht. Prüfe mit `pwd`, wo du gerade bist, und mit `ls`, was dort liegt. Pfade ohne führendes `/` gelten relativ zum aktuellen Ordner.',
    lesson: 'terminal-dateien',
  },
  {
    langs: ['bash'],
    pattern: /Is a directory/,
    title: 'Das ist ein Ordner',
    text: 'Der Befehl erwartet eine Datei, hat aber einen Ordner bekommen. Ganze Ordner kopiert oder löscht man mit der Option `-r` (rekursiv).',
    lesson: 'terminal-dateien',
  },
  {
    langs: ['bash'],
    pattern: /Permission denied/,
    title: 'Keine Berechtigung',
    text: 'Dir fehlt das Recht für diese Aktion. Ein Skript muss ausführbar sein: `chmod +x skript.sh`.',
    lesson: 'terminal-skripte',
  },
  {
    langs: ['bash'],
    pattern: /Operation not permitted/,
    title: 'Außerhalb des Übungsordners',
    text: 'Zu deiner Sicherheit dürfen Befehle hier nur innerhalb des Übungsordners schreiben. Auf deinem eigenen Rechner gäbe es diese Grenze nicht – dort lohnt es sich doppelt, vor `rm` genau hinzuschauen.',
  },
  {
    langs: ['bash'],
    pattern: /not a git repository/,
    title: 'Kein Git-Repository',
    text: 'In diesem Ordner (und in keinem darüber) gibt es kein Repository. Lege eins mit `git init` an oder wechsle mit `cd` in den Ordner des Projekts.',
    lesson: 'git-grundlagen',
  },
  {
    langs: ['bash'],
    pattern: /nothing (added )?to commit/,
    title: 'Nichts zum Committen',
    text: 'Ein Commit nimmt nur auf, was vorher mit `git add` in die Staging-Area gelegt wurde. Schau mit `git status` nach, was geändert ist.',
    lesson: 'git-grundlagen',
  },
  {
    langs: ['bash'],
    pattern: /CONFLICT|Automatic merge failed/,
    title: 'Merge-Konflikt',
    text: 'Beide Seiten haben dieselbe Stelle geändert, Git kann nicht entscheiden. Öffne die Datei, wähle zwischen den Abschnitten bei `<<<<<<<`, `=======` und `>>>>>>>`, entferne die Markierungen und schließe mit `git add` und `git commit` ab.',
    lesson: 'git-branches',
  },
  {
    langs: ['bash'],
    pattern: /rejected|non-fast-forward|fetch first/,
    title: 'Push abgelehnt',
    text: 'Auf dem Remote gibt es Commits, die du noch nicht hast. Hole sie zuerst mit `git pull` und versuche es dann erneut.',
    lesson: 'git-zusammenarbeit',
  },

  // ---------- SQL ----------
  {
    langs: ['sql'],
    pattern: /no such table/,
    title: 'Tabelle unbekannt',
    text: 'Diese Tabelle gibt es im Datensatz nicht. Schau dir oben die vorhandenen Tabellen an – Tippfehler im Namen?',
  },
  {
    langs: ['sql'],
    pattern: /no such column/,
    title: 'Spalte unbekannt',
    text: 'Diese Spalte existiert nicht. Prüfe den Namen, und denke daran: Text gehört in einfache Anführungszeichen (`\'Berlin\'`), sonst hält SQL ihn für einen Spaltennamen.',
  },
  {
    langs: ['sql'],
    pattern: /ambiguous column name/,
    title: 'Spaltenname mehrdeutig',
    text: 'Die Spalte gibt es in mehreren beteiligten Tabellen. Schreibe den Tabellennamen davor: `kunden.name`.',
    lesson: 'sql-join',
  },
  {
    langs: ['sql'],
    pattern: /syntax error/,
    title: 'Syntaxfehler',
    text: 'SQL konnte die Anweisung nicht lesen. Stimmt die Reihenfolge der Teile? `SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT`.',
  },
  {
    langs: ['sql'],
    pattern: /constraint failed/,
    title: 'Regel der Tabelle verletzt',
    text: 'Die Tabelle erlaubt diesen Wert nicht – etwa ein doppelter Primärschlüssel, ein fehlender Pflichtwert (`NOT NULL`) oder ein Verweis auf eine Zeile, die es nicht gibt.',
    lesson: 'sql-entwurf',
  },
  {
    langs: ['sql'],
    pattern: /misuse of aggregate/,
    title: 'Aggregatfunktion an falscher Stelle',
    text: '`COUNT`, `SUM` & Co. dürfen nicht in `WHERE` stehen, weil dort noch einzelne Zeilen gefiltert werden. Bedingungen auf Gruppen gehören in `HAVING`.',
    lesson: 'sql-gruppen',
  },
];

export function explain(lang: Lang, output: string): Explanation[] {
  const found: Explanation[] = [];
  for (const rule of RULES) {
    if (rule.langs.includes(lang) && rule.pattern.test(output)) {
      found.push({ title: rule.title, text: rule.text, lesson: rule.lesson });
    }
    if (found.length >= 2) break;
  }
  return found;
}
