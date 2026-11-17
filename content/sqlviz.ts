// Hilfen für SQL-Animationen.

import type { Cell, TableData } from './datasets.ts';
import { cols } from './datasets.ts';
import type { TableView } from './types.ts';

/** Ansicht einer Tabelle aus dem Datensatz, optional mit anderen Zeilen und Hervorhebungen. */
export function tv(t: TableData, opts: Partial<TableView> = {}): TableView {
  return { name: t.name, columns: cols(t), rows: t.rows, ...opts };
}

export function res(columns: string[], rows: Cell[][], opts: Partial<TableView> = {}): TableView {
  return { name: 'Ergebnis', columns, rows, ...opts };
}

/** Wert einer Spalte in einer Zeile. */
export function val(t: TableData, row: Cell[], column: string): Cell {
  return row[cols(t).indexOf(column)];
}

/** Zeilen auf bestimmte Spalten beschränken. */
export function pick(t: TableData, rows: Cell[][], columns: string[]): Cell[][] {
  const idx = columns.map((c) => cols(t).indexOf(c));
  return rows.map((r) => idx.map((i) => r[i]));
}

/** Indizes der Spalten (für hiCols). */
export function colIdx(t: TableData, columns: string[]): number[] {
  return columns.map((c) => cols(t).indexOf(c));
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/** Zahl so formatieren, wie SQL-Ergebnisse angezeigt werden. */
export function num(v: Cell): string {
  if (typeof v !== 'number') return String(v);
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}
