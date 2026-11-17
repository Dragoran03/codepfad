// Datensätze für den SQL-Pfad. Die Tabellen sind hier als Daten beschrieben;
// das SQL zum Anlegen wird daraus erzeugt. So zeigen Animationen und Datenbank
// garantiert dieselben Werte.

export type Cell = string | number | null;

export interface Column {
  name: string;
  type: 'INTEGER' | 'TEXT' | 'REAL';
  /** Zusätzliche Regeln, z. B. "PRIMARY KEY" oder "NOT NULL REFERENCES kunden(id)". */
  extra?: string;
}

export interface TableData {
  name: string;
  columns: Column[];
  rows: Cell[][];
  /** Regeln für die ganze Tabelle, z. B. "CHECK (saldo >= 0)". */
  constraints?: string[];
}

export interface Dataset {
  title: string;
  tables: string[];
  setup: string;
  data: Record<string, TableData>;
}

function literal(v: Cell): string {
  if (v === null) return 'NULL';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return `'${v.replace(/'/g, "''")}'`;
}

function toSql(tables: TableData[]): string {
  return tables
    .map((t) => {
      const cols = t.columns.map((c) => `  ${c.name} ${c.type}${c.extra ? ` ${c.extra}` : ''}`);
      const create = `CREATE TABLE ${t.name} (\n${[...cols, ...(t.constraints ?? []).map((c) => `  ${c}`)].join(',\n')}\n);`;
      if (t.rows.length === 0) return create;
      const values = t.rows.map((r) => `  (${r.map(literal).join(', ')})`).join(',\n');
      return `${create}\nINSERT INTO ${t.name} (${t.columns.map((c) => c.name).join(', ')}) VALUES\n${values};`;
    })
    .join('\n\n');
}

function dataset(title: string, tables: TableData[]): Dataset {
  return {
    title,
    tables: tables.map((t) => t.name),
    setup: toSql(tables),
    data: Object.fromEntries(tables.map((t) => [t.name, t])),
  };
}

export const KUNDEN: TableData = {
  name: 'kunden',
  columns: [
    { name: 'id', type: 'INTEGER', extra: 'PRIMARY KEY' },
    { name: 'name', type: 'TEXT', extra: 'NOT NULL' },
    { name: 'stadt', type: 'TEXT', extra: 'NOT NULL' },
    { name: 'seit', type: 'INTEGER', extra: 'NOT NULL' },
    { name: 'email', type: 'TEXT' },
  ],
  rows: [
    [1, 'Aylin', 'Berlin', 2019, 'aylin@example.org'],
    [2, 'Ben', 'Hamburg', 2021, null],
    [3, 'Clara', 'Berlin', 2022, 'clara@example.org'],
    [4, 'Deniz', 'München', 2020, null],
    [5, 'Emil', 'Köln', 2023, 'emil@example.org'],
    [6, 'Frieda', 'Hamburg', 2018, 'frieda@example.org'],
  ],
};

export const PRODUKTE: TableData = {
  name: 'produkte',
  columns: [
    { name: 'id', type: 'INTEGER', extra: 'PRIMARY KEY' },
    { name: 'name', type: 'TEXT', extra: 'NOT NULL' },
    { name: 'kategorie', type: 'TEXT', extra: 'NOT NULL' },
    { name: 'preis', type: 'REAL', extra: 'NOT NULL' },
  ],
  rows: [
    [1, 'Notizbuch', 'Papier', 4.5],
    [2, 'Füller', 'Schreiben', 24.9],
    [3, 'Bleistift', 'Schreiben', 0.9],
    [4, 'Tinte', 'Schreiben', 6.2],
    [5, 'Kalender', 'Papier', 12.0],
    [6, 'Rucksack', 'Taschen', 49.0],
    [7, 'Federmappe', 'Taschen', 14.5],
    [8, 'Lineal', 'Schreiben', 2.3],
  ],
};

export const BESTELLUNGEN: TableData = {
  name: 'bestellungen',
  columns: [
    { name: 'id', type: 'INTEGER', extra: 'PRIMARY KEY' },
    { name: 'kunde_id', type: 'INTEGER', extra: 'NOT NULL REFERENCES kunden(id)' },
    { name: 'datum', type: 'TEXT', extra: 'NOT NULL' },
    { name: 'status', type: 'TEXT', extra: 'NOT NULL' },
  ],
  rows: [
    [1, 1, '2024-01-12', 'geliefert'],
    [2, 2, '2024-01-15', 'geliefert'],
    [3, 1, '2024-02-03', 'geliefert'],
    [4, 4, '2024-02-20', 'storniert'],
    [5, 3, '2024-03-01', 'offen'],
    [6, 6, '2024-03-04', 'offen'],
    [7, 1, '2024-03-09', 'offen'],
  ],
};

export const POSITIONEN: TableData = {
  name: 'positionen',
  columns: [
    { name: 'bestellung_id', type: 'INTEGER', extra: 'NOT NULL REFERENCES bestellungen(id)' },
    { name: 'produkt_id', type: 'INTEGER', extra: 'NOT NULL REFERENCES produkte(id)' },
    { name: 'menge', type: 'INTEGER', extra: 'NOT NULL' },
  ],
  rows: [
    [1, 1, 3],
    [1, 3, 10],
    [2, 2, 1],
    [2, 4, 2],
    [3, 6, 1],
    [4, 5, 2],
    [5, 1, 5],
    [5, 7, 1],
    [6, 2, 1],
    [6, 3, 4],
    [6, 1, 2],
    [7, 4, 1],
  ],
};

export const KONTEN: TableData = {
  name: 'konten',
  columns: [
    { name: 'id', type: 'INTEGER', extra: 'PRIMARY KEY' },
    { name: 'inhaber', type: 'TEXT', extra: 'NOT NULL' },
    { name: 'saldo', type: 'REAL', extra: 'NOT NULL' },
  ],
  constraints: ['CHECK (saldo >= 0)'],
  rows: [
    [1, 'Aylin', 500.0],
    [2, 'Ben', 120.0],
    [3, 'Clara', 80.0],
  ],
};

export const DATASETS: Record<string, Dataset> = {
  laden: dataset('Schreibwarenladen', [KUNDEN, PRODUKTE, BESTELLUNGEN, POSITIONEN]),
  konten: dataset('Bankkonten', [KONTEN]),
  leer: dataset('Leere Datenbank', []),
};

/** Spaltennamen einer Tabelle. */
export function cols(t: TableData): string[] {
  return t.columns.map((c) => c.name);
}
