import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AnalyzerConfig } from '../types/analyzer';

interface AnalyzerStore {
  analyzers: AnalyzerConfig[];
  addAnalyzer: (analyzer: AnalyzerConfig) => void;
  removeAnalyzer: (name: string) => void;
  setAnalyzers: (analyzers: AnalyzerConfig[]) => void;
  syncWithRegistry: (registryAnalyzers: AnalyzerConfig[]) => void;
}

export const useAnalyzerStore = create<AnalyzerStore>()(
  persist(
    (set, get) => ({
      analyzers: [],
      addAnalyzer: (analyzer) =>
        set((state) => ({
          analyzers: [...state.analyzers, analyzer],
        })),
      removeAnalyzer: (name) =>
        set((state) => ({
          analyzers: state.analyzers.filter((a) => a.name !== name),
        })),
      setAnalyzers: (analyzers) => set({ analyzers }),
      // New function to sync with registry
      syncWithRegistry: (registryAnalyzers) => {
        const currentAnalyzers = get().analyzers;
        // Keep only analyzers that exist in both places
        const syncedAnalyzers = currentAnalyzers.filter(
          analyzer => registryAnalyzers.some(
            regAnalyzer => regAnalyzer.name === analyzer.name
          )
        );
        // Add any new analyzers from registry
        registryAnalyzers.forEach(regAnalyzer => {
          if (!syncedAnalyzers.some(a => a.name === regAnalyzer.name)) {
            syncedAnalyzers.push(regAnalyzer);
          }
        });
        set({ analyzers: syncedAnalyzers });
      },
    }),
    {
      name: 'analyzer-storage',
    }
  )
); 