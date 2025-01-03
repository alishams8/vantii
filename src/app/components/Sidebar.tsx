"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AnalyzerCreationWizard } from './analyzer-wizard/AnalyzerCreationWizard';
import { AnalyzerConfig } from '@/types/analyzer';
import { SpreadsheetData } from '@/types';
import { useAnalyzerStore } from '../store/analyzerStore';
import { 
  Settings2, 
  Plus, 
  FileSpreadsheet,
  ArrowLeftRight as Compare,
  Trash2,
  Menu,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import dynamic from 'next/dynamic';
import * as XLSX from 'xlsx';
import VantiiLogo from '@/components/VantiiLogo';

interface SidebarProps {
  spreadsheets: SpreadsheetData[];
  selectedSpreadsheetIndex: number;
  setSelectedSpreadsheetIndex: (index: number) => void;
  onAddSpreadsheet: (spreadsheet: SpreadsheetData | string) => void;
  onCompare: (index1: number, index2: number, compareType: string) => Promise<any>;
  onDeleteSpreadsheet: (index: number) => void;
  onMaturityAnalysis: (analysis: any, analysisType: string) => void;
  setSpreadsheets: React.Dispatch<React.SetStateAction<SpreadsheetData[]>>;
  onCreateAnalyzer: (config: AnalyzerConfig) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'number') {
    // Handle percentages
    if (Math.abs(value) < 1 && value !== 0) {
      return (value * 100).toFixed(2) + '%';
    }
    // Handle regular numbers
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  
  if (typeof value === 'boolean') {
    return value.toString();
  }
  
  return String(value);
};

const Sidebar: React.FC<SidebarProps> = ({
  spreadsheets,
  selectedSpreadsheetIndex,
  setSelectedSpreadsheetIndex,
  onAddSpreadsheet,
  onCompare,
  onDeleteSpreadsheet,
  onMaturityAnalysis,
  setSpreadsheets,
  onCreateAnalyzer,
  isOpen,
  setIsOpen,
}) => {
  const pathname = usePathname();
  const { analyzers, removeAnalyzer, syncWithRegistry } = useAnalyzerStore();
  const [showAnalyzerWizard, setShowAnalyzerWizard] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareIndex1, setCompareIndex1] = useState<number | null>(null);
  const [compareIndex2, setCompareIndex2] = useState<number | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedAnalyzer, setSelectedAnalyzer] = useState<AnalyzerConfig | null>(null);
  const [selectedSpreadsheetForAnalysis, setSelectedSpreadsheetForAnalysis] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddSpreadsheetModal, setShowAddSpreadsheetModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    spreadsheets: false,
    analyzers: false,
    actions: false
  });

  useEffect(() => {
    const loadAnalyzers = async () => {
      try {
        const response = await fetch('/api/analyzers');
        const data = await response.json();
        if (data.success) {
          syncWithRegistry(data.analyzers);
        }
      } catch (error) {
        console.error('Error loading analyzers:', error);
      }
    };

    loadAnalyzers();
  }, [syncWithRegistry]);

  async function handleCreateAnalyzer(config: any) {
    try {
      // Update to use backend API directly
      const response = await fetch('http://localhost:8000/api/backend/create-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create analyzer');
      }

      // Rest of your code...
    } catch (error) {
      console.error('Error in handleCreateAnalyzer:', error);
      throw error;
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert the worksheet to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Filter out completely empty rows
      const nonEmptyRows = jsonData.filter((row: any[]) => 
        row.some(cell => cell !== null && cell !== undefined && cell !== '')
      );

      // Transform the filtered data into our SpreadsheetData format
      const spreadsheetData: SpreadsheetData = {
        title: file.name,
        rows: nonEmptyRows.map(row => ({
          cells: Array.isArray(row) 
            ? row.map(cell => ({
                value: cell !== null && cell !== undefined ? String(cell) : ""
              }))
            : [{ value: String(row) }]
        }))
      };

      onAddSpreadsheet(spreadsheetData);
      setShowAddSpreadsheetModal(false);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
    }
  };

  const handleAddSpreadsheet = () => {
    setShowAddSpreadsheetModal(true);
  };

  const handleCompare = async () => {
    if (compareIndex1 !== null && compareIndex2 !== null) {
      await onCompare(compareIndex1, compareIndex2, 'generic');
      setShowCompareModal(false);
      setCompareIndex1(null);
      setCompareIndex2(null);
    }
  };

  const handleDeleteAnalyzer = async (analyzer: AnalyzerConfig) => {
    try {
        const confirmDelete = window.confirm(`Are you sure you want to delete the analyzer "${analyzer.name}"?`);
        if (!confirmDelete) return;

        // Create the analyzer name in the correct format
        const analyzerName = analyzer.name.replace(/\s+/g, '').toLowerCase();
        
        console.log(`Attempting to delete analyzer: ${analyzerName}`);

        // Update the URL to use the Next.js API route
        const response = await fetch(`/api/backend/delete-analyzer/${analyzerName}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const responseData = await response.json();
        console.log('Delete response:', responseData);

        if (!response.ok) {
            console.error('Delete response error:', responseData);
            throw new Error(responseData.detail || responseData.error || 'Failed to delete analyzer');
        }

        if (responseData.success) {
            removeAnalyzer(analyzer.name);
            alert(`Successfully deleted analyzer "${analyzer.name}"`);
        } else {
            throw new Error(responseData.error || 'Failed to delete analyzer');
        }

    } catch (error) {
        console.error('Error deleting analyzer:', error);
        alert('Failed to delete analyzer: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleAnalyzerClick = (analyzer: AnalyzerConfig) => {
    setSelectedAnalyzer(analyzer);
    setShowAnalysisModal(true);
  };

  const createAnalysisSpreadsheet = (responseData: any, spreadsheetTitle: string, analyzerName: string): SpreadsheetData => {
    const rows: { cells: { value: string }[] }[] = [];

    // Process analysis results (handle both formats)
    const analysisResults = responseData.results.analysis_results || 
      (responseData.results.custom_analysis?.[0]?.data || []);

    if (analysisResults.length > 0) {
      // Get all possible keys from the first result for headers
      const firstResult = analysisResults[0];
      const headers = Object.keys(firstResult).filter(key => 
        typeof firstResult[key] !== 'object' || firstResult[key] === null
      );

      // Add headers
      rows.push({
        cells: headers.map(header => ({ 
          value: header.charAt(0).toUpperCase() + header.slice(1).replace(/_/g, ' ')
        }))
      });

      // Add data rows
      analysisResults.forEach((result: any) => {
        rows.push({
          cells: headers.map(key => ({
            value: formatValue(result[key])
          }))
        });
      });

      // Add a separator
      rows.push({ cells: [{ value: '' }] });
    }

    // Add analysis description if available
    if (responseData.results.custom_analysis?.[0]?.description) {
      rows.push({ 
        cells: [{ 
          value: responseData.results.custom_analysis[0].description 
        }] 
      });
      rows.push({ cells: [{ value: '' }] });
    }

    // Add metadata if available
    if (responseData.metadata) {
      rows.push({ cells: [{ value: 'Metadata' }] });
      Object.entries(responseData.metadata).forEach(([key, value]) => {
        rows.push({
          cells: [
            { value: key },
            { value: formatValue(value) }
          ]
        });
      });
    }

    return {
      title: `${spreadsheetTitle} - ${analyzerName} Analysis`,
      rows: rows.length > 0 ? rows : [{ cells: [{ value: 'No analysis results available' }] }]
    };
  };

  const handleAnalysis = async () => {
    if (!selectedAnalyzer || selectedSpreadsheetForAnalysis === null) return;

    setIsAnalyzing(true);
    try {
      const spreadsheetToAnalyze = spreadsheets[selectedSpreadsheetForAnalysis];
      
      if (!spreadsheetToAnalyze || !spreadsheetToAnalyze.rows) {
        throw new Error('Invalid spreadsheet data');
      }

      // Format the request data to match what the analyzer expects
      const analysisData = {
        spreadsheet: {
          title: spreadsheetToAnalyze.title,
          rows: spreadsheetToAnalyze.rows.map(row => ({
            cells: row.cells.map(cell => ({
              value: cell.value || ""
            }))
          }))
        },
        options: {}
      };

      // Get the analyzer name from the registry format
      const analyzerEndpoint = selectedAnalyzer.name.toLowerCase().replace(/\s+/g, '-') + 'analyzer';
      console.log('Selected Analyzer:', selectedAnalyzer);
      console.log('Analyzer Endpoint:', analyzerEndpoint);
      console.log('Analysis Data:', analysisData);
      
      const response = await fetch(`/api/${analyzerEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      // Get the raw response text first
      const responseText = await response.text();
      console.log('Raw Response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response from analyzer');
      }

      if (!response.ok) {
        console.error('Error Response:', responseData);
        throw new Error(
          responseData.detail?.error || 
          responseData.details || 
          responseData.error || 
          'Analysis failed'
        );
      }

      if (!responseData || !responseData.results) {
        throw new Error('Invalid analysis result received');
      }

      // Create a new spreadsheet with the analysis results
      const analysisSpreadsheet = createAnalysisSpreadsheet(
        responseData,
        spreadsheetToAnalyze.title,
        selectedAnalyzer.name
      );

      // Add the analysis spreadsheet to the list
      setSpreadsheets(prev => [...prev, analysisSpreadsheet]);

      setShowAnalysisModal(false);
      setSelectedAnalyzer(null);
      setSelectedSpreadsheetForAnalysis(null);

    } catch (error) {
      console.error('Analysis error:', error);
      alert(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (section: 'spreadsheets' | 'analyzers' | 'actions') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Render analyzers from Zustand store
  const renderAnalyzers = () => (
    <div className="mt-2 space-y-1">
      {analyzers.map((analyzer) => (
        <div key={analyzer.name} className="flex items-center px-2 py-2 group">
          <Button
            onClick={() => handleAnalyzerClick(analyzer)}
            className="flex-1 justify-start text-left text-blue-400/70 hover:bg-blue-400/5"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            <span className="truncate">{analyzer.name}</span>
          </Button>
          <button
            onClick={() => handleDeleteAnalyzer(analyzer)}
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 ml-2"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-20 w-80 bg-gray-900 transform transition-transform duration-300 ease-in-out border-r border-green-400/20 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Remove the X button from header */}
        <div className="flex items-center p-4 border-b border-green-400/20">
          <VantiiLogo className="w-8 h-8 mr-3" />
          <h2 className="text-xl font-semibold text-green-400/70">Vantii Insights</h2>
        </div>

        <nav className="h-full flex flex-col p-4">
          {/* Primary Actions */}
          <div className="space-y-2 mb-6">
            <Button
              onClick={() => setShowAddSpreadsheetModal(true)}
              className="flex items-center w-full justify-start px-4 py-2 text-left text-green-400/70 hover:bg-green-400/5"
            >
              <Plus className="w-5 h-5 mr-3" />
              Add Spreadsheet
            </Button>

            <Button
              onClick={() => setShowAnalyzerWizard(true)}
              className="flex items-center w-full justify-start px-4 py-2 text-left text-green-400/70 hover:bg-green-400/5"
            >
              <Settings2 className="w-5 h-5 mr-3" />
              Create Analyzer
            </Button>
          </div>

          {/* Spreadsheets Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('spreadsheets')}
              className="flex items-center w-full px-2 py-2 text-sm font-semibold text-green-400/70 uppercase hover:bg-green-400/5 rounded"
            >
              {expandedSections.spreadsheets ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              Spreadsheets
            </button>
            {expandedSections.spreadsheets && (
              <div className="mt-2 space-y-1">
                {spreadsheets.map((sheet, index) => (
                  <div key={index} className="flex items-center px-2 py-2 group">
                    <Button
                      onClick={() => setSelectedSpreadsheetIndex(index)}
                      className={`flex-1 justify-start text-left text-green-400/70 hover:bg-green-400/5 ${
                        selectedSpreadsheetIndex === index ? 'bg-green-400/10' : ''
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      <span className="truncate">{sheet.title}</span>
                    </Button>
                    <button
                      onClick={() => onDeleteSpreadsheet(index)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Analyzers Section - Updated to always show */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('analyzers')}
              className="flex items-center w-full px-2 py-2 text-sm font-semibold text-green-400/70 uppercase hover:bg-green-400/5 rounded"
            >
              {expandedSections.analyzers ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              Custom Analyzers
            </button>
            {expandedSections.analyzers && (
              renderAnalyzers()
            )}
          </div>

          {/* Actions Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('actions')}
              className="flex items-center w-full px-2 py-2 text-sm font-semibold text-green-400/70 uppercase hover:bg-green-400/5 rounded"
            >
              {expandedSections.actions ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              Actions
            </button>
            {expandedSections.actions && (
              <div className="mt-2 space-y-2">
                <Button
                  onClick={() => setShowCompareModal(true)}
                  className="flex items-center w-full justify-start px-4 py-2 text-left text-green-400/70 hover:bg-green-400/5"
                >
                  <Compare className="w-5 h-5 mr-3" />
                  Compare Spreadsheets
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Single toggle button that changes between hamburger and X */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-30 p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-green-400/70 transition-all duration-200 ${
          isOpen ? 'left-[296px]' : 'left-4'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Analyzer Creation Modal */}
      {showAnalyzerWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <AnalyzerCreationWizard
              onComplete={handleCreateAnalyzer}
              onCancel={() => setShowAnalyzerWizard(false)}
              isLoading={isAnalyzing}
            />
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-green-400 mb-4">Compare Spreadsheets</h2>
            <div className="space-y-4">
              <div>
                <label className="text-green-400">First Spreadsheet</label>
                <select
                  value={compareIndex1 ?? ''}
                  onChange={(e) => setCompareIndex1(Number(e.target.value))}
                  className="w-full bg-gray-800 text-green-400 border border-green-400/20 rounded p-2"
                >
                  <option value="">Select spreadsheet...</option>
                  {spreadsheets.map((sheet, index) => (
                    <option key={index} value={index}>{sheet.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-green-400">Second Spreadsheet</label>
                <select
                  value={compareIndex2 ?? ''}
                  onChange={(e) => setCompareIndex2(Number(e.target.value))}
                  className="w-full bg-gray-800 text-green-400 border border-green-400/20 rounded p-2"
                >
                  <option value="">Select spreadsheet...</option>
                  {spreadsheets.map((sheet, index) => (
                    <option key={index} value={index}>{sheet.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => {
                    setShowCompareModal(false);
                    setCompareIndex1(null);
                    setCompareIndex2(null);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-green-400"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCompare}
                  disabled={compareIndex1 === null || compareIndex2 === null}
                  className="bg-green-600 hover:bg-green-700 text-black"
                >
                  Compare
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && selectedAnalyzer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-green-400 mb-4">
              Run {selectedAnalyzer.name}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-green-400">Select Spreadsheet to Analyze</label>
                <select
                  value={selectedSpreadsheetForAnalysis ?? ''}
                  onChange={(e) => setSelectedSpreadsheetForAnalysis(Number(e.target.value))}
                  className="w-full bg-gray-800 text-green-400 border border-green-400/20 rounded p-2"
                >
                  <option value="">Select spreadsheet...</option>
                  {spreadsheets.map((sheet, index) => (
                    <option key={index} value={index}>{sheet.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => {
                    setShowAnalysisModal(false);
                    setSelectedAnalyzer(null);
                    setSelectedSpreadsheetForAnalysis(null);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-green-400"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAnalysis}
                  disabled={selectedSpreadsheetForAnalysis === null || isAnalyzing}
                  className="bg-green-600 hover:bg-green-700 text-black"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Spreadsheet Modal */}
      {showAddSpreadsheetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-green-400 mb-4">Add Spreadsheet</h2>
            <div className="space-y-4">
              <div>
                <label className="text-green-400 block mb-2">Upload Excel File</label>
                <div className="flex flex-col gap-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="block w-full text-green-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-green-600 file:text-black
                      hover:file:bg-green-700
                      file:cursor-pointer"
                  />
                  <p className="text-sm text-green-400/70">
                    Supported formats: .xlsx, .xls
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  onClick={() => setShowAddSpreadsheetModal(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-green-400"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const name = prompt('Enter spreadsheet name:');
                    if (name) {
                      onAddSpreadsheet({ title: name, rows: [{ cells: [{ value: '' }] }] });
                      setShowAddSpreadsheetModal(false);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-black"
                >
                  Create Empty
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
