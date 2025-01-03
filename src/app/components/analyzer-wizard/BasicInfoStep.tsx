import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnalyzerConfig } from '@/types/analyzer';

interface BasicInfoStepProps {
  config: Partial<AnalyzerConfig>;
  onUpdate: (updates: Partial<AnalyzerConfig>) => void;
  onNext: () => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  config,
  onUpdate,
  onNext,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.name?.trim()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="analyzer-name" className="text-cyan-100">
          Analyzer Name
        </Label>
        <Input
          id="analyzer-name"
          value={config.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Enter analyzer name"
          className="bg-gray-800 text-cyan-100 border-cyan-700"
          required
        />
      </div>
      <Button 
        type="submit"
        className="w-full bg-cyan-900 hover:bg-cyan-800 text-cyan-100"
        disabled={!config.name?.trim()}
      >
        Next
      </Button>
    </form>
  );
}; 