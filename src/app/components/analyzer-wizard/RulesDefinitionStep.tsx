import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from 'lucide-react';

interface Rule {
  type: string;
  description: string;
  criteria?: string[];
}

interface RulesDefinitionStepProps {
  rules: Rule[];
  onUpdate: (rules: Rule[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const RulesDefinitionStep: React.FC<RulesDefinitionStepProps> = ({
  rules,
  onUpdate,
  onNext,
  onBack,
}) => {
  useEffect(() => {
    if (rules.length === 0) {
      onUpdate([{
        type: '',
        description: '',
        criteria: ['']
      }]);
    }
  }, []);

  const addRule = () => {
    onUpdate([...rules, { type: '', description: '', criteria: [''] }]);
  };

  const updateRule = (index: number, field: keyof Rule, value: string | string[]) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    onUpdate(newRules);
  };

  const addCriteria = (ruleIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex].criteria = [...(newRules[ruleIndex].criteria || []), ''];
    onUpdate(newRules);
  };

  const updateCriteria = (ruleIndex: number, criteriaIndex: number, value: string) => {
    const newRules = [...rules];
    if (newRules[ruleIndex].criteria) {
      newRules[ruleIndex].criteria![criteriaIndex] = value;
      onUpdate(newRules);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
          Define Analysis Rules
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Specify the rules and criteria for data analysis
        </p>
      </div>
      
      {rules.map((rule, ruleIndex) => (
        <div 
          key={ruleIndex} 
          className="space-y-4 p-4 rounded-lg border border-gray-800 bg-black/20 backdrop-blur-sm transition-all duration-200 hover:border-green-900"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Rule Type
            </label>
            <Input
              value={rule.type}
              onChange={(e) => updateRule(ruleIndex, 'type', e.target.value)}
              placeholder="Rule type (e.g., Calculation, Validation, Score)"
              className="bg-black/20 border-gray-800 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <Textarea
              value={rule.description}
              onChange={(e) => updateRule(ruleIndex, 'description', e.target.value)}
              placeholder="Description of the rule"
              className="bg-black/20 border-gray-800 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Criteria</label>
            {rule.criteria?.map((criterion, criteriaIndex) => (
              <div key={criteriaIndex} className="flex gap-2">
                <Input
                  value={criterion}
                  onChange={(e) => updateCriteria(ruleIndex, criteriaIndex, e.target.value)}
                  placeholder="Enter criterion"
                  className="bg-black/20 border-gray-800 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200"
                />
                <Button
                  onClick={() => {
                    const newRules = [...rules];
                    newRules[ruleIndex].criteria = rule.criteria?.filter((_, i) => i !== criteriaIndex);
                    onUpdate(newRules);
                  }}
                  className="bg-red-900/20 border border-red-800 hover:bg-red-800/20 text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              onClick={() => addCriteria(ruleIndex)}
              className="w-full bg-black/20 border border-gray-800 hover:border-green-900 text-green-400 hover:text-green-300 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Criterion
            </Button>
          </div>
        </div>
      ))}

      <Button 
        onClick={addRule} 
        className="w-full bg-black/20 border border-gray-800 hover:border-green-900 text-green-400 hover:text-green-300 transition-all duration-200"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Rule
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
          disabled={rules.length === 0 || rules.some(rule => !rule.type.trim() || !rule.description.trim())}
          className="bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:shadow-[0_0_25px_rgba(74,222,128,0.5)] transition-all duration-200"
        >
          Next
        </Button>
      </div>
    </div>
  );
}; 