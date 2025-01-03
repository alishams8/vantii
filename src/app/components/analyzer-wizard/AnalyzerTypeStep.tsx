import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AnalyzerTypeStepProps {
  analyzerType: string;
  description: string;
  onUpdate: (type: string, description: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const AnalyzerTypeStep: React.FC<AnalyzerTypeStepProps> = ({
  analyzerType,
  description,
  onUpdate,
  onNext,
  onBack,
}) => {
  const predefinedTypes = [
    'Financial Data Analyzer',
    'Sentiment Analyzer',
    'Data Quality Checker',
    'Performance Analyzer',
    'Compliance Checker',
    'Custom'
  ];

  useEffect(() => {
    if (!analyzerType && !description) {
      onUpdate('financial_data_analyzer', 'This analyzer will help analyze and process data according to specific rules and criteria.');
    }
  }, []);

  const descriptionPlaceholders = [
    'Describe how this analyzer will process and evaluate the data...',
    'Explain the purpose and goals of this analyzer...',
    'Detail what insights or results this analyzer will provide...',
    'Specify the key features and capabilities of this analyzer...'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
          Define Analyzer Type
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Choose the type of analysis to be performed
        </p>
      </div>

      <div className="space-y-4 p-4 rounded-lg border border-gray-800 bg-black/20 backdrop-blur-sm transition-all duration-200 hover:border-green-900">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Analyzer Type
          </label>
          <Select
            defaultValue={analyzerType || 'financial_data_analyzer'}
            onValueChange={(value) => onUpdate(value, description)}
          >
            <SelectTrigger className="bg-black/20 border-gray-800 text-white hover:border-green-900 focus:border-green-400/50 focus:ring-green-400/20">
              <SelectValue placeholder="Select analyzer type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              {predefinedTypes.map((type) => (
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

        {analyzerType === 'custom' && (
          <Input
            value={analyzerType}
            onChange={(e) => onUpdate(e.target.value, description)}
            placeholder="Enter custom analyzer type"
            className="bg-black/20 border-gray-800 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200"
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => onUpdate(analyzerType, e.target.value)}
            placeholder={descriptionPlaceholders[Math.floor(Math.random() * descriptionPlaceholders.length)]}
            className="bg-black/20 border-gray-800 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200 h-32"
          />
        </div>
      </div>

      <div className="flex justify-between gap-4 pt-4">
        <Button 
          onClick={onBack}
          className="bg-black/20 border border-gray-800 hover:border-green-900 text-gray-400 hover:text-white transition-all duration-200"
        >
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!analyzerType.trim() || !description.trim()}
          className="bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:shadow-[0_0_25px_rgba(74,222,128,0.5)] transition-all duration-200"
        >
          Next
        </Button>
      </div>
    </div>
  );
}; 