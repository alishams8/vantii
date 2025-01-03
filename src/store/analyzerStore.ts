import { create } from 'zustand';
import { AnalyzerConfig } from '@/types/analyzer';

interface AnalyzerStore {
  analyzers: AnalyzerConfig[];
  addAnalyzer: (analyzer: AnalyzerConfig) => void;
  removeAnalyzer: (name: string) => void;
  getAnalyzer: (name: string) => AnalyzerConfig | undefined;
}

export const useAnalyzerStore = create<AnalyzerStore>((set, get) => ({
  analyzers: [],
  
  addAnalyzer: (analyzer: AnalyzerConfig) => {
    set((state) => ({
      analyzers: [...state.analyzers, analyzer]
    }));
  },
  
  removeAnalyzer: (name: string) => {
    set((state) => ({
      analyzers: state.analyzers.filter((a) => a.name !== name)
    }));
  },
  
  getAnalyzer: (name: string) => {
    return get().analyzers.find((a) => a.name === name);
  }
})); 