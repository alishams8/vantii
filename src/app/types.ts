export interface Cell {
  value: string;
}

export interface SpreadsheetRow {
  className?: string;
  cells: Cell[];
}

export interface SpreadsheetData {
  title: string;
  rows: SpreadsheetRow[];
}

export interface CustomAnalyzerData {
  name: string;
  componentName: string;
  tasks: Array<{
    name: string;
    description?: string;
    items: string[];
  }>;
  prompt: string;
}
