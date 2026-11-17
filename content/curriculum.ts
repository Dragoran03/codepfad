import type { Track } from './types.ts';

export interface LessonMeta {
  /** Entspricht dem Ordnernamen unter content/lessons/. */
  id: string;
  title: string;
  summary: string;
}

export interface Chapter {
  id: string;
  track: Track;
  title: string;
  summary: string;
  lessons: LessonMeta[];
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'erste-schritte',
    track: 'general',
    title: 'Erste Schritte',
    summary: 'Was ein Programm ist, wie es ausgeführt wird und wie es sich Dinge merkt.',
    lessons: [
      { id: 'hallo-welt', title: 'Hallo Welt', summary: 'Dein erstes Programm – und was der Computer damit macht.' },
      { id: 'variablen', title: 'Variablen und Datentypen', summary: 'Werte benennen, speichern und verändern.' },
      { id: 'rechnen', title: 'Rechnen und Eingabe', summary: 'Operatoren, Ganzzahl-Division und Werte einlesen.' },
    ],
  },
  {
    id: 'kontrollfluss',
    track: 'general',
    title: 'Kontrollfluss',
    summary: 'Entscheidungen treffen, Dinge wiederholen und Code in Funktionen bündeln.',
    lessons: [
      { id: 'bedingungen', title: 'Bedingungen', summary: 'Mit if und else auf Situationen reagieren.' },
      { id: 'schleifen', title: 'Schleifen', summary: 'Anweisungen wiederholen mit while und for.' },
      { id: 'funktionen', title: 'Funktionen', summary: 'Code benennen, wiederverwenden und Werte zurückgeben.' },
      { id: 'gueltigkeit', title: 'Gültigkeitsbereiche', summary: 'Wo eine Variable lebt – und wo nicht.' },
    ],
  },
  {
    id: 'daten',
    track: 'general',
    title: 'Daten ordnen',
    summary: 'Text, Listen, Nachschlagetabellen und eigene Datentypen.',
    lessons: [
      { id: 'strings', title: 'Zeichenketten', summary: 'Text ist eine Folge von Zeichen.' },
      { id: 'arrays', title: 'Arrays und Listen', summary: 'Viele Werte unter einem Namen, per Index erreichbar.' },
      { id: 'maps', title: 'Maps und Dictionaries', summary: 'Werte über Schlüssel nachschlagen – und warum das so schnell ist.' },
      { id: 'structs', title: 'Eigene Datentypen', summary: 'Zusammengehörige Werte zu einem Ganzen bündeln.' },
    ],
  },
  {
    id: 'unter-der-haube',
    track: 'general',
    title: 'Unter der Haube',
    summary: 'Wo Daten im Speicher liegen und wie Sprachen damit umgehen.',
    lessons: [
      { id: 'binaer', title: 'Bits und Bytes', summary: 'Wie Zahlen und Zeichen im Speicher wirklich aussehen.' },
      { id: 'stack-heap', title: 'Stack und Heap', summary: 'Die zwei Speicherbereiche jedes Programms.' },
      { id: 'zeiger', title: 'Zeiger und Referenzen', summary: 'Wenn eine Variable nicht den Wert, sondern den Ort enthält.' },
      { id: 'speicherverwaltung', title: 'Speicher verwalten', summary: 'Von Hand, per Garbage Collector oder mit Besitzregeln.' },
      { id: 'typsysteme', title: 'Typsysteme', summary: 'Statisch oder dynamisch, streng oder locker.' },
    ],
  },
  {
    id: 'strukturieren',
    track: 'general',
    title: 'Programme strukturieren',
    summary: 'Größere Programme übersichtlich und robust aufbauen.',
    lessons: [
      { id: 'klassen', title: 'Klassen und Objekte', summary: 'Daten und passendes Verhalten gehören zusammen.' },
      { id: 'interfaces', title: 'Interfaces und Traits', summary: 'Gleiche Fähigkeit, verschiedene Umsetzungen.' },
      { id: 'generics', title: 'Generics', summary: 'Code einmal schreiben, für viele Typen nutzen.' },
      { id: 'fehler', title: 'Fehlerbehandlung', summary: 'Ausnahmen, Fehlerwerte und was dazwischen liegt.' },
    ],
  },
  {
    id: 'algorithmen',
    track: 'general',
    title: 'Algorithmen',
    summary: 'Klassische Lösungswege und wie man ihre Geschwindigkeit beurteilt.',
    lessons: [
      { id: 'rekursion', title: 'Rekursion', summary: 'Funktionen, die sich selbst aufrufen.' },
      { id: 'suchen', title: 'Suchen', summary: 'Lineare und binäre Suche im Vergleich.' },
      { id: 'sortieren', title: 'Sortieren', summary: 'Bubble Sort und Insertion Sort Schritt für Schritt.' },
      { id: 'big-o', title: 'Laufzeit und Big-O', summary: 'Wie Aufwand mit der Datenmenge wächst.' },
      { id: 'datenstrukturen', title: 'Stack, Queue, verkettete Liste', summary: 'Drei Bausteine, die überall auftauchen.' },
    ],
  },
  {
    id: 'fortgeschritten',
    track: 'general',
    title: 'Fortgeschritten',
    summary: 'Funktionen als Werte, träge Datenströme und parallele Abläufe.',
    lessons: [
      { id: 'closures', title: 'Lambdas und Closures', summary: 'Funktionen als Werte herumreichen.' },
      { id: 'iteratoren', title: 'Iteratoren und Pipelines', summary: 'map, filter und reduce statt Schleifen.' },
      { id: 'nebenlaeufigkeit', title: 'Nebenläufigkeit', summary: 'Mehrere Dinge gleichzeitig – und was dabei schiefgeht.' },
    ],
  },
  {
    id: 'handwerk',
    track: 'general',
    title: 'Handwerk',
    summary: 'Was aus Code verlässliche Software macht: testen, Fehler finden, Projekte organisieren.',
    lessons: [
      { id: 'testen', title: 'Testen', summary: 'Programme, die andere Programme überprüfen.' },
      { id: 'debugging', title: 'Debugging', summary: 'Fehler systematisch einkreisen statt raten.' },
      { id: 'projekte', title: 'Projekte und Build-Werkzeuge', summary: 'Module, Abhängigkeiten und Paketmanager.' },
    ],
  },
  {
    id: 'sql-abfragen',
    track: 'sql',
    title: 'Daten abfragen',
    summary: 'Tabellen lesen, filtern, sortieren und zusammenfassen.',
    lessons: [
      { id: 'sql-select', title: 'Tabellen und SELECT', summary: 'Daten liegen in Tabellen – SELECT holt sie heraus.' },
      { id: 'sql-where', title: 'Filtern mit WHERE', summary: 'Nur die Zeilen, die eine Bedingung erfüllen.' },
      { id: 'sql-sortieren', title: 'Sortieren und begrenzen', summary: 'ORDER BY, LIMIT und DISTINCT.' },
      { id: 'sql-gruppen', title: 'Zusammenfassen mit GROUP BY', summary: 'Zählen, summieren und Durchschnitte je Gruppe.' },
    ],
  },
  {
    id: 'sql-verknuepfen',
    track: 'sql',
    title: 'Tabellen verknüpfen',
    summary: 'Die eigentliche Stärke relationaler Datenbanken.',
    lessons: [
      { id: 'sql-join', title: 'JOIN', summary: 'Zeilen aus mehreren Tabellen zusammenführen.' },
      { id: 'sql-unterabfragen', title: 'Unterabfragen', summary: 'Abfragen in Abfragen.' },
    ],
  },
  {
    id: 'sql-gestalten',
    track: 'sql',
    title: 'Daten gestalten',
    summary: 'Daten ändern, Tabellen entwerfen und sicher damit arbeiten.',
    lessons: [
      { id: 'sql-aendern', title: 'Daten ändern', summary: 'INSERT, UPDATE und DELETE.' },
      { id: 'sql-entwurf', title: 'Tabellen entwerfen', summary: 'CREATE TABLE, Schlüssel und Regeln.' },
      { id: 'sql-indizes', title: 'Indizes', summary: 'Warum manche Abfragen schnell sind und andere nicht.' },
      { id: 'sql-transaktionen', title: 'Transaktionen', summary: 'Alles oder nichts.' },
    ],
  },
  {
    id: 'compiler',
    track: 'maschine',
    title: 'Vom Text zum Programm',
    summary: 'Die Stationen, die dein Quelltext im Compiler durchläuft.',
    lessons: [
      { id: 'compiler-ueberblick', title: 'Die Stationen eines Compilers', summary: 'Ein Fließband vom Text zum Maschinencode.' },
      { id: 'lexer', title: 'Vom Text zu Tokens', summary: 'Wie der Lexer Zeichen zu Wörtern bündelt.' },
      { id: 'parser', title: 'Der Syntaxbaum', summary: 'Wie der Parser die Struktur eines Programms erkennt.' },
      { id: 'semantik', title: 'Namen und Typen prüfen', summary: 'Was der Compiler weiß, bevor das Programm läuft.' },
      { id: 'optimierung', title: 'Zwischencode und Optimierung', summary: 'Wie aus deinem Code schnellerer Code wird.' },
      { id: 'maschinencode', title: 'Maschinencode und Assembler', summary: 'Was der Prozessor am Ende wirklich ausführt.' },
      { id: 'linker', title: 'Linker und ausführbare Datei', summary: 'Wie aus vielen Teilen ein Programm wird.' },
    ],
  },
  {
    id: 'laufzeit',
    track: 'maschine',
    title: 'Zur Laufzeit',
    summary: 'Was passiert, während ein Programm läuft.',
    lessons: [
      { id: 'vm', title: 'Interpreter, Bytecode und JIT', summary: 'Wie Python und Java ihren Code ausführen.' },
      { id: 'prozessor', title: 'Der Prozessor', summary: 'Register, Befehlszyklus und Caches.' },
      { id: 'betriebssystem', title: 'Prozesse und Betriebssystem', summary: 'Wie viele Programme sich einen Rechner teilen.' },
    ],
  },
  {
    id: 'netz-grundlagen',
    track: 'netz',
    title: 'Leitungen und Rahmen',
    summary: 'Wie Bits über Kabel und Busse reisen und im lokalen Netz ankommen.',
    lessons: [
      { id: 'netz-schichten', title: 'Schichten und Kapselung', summary: 'Warum ein Netzwerkpaket wie eine russische Puppe aufgebaut ist.' },
      { id: 'netz-busse', title: 'Bussysteme', summary: 'Viele Geräte an einer Leitung: CAN, I²C, SPI, USB.' },
      { id: 'netz-ethernet', title: 'Ethernet und Switches', summary: 'MAC-Adressen und wie ein Switch lernt.' },
      { id: 'netz-vlan', title: 'VLANs', summary: 'Ein Switch, mehrere getrennte Netze.' },
    ],
  },
  {
    id: 'netz-ip',
    track: 'netz',
    title: 'Das Internet-Protokoll',
    summary: 'Adressen, Subnetze und der Weg durch viele Netze.',
    lessons: [
      { id: 'netz-ip', title: 'IP-Adressen und Subnetze', summary: 'Adressen, Netzmasken und CIDR.' },
      { id: 'netz-routing', title: 'Routing, ARP und Gateways', summary: 'Wie ein Paket seinen Weg findet.' },
    ],
  },
  {
    id: 'netz-transport',
    track: 'netz',
    title: 'Transport',
    summary: 'Verlässliche Verbindungen und schnelle Datagramme.',
    lessons: [
      { id: 'netz-tcp-udp', title: 'TCP und UDP', summary: 'Handschlag, Bestätigungen und der schnelle Weg ohne.' },
      { id: 'netz-sockets', title: 'Ports und Sockets', summary: 'Netzwerkprogramme in deiner Sprache.' },
    ],
  },
  {
    id: 'netz-anwendung',
    track: 'netz',
    title: 'Anwendungen',
    summary: 'Die Protokolle, die du jeden Tag benutzt.',
    lessons: [
      { id: 'netz-dns', title: 'DNS', summary: 'Das Telefonbuch des Internets.' },
      { id: 'netz-http', title: 'HTTP und TLS', summary: 'Wie Webseiten geladen und verschlüsselt werden.' },
    ],
  },
  {
    id: 'terminal',
    track: 'tools',
    title: 'Im Terminal',
    summary: 'Mit Text-Befehlen statt Mausklicks arbeiten.',
    lessons: [
      { id: 'terminal-dateien', title: 'Dateien und Ordner', summary: 'Navigieren, anlegen, kopieren, verschieben.' },
      { id: 'terminal-pipes', title: 'Pipes und Umleitungen', summary: 'Kleine Werkzeuge zu großen verbinden.' },
      { id: 'terminal-skripte', title: 'Shell-Skripte', summary: 'Befehle automatisieren.' },
      { id: 'terminal-regex', title: 'Reguläre Ausdrücke', summary: 'Muster in Text finden.' },
    ],
  },
  {
    id: 'git',
    track: 'tools',
    title: 'Versionskontrolle mit Git',
    summary: 'Änderungen nachvollziehen, ausprobieren und gemeinsam arbeiten.',
    lessons: [
      { id: 'git-grundlagen', title: 'Commits', summary: 'Arbeitsverzeichnis, Staging und Versionsgeschichte.' },
      { id: 'git-branches', title: 'Branches und Merges', summary: 'Parallel entwickeln und zusammenführen.' },
      { id: 'git-zusammenarbeit', title: 'Zusammenarbeiten', summary: 'Remotes, Push, Pull und Pull Requests.' },
    ],
  },
  {
    id: 'automatisieren',
    track: 'tools',
    title: 'Automatisieren',
    summary: 'Prüfen und Ausliefern ohne Handarbeit.',
    lessons: [{ id: 'ci-cd', title: 'CI/CD', summary: 'Pipelines, die bei jeder Änderung testen und ausliefern.' }],
  },
];
