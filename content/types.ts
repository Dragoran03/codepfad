// Gemeinsame Typen für Inhalte. Wird vom Browser (Vite) und von Node (Prüfskript) geladen,
// deshalb nur "löschbare" TypeScript-Syntax und Importe mit .ts-Endung.

export type Lang = 'python' | 'java' | 'c' | 'cpp' | 'rust' | 'sql' | 'bash';
export type Track = 'general' | 'sql' | 'tools' | 'maschine' | 'netz';

export const GENERAL_LANGS: Lang[] = ['python', 'java', 'c', 'cpp', 'rust'];
export const ALL_LANGS: Lang[] = [...GENERAL_LANGS, 'sql', 'bash'];

export const LANG_LABEL: Record<Lang, string> = {
  python: 'Python',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  rust: 'Rust',
  sql: 'SQL',
  bash: 'Terminal',
};

export interface TrackInfo {
  id: Track;
  label: string;
  short: string;
  /** Sprachen, in denen der Pfad gezeigt wird. */
  langs: Lang[];
  intro: string;
}

export const TRACKS: TrackInfo[] = [
  {
    id: 'general',
    label: 'Programmieren',
    short: 'Programmieren',
    langs: GENERAL_LANGS,
    intro: 'Jede Lektion erklärt ein Konzept. Oben wechselst du jederzeit die Sprache: Erklärung und Animation bleiben, nur der Code ändert sich.',
  },
  {
    id: 'maschine',
    label: 'Wie Code ausgeführt wird',
    short: 'Unter der Haube',
    langs: GENERAL_LANGS,
    intro: 'Was zwischen deinem Quelltext und dem Prozessor passiert: Lexer, Parser, Optimierung, Maschinencode, virtuelle Maschinen. Die Beispiele zeigen, was die echten Compiler aus deinem Code machen.',
  },
  {
    id: 'netz',
    label: 'Netzwerke',
    short: 'Netzwerke',
    langs: GENERAL_LANGS,
    intro: 'Wie Daten von einem Rechner zum anderen kommen: von Kabeln und Bussen über Switches, VLANs und Router bis zu TCP, UDP, DNS und HTTP – mit echten Netzwerkprogrammen in deiner Sprache.',
  },
  {
    id: 'sql',
    label: 'SQL',
    short: 'SQL',
    langs: ['sql'],
    intro: 'SQL beschreibt, welche Daten du haben willst – nicht, wie der Computer sie findet. Deshalb hat es einen eigenen Pfad.',
  },
  {
    id: 'tools',
    label: 'Werkzeuge',
    short: 'Werkzeuge',
    langs: ['bash'],
    intro: 'Das Handwerkszeug jeder Entwicklerin: das Unix-Terminal, Versionskontrolle mit Git und automatische Pipelines mit CI/CD. Alle Befehle laufen echt – in einem abgeschotteten Übungsordner.',
  },
];

export function trackInfo(t: Track): TrackInfo {
  return TRACKS.find((x) => x.id === t)!;
}

/** Code je Sprache. Zeilen können mit `//@tag` bzw. `#@tag` oder `--@tag` enden (Schritt-Markierungen). */
export type Snippet = Partial<Record<Lang, string>>;

export interface TestCase {
  name?: string;
  stdin?: string;
  expected: string;
}

/** Programmieraufgabe. `code` enthält je Sprache Start- und Lösungsvariante (Marker `:solution`, `:starter`, `:end`). */
export interface CodeExercise {
  kind: 'code';
  id: string;
  title: string;
  prompt: string;
  tests: TestCase[];
  hints?: string[];
  code: Snippet;
  /** „Finde den Fehler": Der Startcode darf absichtlich nicht kompilieren. */
  starterBroken?: boolean;
}

export interface QuizExercise {
  kind: 'quiz';
  id: string;
  title: string;
  question: string;
  options: string[];
  correct: number;
  explain: string;
}

/** „Was gibt dieser Code aus?" – `code` ist der Name eines Snippets der Lektion. */
export interface PredictExercise {
  kind: 'predict';
  id: string;
  title: string;
  question?: string;
  code: string;
  /** Erwartete Ausgabe – für alle Sprachen gleich oder je Sprache verschieden. */
  expected: string | Partial<Record<Lang, string>>;
  explain: string | Partial<Record<Lang, string>>;
}

export interface SqlExercise {
  kind: 'sql';
  id: string;
  title: string;
  prompt: string;
  dataset?: string;
  starter?: string;
  solution: string;
  /** Reihenfolge der Zeilen ist Teil der Aufgabe (ORDER BY verlangt). */
  ordered?: boolean;
  /** Für ändernde Aufgaben: Abfrage, deren Ergebnis nach deinen Anweisungen verglichen wird. */
  check?: string;
  hints?: string[];
}

/** Terminal-Aufgabe: Befehle werden in einem frisch vorbereiteten Übungsordner ausgeführt. */
export interface ShellExercise {
  kind: 'shell';
  id: string;
  title: string;
  prompt: string;
  /** Bash-Skript, das den Übungsordner vorbereitet (Standard: shellSetup der Lektion). */
  setup?: string;
  starter?: string;
  solution: string;
  /** Bash-Befehle, deren Ausgabe nach deinen Befehlen mit der Musterlösung verglichen wird. */
  check: string;
  hints?: string[];
}

export type Exercise = CodeExercise | QuizExercise | PredictExercise | SqlExercise | ShellExercise;

// ---------- Visualisierung ----------

export type VarVal =
  | string
  | number
  | boolean
  | { v?: string | number; ref?: string; state?: 'moved' | 'dangling' | 'uninit' | 'borrowed'; type?: string };
// `ref` zeigt auf ein Heap-Objekt (dessen id) oder auf eine Stack-Variable ("funktion.variable").

export interface Frame {
  name: string;
  vars: Record<string, VarVal>;
}

export interface HeapObj {
  id: string;
  label?: string;
  cells: (string | number | { ref: string })[];
  state?: 'live' | 'freed' | 'garbage';
}

export interface ArrayView {
  label?: string;
  cells: (string | number)[];
  /** Stabile Kennungen, damit Vertauschungen animiert werden. */
  ids?: number[];
  pointers?: Record<string, number>;
  hi?: number[];
  dim?: number[];
  done?: number[];
  bars?: boolean;
  showIndex?: boolean;
}

export interface BucketsView {
  buckets: string[][];
  hi?: number;
  hash?: string;
}

export interface ListView {
  nodes: { id: string; v: string | number }[];
  hi?: string;
  pointers?: Record<string, string>;
  label?: string;
}

export interface TreeNode {
  id: string;
  label: string;
  parent?: string;
  state?: 'active' | 'done' | 'waiting';
  result?: string | number;
}

export interface TableView {
  name: string;
  columns: string[];
  rows: (string | number | null)[][];
  hi?: number[];
  dim?: number[];
  /** Zeilenindex → Gruppennummer (färbt Zeilen ein). */
  groups?: Record<number, number>;
  hiCols?: number[];
}

export interface GitCommitView {
  hash: string;
  parents: string[];
  subject: string;
  /** z. B. "HEAD -> main", "feature", "origin/main", "tag: v1.0" */
  refs: string[];
}

export interface GitView {
  commits: GitCommitView[];
  hi?: string[];
}

/** Die drei Bereiche von Git (oder andere nebeneinanderliegende Dateibereiche). */
export interface AreasView {
  areas: { title: string; sub?: string; files: { name: string; state?: 'neu' | 'geändert' | 'gelöscht' | 'gleich' }[] }[];
  hi?: number;
}

/** Sequenzdiagramm: Nachrichten zwischen Teilnehmern, von oben nach unten. */
export interface SeqView {
  actors: string[];
  msgs: { from: number; to: number; label: string; sub?: string; lost?: boolean; tone?: number }[];
  /** Hervorgehobene Nachricht (Standard: die letzte). */
  hi?: number;
}

/** Verschachtelte Schichten eines Pakets, von außen nach innen. */
export interface LayersView {
  layers: { label: string; sub?: string; tone?: number }[];
  hi?: number;
  /** Inhalt in der Mitte (Nutzdaten). */
  payload?: string;
}

/** Netzwerk-Topologie in einem logischen Koordinatensystem (Standard 640 × 280). */
export interface TopoView {
  width?: number;
  height?: number;
  nodes: {
    id: string;
    label: string;
    sub?: string;
    kind: 'pc' | 'server' | 'switch' | 'router' | 'cloud' | 'bus' | 'device';
    x: number;
    y: number;
    /** Breite (nur für Busse). */
    w?: number;
    tone?: number;
    hi?: boolean;
    dim?: boolean;
  }[];
  links: { a: string; b: string; label?: string; tone?: number; hi?: boolean; dashed?: boolean; dim?: boolean }[];
  /** Ein Paket unterwegs zwischen zwei Knoten (t = 0 … 1). */
  packets?: { a: string; b: string; t?: number; label: string; tone?: number; lost?: boolean }[];
}

export interface PipelineView {
  stages: { label: string; sub?: string; kind?: 'file' | 'tool' | 'run' | 'out' }[];
  active: number;
}

export interface Step {
  tag?: string;
  note: string;
  out?: string;
  frames?: Frame[];
  heap?: HeapObj[];
  array?: ArrayView | ArrayView[];
  buckets?: BucketsView;
  list?: ListView;
  tree?: TreeNode[];
  tables?: TableView[];
  result?: TableView;
  pipeline?: PipelineView;
  git?: GitView;
  seq?: SeqView;
  layers?: LayersView;
  topo?: TopoView;
  areas?: AreasView;
  /** Verzeichnisbaum (Pfade wie in `find`, Ordner enden mit /) und aktueller Ordner. */
  files?: { paths: string[]; cwd?: string; hi?: string[] };
  /** Terminal-Ausschnitt: eingegebener Befehl und Ausgabe. */
  term?: { lines: { cmd?: string; out?: string }[] };
}

export interface Param {
  name: string;
  label: string;
  min: number;
  max: number;
  value: number;
}

export interface Scene {
  title?: string;
  /** Name des Snippets, dessen Zeilen hervorgehoben werden. */
  code?: string;
  params?: Param[];
  build: (p: Record<string, number>, lang: Lang) => Step[];
}

export interface LessonCode {
  snippets?: Record<string, Snippet>;
  /** Snippets, die keine vollständigen Programme sind (werden nicht ausgeführt). */
  fragments?: string[];
  exercises?: Exercise[];
  scenes?: Record<string, Scene>;
  /** Beispiele für die Compiler-Ansicht (<Uebersetzen>): werden übersetzt statt ausgeführt geprüft. */
  asm?: string[];
  /** Beispiele, die absichtlich (in manchen Sprachen) scheitern: ausführbar, aber vom Prüfskript übersprungen. */
  noVerify?: string[];
  /** Eingabe (stdin) für Beispiele, die etwas einlesen: Beispielname → Eingabe. */
  stdin?: Record<string, string>;
  /** Vorbereitung des Übungsordners für Terminal-Lektionen (Bash). */
  shellSetup?: string;
  /** Standard-Datensatz für SQL-Lektionen. */
  dataset?: string;
}

export const raw = String.raw;
