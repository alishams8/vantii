"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Loader2, X, Check } from 'lucide-react'
import { AnalyzerNameStep } from './AnalyzerNameStep'
import { InputDefinitionStep } from './InputDefinitionStep'
import { RulesDefinitionStep } from './RulesDefinitionStep'
import { OutputDefinitionStep } from './OutputDefinitionStep'
import { AnalyzerTypeStep } from './AnalyzerTypeStep'

interface AnalyzerCreationWizardProps {
  onComplete: (config: any) => void;
  onCancel: () => void;
}

interface Step {
  id: number
  label: string
  component: React.ReactNode
}

export const AnalyzerCreationWizard: React.FC<AnalyzerCreationWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isCreating, setIsCreating] = React.useState(false)
  const [config, setConfig] = React.useState({
    name: '',
    inputs: [],
    rules: [],
    outputs: [],
    analyzerType: '',
    typeDescription: '',
    userPrompt: ''
  });

  const [creationStages, setCreationStages] = React.useState([
    { name: 'Generating Files', status: 'pending' },
    { name: 'Building Docker Image', status: 'pending' },
    { name: 'Starting Service', status: 'pending' }
  ]);

  const steps: Step[] = [
    {
      id: 1,
      label: "Name",
      component: (
        <AnalyzerNameStep
          name={config.name}
          onUpdate={(name) => setConfig({ ...config, name })}
          onNext={handleNext}
        />
      ),
    },
    {
      id: 2,
      label: "Inputs",
      component: (
        <InputDefinitionStep
          inputs={config.inputs}
          onUpdate={(inputs) => setConfig({ ...config, inputs })}
          onNext={handleNext}
          onBack={handleBack}
        />
      ),
    },
    {
      id: 3,
      label: "Rules",
      component: (
        <RulesDefinitionStep
          rules={config.rules}
          onUpdate={(rules) => setConfig({ ...config, rules })}
          onNext={handleNext}
          onBack={handleBack}
        />
      ),
    },
    {
      id: 4,
      label: "Outputs",
      component: (
        <OutputDefinitionStep
          outputs={config.outputs}
          onUpdate={(outputs) => setConfig({ ...config, outputs })}
          onNext={handleNext}
          onBack={handleBack}
        />
      ),
    },
    {
      id: 5,
      label: "Type",
      component: (
        <AnalyzerTypeStep
          analyzerType={config.analyzerType}
          description={config.typeDescription}
          onUpdate={(type, description) => 
            setConfig({ ...config, analyzerType: type, typeDescription: description })
          }
          onNext={handleNext}
          onBack={handleBack}
        />
      ),
    },
    {
      id: 6,
      label: "Confirm",
      component: (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
            Define Analysis Prompt
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Specify the prompt that will guide the analysis process
          </p>
          <textarea
            value={config.userPrompt}
            onChange={(e) => setConfig({ ...config, userPrompt: e.target.value })}
            placeholder="Enter the analysis prompt that will be used to process the data..."
            className="w-full h-64 p-4 bg-black/20 text-white border border-gray-800 rounded-lg focus:border-green-400/50 focus:ring-green-400/20 transition-all duration-200"
          />
          <div className="flex justify-between gap-4 pt-4">
            <Button 
              onClick={handleBack}
              className="bg-black/20 border border-gray-800 hover:border-green-900 text-gray-400 hover:text-white transition-all duration-200"
            >
              Back
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={isCreating || !config.userPrompt.trim()}
              className="bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:shadow-[0_0_25px_rgba(74,222,128,0.5)] transition-all duration-200"
            >
              {isCreating ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Analyzer'
              )}
            </Button>
          </div>
        </div>
      ),
    },
  ]

  function handleNext() {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  async function handleComplete() {
    try {
      setIsCreating(true);
      
      setCreationStages(stages => stages.map((stage, index) => 
        index === 0 ? { ...stage, status: 'in-progress' } : stage
      ));

      const finalConfig = {
        name: config.name,
        analyzerType: config.analyzerType,
        structure: {
          inputs: config.inputs.map(input => ({
            type: input.type,
            description: input.description,
            format: input.format || []
          })),
          rules: config.rules.map(rule => ({
            type: rule.type,
            description: rule.description,
            criteria: rule.criteria || []
          })),
          outputs: config.outputs.map(output => ({
            name: output.name,
            type: output.type,
            description: output.description,
            format: output.format || ''
          }))
        },
        systemPrompt: {
          role: 'system',
          content: config.typeDescription,
          description: config.typeDescription
        },
        userPrompt: config.userPrompt
      };

      if (!finalConfig.name?.trim()) {
        throw new Error('Analyzer name is required');
      }
      if (!finalConfig.analyzerType?.trim()) {
        throw new Error('Analyzer type is required');
      }
      if (!finalConfig.userPrompt?.trim()) {
        throw new Error('User prompt is required');
      }
      if (!finalConfig.structure.inputs?.length) {
        throw new Error('At least one input is required');
      }
      if (!finalConfig.structure.rules?.length) {
        throw new Error('At least one rule is required');
      }
      if (!finalConfig.structure.outputs?.length) {
        throw new Error('At least one output is required');
      }

      finalConfig.structure.inputs.forEach((input, index) => {
        if (!input.type?.trim() || !input.description?.trim()) {
          throw new Error(`Input ${index + 1} is missing required fields`);
        }
      });

      finalConfig.structure.rules.forEach((rule, index) => {
        if (!rule.type?.trim() || !rule.description?.trim()) {
          throw new Error(`Rule ${index + 1} is missing required fields`);
        }
      });

      finalConfig.structure.outputs.forEach((output, index) => {
        if (!output.name?.trim() || !output.type?.trim() || !output.description?.trim()) {
          throw new Error(`Output ${index + 1} is missing required fields`);
        }
      });

      const response = await fetch('http://localhost:8000/api/backend/create-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(finalConfig),
      });

      setCreationStages(stages => stages.map((stage, index) => 
        index === 0 ? { ...stage, status: 'complete' } 
        : index === 1 ? { ...stage, status: 'in-progress' }
        : stage
      ));

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create analyzer');
      }

      setCreationStages(stages => stages.map((stage, index) => 
        index <= 1 ? { ...stage, status: 'complete' }
        : index === 2 ? { ...stage, status: 'in-progress' }
        : stage
      ));

      await new Promise(resolve => setTimeout(resolve, 1000));

      setCreationStages(stages => stages.map(stage => ({ ...stage, status: 'complete' })));

      await onComplete(finalConfig);
    } catch (error) {
      console.error('Error creating analyzer:', error);
      setCreationStages(stages => stages.map(stage => 
        stage.status === 'in-progress' ? { ...stage, status: 'error' } : stage
      ));
      alert(error instanceof Error ? error.message : 'Failed to create analyzer');
    } finally {
      setIsCreating(false);
    }
  }

  const renderLoadingOverlay = () => {
    if (!isCreating) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg shadow-xl flex flex-col items-center space-y-6">
          <Loader2 className="w-12 h-12 text-green-400 animate-spin" />
          <p className="text-green-400 font-medium">Creating analyzer...</p>
          
          <div className="space-y-3 min-w-[250px]">
            {creationStages.map((stage, index) => (
              <div key={stage.name} className="flex items-center justify-between">
                <span className={cn(
                  "text-sm",
                  stage.status === 'complete' ? 'text-green-400' :
                  stage.status === 'in-progress' ? 'text-white' :
                  stage.status === 'error' ? 'text-red-400' :
                  'text-gray-400'
                )}>
                  {stage.name}
                </span>
                <span className="ml-3">
                  {stage.status === 'complete' && (
                    <Check className="w-4 h-4 text-green-400" />
                  )}
                  {stage.status === 'in-progress' && (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  )}
                  {stage.status === 'error' && (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
            Create New Analyzer
          </h1>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Cancel</span>
          </Button>
        </div>

        <div className="relative mb-12">
          <div className="absolute left-0 right-0 h-[2px] bg-gray-800 top-[15px]" />
          <div
            className="absolute left-0 h-[2px] bg-gradient-to-r from-green-400 to-green-600 top-[15px] transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
          <div className="relative z-10 flex justify-between">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200",
                  step.id === currentStep
                    ? "bg-gradient-to-r from-green-400 to-green-600 text-white shadow-[0_0_15px_rgba(74,222,128,0.5)]"
                    : step.id < currentStep
                    ? "bg-gradient-to-r from-green-400 to-green-600 text-white"
                    : "bg-gray-800 text-gray-500"
                )}
              >
                {step.id}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {steps[currentStep - 1].component}
        </div>
      </div>

      {renderLoadingOverlay()}
    </div>
  )
} 