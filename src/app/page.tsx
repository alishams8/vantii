"use client";
import "@copilotkit/react-ui/styles.css";
import "./globals.css";
import "./copilot.css";
import "./overrides.css";
import React, { useState, useEffect } from "react";
import VantiiLogo from '@/components/VantiiLogo';
import Sidebar from "./components/Sidebar";
import SingleSpreadsheet from "./components/SingleSpreadsheet";
import {
  CopilotKit,
  useCopilotAction,
  useCopilotReadable,
} from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { INSTRUCTIONS } from "./instructions";
import { canonicalSpreadsheetData } from "./utils/canonicalSpreadsheetData";
import { SpreadsheetData } from "./types";
import { PreviewSpreadsheetChanges } from "./components/PreviewSpreadsheetChanges";
import { useAnalyzerStore } from '@/store/analyzerStore';

const HomePage = () => {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      transcribeAudioUrl="/api/transcribe"
      textToSpeechUrl="/api/tts"
    >
      <CopilotSidebar
        instructions={INSTRUCTIONS}
        labels={{
          initial: "Welcome to Vantii Insights! How can I help you?",
          title: "Vantii Insights",
        }}
        defaultOpen={true}
        clickOutsideToClose={false}
        className="bg-black/90 border-emerald-500/20"
        showToggleButton={false}
        customHeader={
          <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black/90">
            <div className="flex items-center">
              <VantiiLogo className="w-8 h-8 mr-3" />
              <span className="text-xl font-semibold text-green-400/70">Vantii Insights</span>
            </div>
          </div>
        }
        customStyles={{
          header: {
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
          },
          body: {
            backgroundColor: 'transparent'
          }
        }}
      >
        <Main />
      </CopilotSidebar>
    </CopilotKit>
  );
};

const Main = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetData[]>([{
    title: "Spreadsheet 1",
    rows: [
      [{ value: "" }, { value: "" }, { value: "" }],
      [{ value: "" }, { value: "" }, { value: "" }],
      [{ value: "" }, { value: "" }, { value: "" }],
    ],
  }]);
  const [selectedSpreadsheetIndex, setSelectedSpreadsheetIndex] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('spreadsheets');
    if (saved) {
      setSpreadsheets(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (isClient && spreadsheets.length > 0) {
      localStorage.setItem('spreadsheets', JSON.stringify(spreadsheets));
    }
  }, [spreadsheets, isClient]);

  useCopilotReadable({
    description: "Current spreadsheets data",
    value: spreadsheets,
  });

  useCopilotAction({
    name: "readSpreadsheet",
    description: "Read the content of a specific spreadsheet",
    parameters: [
      {
        name: "spreadsheetIndex",
        type: "number",
        description: "The index of the spreadsheet to read",
      }
    ],
    handler: ({ spreadsheetIndex }) => {
      if (spreadsheetIndex >= 0 && spreadsheetIndex < spreadsheets.length) {
        return spreadsheets[spreadsheetIndex];
      }
      throw new Error("Invalid spreadsheet index");
    },
  });

  useCopilotAction({
    name: "createSpreadsheet",
    description: "Create a new spreadsheet",
    parameters: [
      {
        name: "rows",
        type: "object[]",
        description: "The rows of the spreadsheet",
        attributes: [
          {
            name: "cells",
            type: "object[]",
            description: "The cells of the row",
            attributes: [
              {
                name: "value",
                type: "string",
                description: "The value of the cell",
              },
            ],
          },
        ],
      },
      {
        name: "title",
        type: "string",
        description: "The title of the spreadsheet",
      },
    ],
    render: (props) => {
      const { rows, title } = props.args;
      const newRows = canonicalSpreadsheetData(rows);

      return (
        <PreviewSpreadsheetChanges
          preCommitTitle="Create spreadsheet"
          postCommitTitle="Spreadsheet created"
          newRows={newRows}
          commit={(rows) => {
            const newSpreadsheet: SpreadsheetData = {
              title: title || "Untitled Spreadsheet",
              rows: rows,
            };
            setSpreadsheets((prev) => [...prev, newSpreadsheet]);
            setSelectedSpreadsheetIndex(spreadsheets.length);
          }}
        />
      );
    },
    handler: ({ rows, title }) => {
      // Do nothing.
      // The preview component will optionally handle committing the changes.
    },
  });

  useCopilotReadable({
    description: "Today's date",
    value: new Date().toLocaleDateString(),
  });

  const handleCreateAnalyzer = async (config: any) => {
    try {
      console.log('Creating analyzer with config:', config);
      
      const response = await fetch('/api/create-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create analyzer');
      }

      const result = await response.json();
      if (result.success && result.analyzer) {
        const addAnalyzer = useAnalyzerStore.getState().addAnalyzer;
        addAnalyzer(result.analyzer);
      }

      return result;
    } catch (error) {
      console.error('Error in handleCreateAnalyzer:', error);
      throw error;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar 
        spreadsheets={spreadsheets}
        selectedSpreadsheetIndex={selectedSpreadsheetIndex}
        setSelectedSpreadsheetIndex={setSelectedSpreadsheetIndex}
        onAddSpreadsheet={(spreadsheet) => {
          const newSpreadsheet = typeof spreadsheet === 'string' 
            ? { 
                title: spreadsheet, 
                rows: [[{ value: "" }, { value: "" }, { value: "" }]]
              } 
            : spreadsheet;
          setSpreadsheets(prev => {
            const updated = [...prev, newSpreadsheet];
            if (isClient) {
              localStorage.setItem('spreadsheets', JSON.stringify(updated));
            }
            return updated;
          });
          setSelectedSpreadsheetIndex(spreadsheets.length);
        }}
        onDeleteSpreadsheet={(index) => {
          setSpreadsheets(prev => {
            const updated = prev.filter((_, i) => i !== index);
            if (isClient) {
              localStorage.setItem('spreadsheets', JSON.stringify(updated));
            }
            return updated;
          });
          if (selectedSpreadsheetIndex >= index) {
            setSelectedSpreadsheetIndex(Math.max(0, selectedSpreadsheetIndex - 1));
          }
        }}
        setSpreadsheets={setSpreadsheets}
        onCreateAnalyzer={handleCreateAnalyzer}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {isClient && spreadsheets.length > 0 && (
          <div className="flex-1 flex flex-col h-screen relative [&_*]:text-gray-900">
            <div className="absolute inset-0 overflow-y-auto">
              <div className="min-h-full">
                <SingleSpreadsheet
                  spreadsheet={spreadsheets[selectedSpreadsheetIndex]}
                  setSpreadsheet={(updatedSheet) => {
                    setSpreadsheets(prev => {
                      const newSpreadsheets = [...prev];
                      newSpreadsheets[selectedSpreadsheetIndex] = updatedSheet;
                      if (isClient) {
                        localStorage.setItem('spreadsheets', JSON.stringify(newSpreadsheets));
                      }
                      return newSpreadsheets;
                    });
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;

