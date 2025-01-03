import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SpreadsheetData, AnalyzerConfig } from '@/types';
import { defaultPromptTemplates } from '../../config/promptTemplates';
import path from 'path';
import fs from 'fs';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Load analyzer config from generated files
const loadAnalyzerConfig = (analyzerName: string): AnalyzerConfig | null => {
  try {
    // First try loading from registry
    const registryPath = path.join(process.cwd(), 'src', 'app', 'analyzers', 'registry.json');
    if (fs.existsSync(registryPath)) {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      if (registry[analyzerName]) {
        const configPath = path.join(process.cwd(), 'src', 'app', registry[analyzerName].configPath);
        if (fs.existsSync(configPath)) {
          return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
      }
    }

    // If not found in registry, try localStorage
    const localStoragePath = path.join(process.cwd(), 'localStorage.json');
    if (fs.existsSync(localStoragePath)) {
      const data = fs.readFileSync(localStoragePath, 'utf8');
      const analyzers = JSON.parse(data);
      const analyzer = analyzers.find((a: any) => 
        a.name.toLowerCase().replace(/\s+/g, '-') + '-analyzer' === analyzerName
      );
      if (analyzer) {
        return analyzer;
      }
    }

    return null;
  } catch (error) {
    console.error(`Failed to load analyzer config for ${analyzerName}:`, error);
    return null;
  }
};

function convertToSpreadsheet(data: any, outputFormat: any): SpreadsheetData {
  const spreadsheet: SpreadsheetData = {
    title: "Analysis Result",
    rows: []
  };

  try {
    // First try to parse as JSON if it's a string
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        // If parsing fails, treat it as plain text
        return {
          title: "Analysis Result",
          rows: [
            {
              cells: [
                { value: "Analysis" },
                { value: data || 'No analysis result' }
              ]
            }
          ]
        };
      }
    }

    // Handle null/undefined data
    if (!parsedData) {
      return {
        title: "Analysis Result",
        rows: [
          {
            cells: [
              { value: "Error" },
              { value: "No analysis data available" }
            ]
          }
        ]
      };
    }

    // Case 1: Data is already in array format with findings
    if (parsedData.findings && Array.isArray(parsedData.findings)) {
      const firstItem = parsedData.findings[0] || {};
      spreadsheet.rows = [
        // Header row
        {
          cells: Object.keys(firstItem).map(key => ({
            value: key.replace(/([A-Z])/g, ' $1').trim()
          }))
        },
        // Data rows with null checks
        ...parsedData.findings.map((item: any) => ({
          cells: Object.values(item).map((value: any) => ({
            value: value?.toString() || ''
          }))
        }))
      ];
    }
    // Case 2: Data is a simple array
    else if (Array.isArray(parsedData)) {
      if (parsedData.length > 0 && typeof parsedData[0] === 'object') {
        const headers = Object.keys(parsedData[0]);
        spreadsheet.rows = [
          // Header row
          {
            cells: headers.map(header => ({
              value: header.replace(/([A-Z])/g, ' $1').trim()
            }))
          },
          // Data rows
          ...parsedData.map(item => ({
            cells: headers.map(header => ({
              value: (item[header]?.toString() || '')
            }))
          }))
        ];
      } else {
        // Simple array of values
        spreadsheet.rows = parsedData.map(item => ({
          cells: [{ value: item?.toString() || '' }]
        }));
      }
    }
    // Case 3: Data is an object
    else if (typeof parsedData === 'object' && parsedData !== null) {
      spreadsheet.rows = [
        // Header row
        {
          cells: [
            { value: 'Property' },
            { value: 'Value' }
          ]
        },
        // Data rows
        ...Object.entries(parsedData).map(([key, value]) => ({
          cells: [
            { value: key.replace(/([A-Z])/g, ' $1').trim() },
            { value: typeof value === 'object' 
              ? JSON.stringify(value, null, 2) 
              : value?.toString() || ''
            }
          ]
        }))
      ];
    }
    // Case 4: Data is a primitive value (string, number, boolean)
    else {
      spreadsheet.rows = [
        {
          cells: [
            { value: "Analysis" },
            { value: String(parsedData) }
          ]
        }
      ];
    }

    // Add metadata if available with null checks
    if (parsedData.score !== undefined || parsedData.summary) {
      spreadsheet.metadata = {
        score: parsedData.score ?? null,
        summary: parsedData.summary || '',
        timestamp: new Date().toISOString()
      };
    }

    return spreadsheet;
  } catch (error) {
    console.error('Error converting response to spreadsheet:', error);
    return {
      title: "Analysis Result",
      rows: [
        {
          cells: [
            { value: "Error" },
            { value: "Failed to process analysis results" }
          ]
        }
      ]
    };
  }
}

// Helper function to safely get params
const getParams = async (params: { analyzer: string }) => {
  return {
    analyzer: await Promise.resolve(params.analyzer)
  };
};

export async function POST(
  request: NextRequest,
  { params }: { params: { analyzer: string } }
) {
  try {
    // Get params safely using getParams helper
    const { analyzer: analyzerName } = await getParams(params);
    const data = await request.json();

    console.log('Sending request to:', `http://localhost:8000/api/${analyzerName}/analyze`);
    console.log('Request data:', data);

    const response = await fetch(`http://localhost:8000/api/${analyzerName}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text(); // First get the raw text
      try {
        const error = JSON.parse(errorText);
        return NextResponse.json(error, { status: response.status });
      } catch (e) {
        // If it's not JSON, return the raw error
        return NextResponse.json({ 
          error: 'Analysis failed', 
          details: errorText 
        }, { status: response.status });
      }
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in analyzer route:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { analyzer: string } }
) {
  try {
    const { analyzer: analyzerName } = params;
    
    // Make a request to our consolidated delete endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/delete-analyzer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: analyzerName.split('-analyzer')[0],
        componentName: analyzerName.split('-analyzer')[0] + 'Analyzer'
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete analyzer');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DELETE route:', error);
    return NextResponse.json({
      error: 'Failed to delete analyzer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { analyzer: string } }
) {
  const analyzerParams = await getParams(params);
  // ... rest of the code
} 