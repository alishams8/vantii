import { SpreadsheetData } from "../types";
import { AnalyzerConfig } from "../types/analyzer";

export interface SidebarProps {
  spreadsheets: SpreadsheetData[];
  selectedSpreadsheetIndex: number;
  setSelectedSpreadsheetIndex: (index: number) => void;
  onAddSpreadsheet: (name: string) => void;
  onCompare: (index1: number, index2: number, compareType: string, columnIndex?: number) => Promise<any[]>;
  onDeleteSpreadsheet: (index: number) => void;
  onMaturityAnalysis: (analysis: any, analysisType: string) => void;
  setSpreadsheets: React.Dispatch<React.SetStateAction<SpreadsheetData[]>>;
  onCreateAnalyzer?: (config: AnalyzerConfig) => Promise<void>;
}

export interface AnalysisComponent {
  title: string;
  icon: any;
  component: React.ComponentType<any>;
  analysisType: string;
} 