import React from 'react';
import { SpreadsheetData } from '../types';

interface SpreadsheetComparisonProps {
  spreadsheets: SpreadsheetData[];
  onCompare: (index1: number, index2: number) => any[];
}

const SpreadsheetComparison: React.FC<SpreadsheetComparisonProps> = ({
  spreadsheets,
  onCompare,
}) => {
  const [sheet1Index, setSheet1Index] = React.useState<number>(0);
  const [sheet2Index, setSheet2Index] = React.useState<number>(1);
  const [differences, setDifferences] = React.useState<any[]>([]);

  const handleCompare = () => {
    const results = onCompare(sheet1Index, sheet2Index);
    setDifferences(results);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Compare Spreadsheets</h3>
      <div className="flex gap-4 mb-4">
        <select
          value={sheet1Index}
          onChange={(e) => setSheet1Index(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {spreadsheets.map((sheet, index) => (
            <option key={index} value={index}>
              {sheet.title}
            </option>
          ))}
        </select>
        <span>vs</span>
        <select
          value={sheet2Index}
          onChange={(e) => setSheet2Index(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {spreadsheets.map((sheet, index) => (
            <option key={index} value={index}>
              {sheet.title}
            </option>
          ))}
        </select>
        <button
          onClick={handleCompare}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Compare
        </button>
      </div>

      {differences.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Differences Found:</h4>
          <div className="space-y-2">
            {differences.map((diff, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                Row {diff.row + 1}, Column {diff.col + 1}:<br />
                Sheet 1: {diff.value1}<br />
                Sheet 2: {diff.value2}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetComparison; 