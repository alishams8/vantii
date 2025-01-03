import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from 'lucide-react';

interface Output {
  name: string;
  type: string;
  description: string;
  format?: string;
}

interface OutputDefinitionStepProps {
  outputs: Output[];
  onUpdate: (outputs: Output[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const OutputDefinitionStep: React.FC<OutputDefinitionStepProps> = ({
  outputs,
  onUpdate,
  onNext,
  onBack,
}) => {
  useEffect(() => {
    if (outputs.length === 0) {
      onUpdate([{
        name: '',
        type: 'summary_statistics',
        description: '',
        format: 'JSON'
      }]);
    }
  }, []);

  const outputTypes = [
    'Summary Statistics',
    'Validation Results',
    'Classification',
    'Score',
    'Custom'
  ];

  const addOutput = () => {
    onUpdate([...outputs, { 
      name: '', 
      type: 'summary_statistics',
      description: '', 
      format: 'JSON' 
    }]);
  };

  const updateOutput = (index: number, field: keyof Output, value: string) => {
    const newOutputs = [...outputs];
    newOutputs[index] = { ...newOutputs[index], [field]: value };
    onUpdate(newOutputs);
  };

  const formatPlaceholders = [
    'Pass/Fail',
    '0-100',
    'High/Medium/Low',
    'JSON',
    'CSV'
  ];

  const descriptionPlaceholders = [
    'Describe what this output represents...',
    'Explain how this output should be interpreted...',
    'Detail the significance of this output...',
    'Specify any output constraints or ranges...'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
          Define Output Format
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Specify how the analysis results should be formatted
        </p>
      </div>
      
      {outputs.map((output, index) => (
        <div 
          key={index} 
          className="space-y-4 p-4 rounded-lg border border-gray-800 bg-black/20 backdrop-blur-sm transition-all duration-200 hover:border-green-900"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Output Name
            </label>
            <Input
              value={output.name}
              onChange={(e) => updateOutput(index, 'name', e.target.value)}
              placeholder="Output field name (e.g., Score, Status, Category)"
              className="bg-black/20 border-gray-800 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Output Type
            </label>
            <Select
              defaultValue={output.type}
              onValueChange={(value) => updateOutput(index, 'type', value)}
            >
              <SelectTrigger className="bg-black/20 border-gray-800 text-white hover:border-green-900 focus:border-green-400/50 focus:ring-green-400/20">
                <SelectValue placeholder="Select output type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                {outputTypes.map((type) => (
                  <SelectItem 
                    key={type} 
                    value={type.toLowerCase().replace(/\s+/g, '_')}
                    className="text-gray-300 focus:bg-green-900/20 focus:text-green-400"
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <Textarea
              value={output.description}
              onChange={(e) => updateOutput(index, 'description', e.target.value)}
              placeholder={descriptionPlaceholders[index % descriptionPlaceholders.length]}
              className="bg-black/20 border-gray-800 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Format
            </label>
            <Input
              value={output.format || ''}
              onChange={(e) => updateOutput(index, 'format', e.target.value)}
              placeholder={`Format (e.g., ${formatPlaceholders[index % formatPlaceholders.length]})`}
              className="bg-black/20 border-gray-800 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200"
            />
          </div>
        </div>
      ))}

      <Button 
        onClick={addOutput} 
        className="w-full bg-black/20 border border-gray-800 hover:border-green-900 text-green-400 hover:text-green-300 transition-all duration-200"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Output Field
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
          disabled={outputs.length === 0 || outputs.some(output => !output.name.trim() || !output.type || !output.description.trim())}
          className="bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:shadow-[0_0_25px_rgba(74,222,128,0.5)] transition-all duration-200"
        >
          Next
        </Button>
      </div>
    </div>
  );
}; 