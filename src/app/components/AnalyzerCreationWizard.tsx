import React, { useState } from 'react';
import { PromptConfigStep } from './analyzer-wizard/PromptConfigStep';
import { TemplateSelectionStep } from './analyzer-wizard/TemplateSelectionStep';
import { AnalyzerConfig, PromptTemplate } from '@/types/analyzer';
import { defaultStructure } from '../config/analyzer';
import { useRouter } from 'next/navigation';
import { useAnalyzerStore } from '../store/analyzerStore';

interface AnalyzerCreationWizardProps {
  onComplete: (config: AnalyzerConfig) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface ProgressStatus {
  step: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
}

export const AnalyzerCreationWizard: React.FC<AnalyzerCreationWizardProps> = ({
  onComplete,
  onCancel,
  isLoading = false
}) => {
  const [step, setStep] = useState<'template' | 'config'>('template');
  const [config, setConfig] = useState<Partial<AnalyzerConfig>>({
    name: '',
    structure: defaultStructure,
    systemPrompt: {
      role: 'system',
      content: '',
      description: 'Custom system prompt'
    },
    userPrompt: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { addAnalyzer } = useAnalyzerStore();

  const handleTemplateSelect = (template: PromptTemplate) => {
    console.log('Selected template:', template);
    setConfig({
      name: template.name,
      structure: template.structure,
      systemPrompt: template.systemPrompt,
      userPrompt: '' // User needs to provide specific analysis prompt
    });
    setStep('config');
  };

  const handleConfigUpdate = (updates: Partial<AnalyzerConfig>) => {
    console.log('Updating config:', updates);
    setConfig((prev: Partial<AnalyzerConfig>) => ({
      ...prev,
      ...updates
    }));
  };

  const handleComplete = (finalConfig: AnalyzerConfig) => {
    console.log('AnalyzerCreationWizard - Completing with config:', finalConfig);
    onComplete(finalConfig);
  };

  const createAnalyzer = async () => {
    if (!config.name) return;
    setIsCreating(true);

    try {
      const response = await fetch('/api/create-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create analyzer');
      }

      if (data.success) {
        addAnalyzer({
          name: config.name,
          analyzerType: config.analyzerType || 'custom',
          structure: config.structure,
          systemPrompt: config.systemPrompt,
          userPrompt: config.userPrompt,
          componentName: data.analyzer.componentName
        });
        
        router.push('/');
        onCancel();
      }
    } catch (error) {
      console.error('Error creating analyzer:', error);
      setIsCreating(false);
    }
  };

  const renderLoadingSpinner = () => {
    if (!isCreating) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700">Creating analyzer...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      {step === 'template' ? (
        <TemplateSelectionStep
          onTemplateSelect={handleTemplateSelect}
          onCustomTemplate={() => {
            setConfig({
              name: '',
              structure: defaultStructure,
              systemPrompt: {
                role: 'system',
                content: '',
                description: 'Custom system prompt'
              },
              userPrompt: ''
            });
            setStep('config');
          }}
          disabled={isLoading}
        />
      ) : (
        <PromptConfigStep
          config={config}
          onUpdate={handleConfigUpdate}
          onComplete={handleComplete}
          onBack={() => setStep('template')}
          disabled={isLoading}
          isLoading={isLoading}
        />
      )}
      
      {renderLoadingSpinner()}

      <div className="mt-6 flex justify-between">
        <button
          onClick={onCancel}
          disabled={isCreating}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300"
        >
          Cancel
        </button>
        
        <button
          onClick={createAnalyzer}
          disabled={isCreating || !config.name}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isCreating ? 'Creating...' : 'Create Analyzer'}
        </button>
      </div>
    </div>
  );
}; 