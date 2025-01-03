import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AnalyzerConfig, AnalyzerStructure } from '@/types/analyzer';

interface StructureDefinitionStepProps {
  config: Partial<AnalyzerConfig>;
  onUpdate: (updates: Partial<AnalyzerConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

const defaultStructure: AnalyzerStructure = {
  inputFormat: {
    type: "object",
    properties: [
      {
        name: "tasks",
        type: "array",
        description: "List of tasks to analyze",
        required: true,
        nested: [
          {
            name: "name",
            type: "string",
            description: "Task name"
          },
          {
            name: "items",
            type: "array",
            description: "Action items"
          }
        ]
      }
    ]
  },
  outputFormat: {
    type: "object",
    properties: [
      {
        name: "findings",
        type: "array",
        description: "Analysis findings",
        required: true,
        validValues: ["Not Started", "In Progress", "Implemented", "Optimized"]
      }
    ]
  },
  scoringRules: [
    {
      score: 0,
      criteria: "No evidence found",
      requirements: ["Must cite searched terms", "Must explain why no evidence exists"]
    },
    {
      score: 4,
      criteria: "Fully implemented with optimization",
      requirements: ["Must show multiple examples", "Must demonstrate improvements"]
    }
  ]
};

export const StructureDefinitionStep: React.FC<StructureDefinitionStepProps> = ({
  config,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [structure, setStructure] = React.useState<AnalyzerStructure>(
    config.structure || defaultStructure
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ structure });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="structure-json" className="text-cyan-100">
          Analyzer Structure (JSON)
        </Label>
        <Textarea
          id="structure-json"
          value={JSON.stringify(structure, null, 2)}
          onChange={(e) => {
            try {
              setStructure(JSON.parse(e.target.value));
            } catch (error) {
              // Handle invalid JSON
            }
          }}
          className="h-64 font-mono bg-gray-800 text-cyan-100 border-cyan-700"
          placeholder="Define analyzer structure..."
        />
      </div>
      <div className="flex justify-between gap-4">
        <Button 
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-cyan-100"
        >
          Back
        </Button>
        <Button 
          type="submit"
          className="flex-1 bg-cyan-900 hover:bg-cyan-800 text-cyan-100"
        >
          Next
        </Button>
      </div>
    </form>
  );
}; 