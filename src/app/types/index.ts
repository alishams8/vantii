export interface Cell {
  value: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface Row {
  cells: Cell[];
  metadata?: {
    [key: string]: any;
  };
}

export interface SpreadsheetData {
  title: string;
  rows: Row[];
  metadata?: {
    [key: string]: any;
  };
}

export interface AnalysisResult {
  findings: Array<{
    category: string;
    observation: string;
    details: string;
    impact: string;
  }>;
  score?: number;
  metadata?: {
    [key: string]: any;
  };
} 