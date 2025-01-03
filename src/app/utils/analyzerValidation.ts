import { AnalyzerConfig } from '../types/analyzer';

export function validateAnalyzerConfig(config: Partial<AnalyzerConfig>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.name?.trim()) {
    errors.push('Analyzer name is required');
  }

  if (!config.systemPrompt?.content?.trim()) {
    errors.push('System prompt is required');
  }

  if (!config.userPrompt?.trim()) {
    errors.push('User prompt is required');
  }

  if (!config.structure) {
    errors.push('Analyzer structure is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 