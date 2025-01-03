import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnalyzerConfig } from '@/types/analyzer';

interface PromptConfigStepProps {
  config: Partial<AnalyzerConfig>;
  onUpdate: (updates: Partial<AnalyzerConfig>) => void;
  onComplete: (config: AnalyzerConfig) => void;
  onBack: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const PromptConfigStep: React.FC<PromptConfigStepProps> = ({
  config,
  onUpdate,
  onComplete,
  onBack,
  disabled = false,
  isLoading = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.name && config.systemPrompt?.content && config.userPrompt) {
      onComplete(config as AnalyzerConfig);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-green-400 mb-1">
            Analyzer Name
          </label>
          <Input
            value={config.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Enter analyzer name"
            className="w-full"
            disabled={disabled}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-400 mb-1">
            System Prompt
          </label>
          <Textarea
            value={config.systemPrompt?.content}
            onChange={(e) =>
              onUpdate({
                systemPrompt: { ...config.systemPrompt!, content: e.target.value }
              })
            }
            placeholder="Enter system prompt"
            className="w-full h-32"
            disabled={disabled}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-400 mb-1">
            User Prompt
          </label>
          <Textarea
            value={config.userPrompt}
            onChange={(e) => onUpdate({ userPrompt: e.target.value })}
            placeholder="Enter user prompt"
            className="w-full h-32"
            disabled={disabled}
            required
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          onClick={onBack}
          className="bg-gray-800 hover:bg-gray-700 text-green-400"
          disabled={disabled}
        >
          Back
        </Button>
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-black"
          disabled={disabled || isLoading}
        >
          {isLoading ? 'Creating Analyzer...' : 'Create Analyzer'}
        </Button>
      </div>
    </form>
  );
}; 