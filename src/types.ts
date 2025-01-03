export interface Cell {
  value: string;
}

export interface Row {
  cells: Cell[];
}

export interface SpreadsheetData {
  title: string;
  rows: Row[];
} 