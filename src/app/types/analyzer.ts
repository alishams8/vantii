import { SpreadsheetData } from "../types";

export interface AnalyzerStructure {
  inputs: {
    type: string;
    description: string;
    format?: string[];
  }[];
  rules: {
    type: string;
    description: string;
    criteria?: string[];
  }[];
  outputs: {
    name: string;
    type: string;
    description: string;
    format?: string;
  }[];
}

export interface SystemPrompt {
  role: 'system';
  content: string;
  description: string;
}

export interface AnalyzerConfig {
  name: string;
  analyzerType?: string;
  structure: AnalyzerStructure;
  systemPrompt: SystemPrompt;
  userPrompt: string;
  componentName?: string;
}

export interface AnalyzerProps {
  spreadsheet: any;
  onAnalysisComplete: (result: any, analyzerName: string) => void;
  renderCustomButton?: (onClick: () => void, isAnalyzing: boolean) => React.ReactNode;
}

export interface CustomAnalyzerData {
  name: string;
  componentName: string;
  structure: AnalyzerStructure;
  prompt: string;
}

export interface PromptTemplate {
  name: string;
  description: string;
  structure: AnalyzerStructure;
  systemPrompt: SystemPrompt;
} 