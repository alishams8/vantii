import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from 'lucide-react';

interface Input {
  type: string;
  description: string;
  format?: string[];
}

interface InputDefinitionStepProps {
  inputs: Input[];
  onUpdate: (inputs: Input[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const InputDefinitionStep: React.FC<InputDefinitionStepProps> = ({
  inputs,
  onUpdate,
  onNext,
  onBack,
}) => {
  useEffect(() => {
    if (inputs.length === 0) {
      onUpdate([{
        type: '',
        description: '',
        format: ['Spreadsheet (.xlsx, .csv)', 'Text (.txt)', 'Document (.docx, .pdf)']
      }]);
    }
  }, []);

  const addInput = () => {
    onUpdate([...inputs, { 
      type: '', 
      description: '',
      format: ['Spreadsheet (.xlsx, .csv)', 'Text (.txt)', 'Document (.docx, .pdf)']
    }]);
  };

  const updateInput = (index: number, field: keyof Input, value: string | string[]) => {
    const newInputs = [...inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    onUpdate(newInputs);
  };

  const inputTypeSuggestions = [
    'Spreadsheet Data',
    'Text Document',
    'Financial Data',
    'Survey Responses',
    'Performance Metrics',
    'Log Files'
  ];

  const descriptionPlaceholders = [
    'Enter data format requirements and constraints...',
    'Describe the expected structure of the input...',
    'Specify any validation rules for this input type...',
    'Detail the required fields or columns...'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
          Define Input Types
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Specify the types of data your analyzer will process
        </p>
      </div>

      {inputs.map((input, index) => (
        <div 
          key={index} 
          className="space-y-4 p-4 rounded-lg border border-gray-800 bg-black/20 backdrop-blur-sm transition-all duration-200 hover:border-green-900"
        >
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Input Type
            </label>
            <Input
              value={input.type}
              onChange={(e) => updateInput(index, 'type', e.target.value)}
              placeholder={inputTypeSuggestions[index % inputTypeSuggestions.length]}
              className="bg-black/20 border-gray-800 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200"
              list={`input-types-${index}`}
            />
            <datalist id={`input-types-${index}`}>
              {inputTypeSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <Textarea
              value={input.description}
              onChange={(e) => updateInput(index, 'description', e.target.value)}
              placeholder={descriptionPlaceholders[index % descriptionPlaceholders.length]}
              className="bg-black/20 border-gray-800 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200"
            />
          </div>
          
          <div className="text-sm text-green-400/70">
            Supported formats: {input.format?.join(', ')}
          </div>
        </div>
      ))}

      <Button 
        onClick={addInput} 
        className="w-full bg-black/20 border border-gray-800 hover:border-green-900 text-green-400 hover:text-green-300 transition-all duration-200"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Input Type
      </Button>

      <div className="flex justify-between gap-4 pt-4">
        <Button 
          onClick={onBack}
          className="bg-black/20 border border-gray-800 hover:border-green-900 text-gray-400 hover:text-white transition-all duration-200"
        >
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={inputs.length === 0 || inputs.some(input => !input.type.trim() || !input.description.trim())}
          className="bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:shadow-[0_0_25px_rgba(74,222,128,0.5)] transition-all duration-200"
        >
          Next
        </Button>
      </div>
    </div>
  );
}; 