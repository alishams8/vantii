import React from 'react';
import { Button } from '@/components/ui/button';
import { PromptTemplate } from '@/types/analyzer';
import { templates } from '@/app/config/promptTemplates';

interface TemplateSelectionStepProps {
  onTemplateSelect: (template: PromptTemplate) => void;
  onCustomTemplate: () => void;
  disabled?: boolean;
}

export const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  onTemplateSelect,
  onCustomTemplate,
  disabled = false
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-green-400">Select Template</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Button
            key={template.name}
            onClick={() => onTemplateSelect(template)}
            className="p-4 text-left hover:bg-green-400/5 border border-green-400/20"
            disabled={disabled}
          >
            <div>
              <h3 className="font-semibold text-green-400">{template.name}</h3>
              <p className="text-sm text-green-400/70">{template.description}</p>
            </div>
          </Button>
        ))}
        <Button
          onClick={onCustomTemplate}
          className="p-4 text-left hover:bg-green-400/5 border border-green-400/20"
          disabled={disabled}
        >
          <div>
            <h3 className="font-semibold text-green-400">Custom Template</h3>
            <p className="text-sm text-green-400/70">Create your own analyzer from scratch</p>
          </div>
        </Button>
      </div>
    </div>
  );
}; 