import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SpreadsheetData } from "@/app/types";
import Spinner from './spinner';

interface SpreadsheetSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheets: SpreadsheetData[];
  onSelect: (spreadsheet: SpreadsheetData) => void;
  isAnalyzing: boolean;
}

const SpreadsheetSelectorDialog: React.FC<SpreadsheetSelectorDialogProps> = ({
  isOpen,
  onClose,
  spreadsheets,
  onSelect,
  isAnalyzing
}) => {
  const [selectedSpreadsheet, setSelectedSpreadsheet] = React.useState<SpreadsheetData | null>(null);

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedSpreadsheet(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border border-cyan-800">
        <DialogHeader>
          <DialogTitle className="text-cyan-100">Select Spreadsheet for Analysis</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="max-h-[300px] overflow-y-auto">
            {spreadsheets.map((spreadsheet, index) => (
              <div
                key={index}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  selectedSpreadsheet === spreadsheet
                    ? 'bg-cyan-900/50 border border-cyan-600'
                    : 'hover:bg-gray-800 border border-transparent'
                }`}
                onClick={() => setSelectedSpreadsheet(spreadsheet)}
              >
                <span className="text-cyan-100">{spreadsheet.title}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4">
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-cyan-400">
                <Spinner size="sm" />
                <span>Analyzing spreadsheet...</span>
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                onClick={onClose}
                className="bg-gray-800 text-cyan-100 hover:bg-gray-700"
                disabled={isAnalyzing}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedSpreadsheet && onSelect(selectedSpreadsheet)}
                className="bg-cyan-900 text-cyan-100 hover:bg-cyan-800"
                disabled={!selectedSpreadsheet || isAnalyzing}
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Analyzing...
                  </div>
                ) : (
                  'Analyze'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpreadsheetSelectorDialog; 