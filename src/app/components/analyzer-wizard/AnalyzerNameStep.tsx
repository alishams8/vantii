import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AnalyzerNameStepProps {
  name: string;
  onUpdate: (name: string) => void;
  onNext: () => void;
}

export const AnalyzerNameStep: React.FC<AnalyzerNameStepProps> = ({
  name,
  onUpdate,
  onNext,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="analyzer-name"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Analyzer Name
        </label>
        <Input
          id="analyzer-name"
          value={name}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Enter analyzer name"
          className="bg-black/20 border-gray-800 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200"
        />
        <p className="mt-2 text-sm text-gray-400">
          Choose a descriptive name for your analyzer. This name will be used to identify the analyzer in your list.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!name.trim()}
          className="bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:shadow-[0_0_25px_rgba(74,222,128,0.5)] transition-all duration-200"
        >
          Next
        </Button>
      </div>
    </div>
  );
}; 