import { AnalyzerStructure } from '../types/analyzer';

export const defaultStructure: AnalyzerStructure = {
  inputFormat: {
    type: "object",
    properties: [
      {
        name: "data",
        type: "object",
        description: "The data to analyze",
        required: true,
        nested: [
          {
            name: "tasks",
            type: "array",
            description: "List of tasks"
          },
          {
            name: "spreadsheet",
            type: "object",
            description: "Spreadsheet data"
          }
        ]
      }
    ]
  },
  outputFormat: {
    type: "object",
    properties: [
      {
        name: "findings",
        type: "array",
        description: "Analysis findings",
        required: true
      },
      {
        name: "score",
        type: "number",
        description: "Overall score",
        required: true
      }
    ]
  },
  scoringRules: [
    {
      score: 1,
      criteria: "Basic Analysis",
      requirements: [
        "Identify key points",
        "Provide basic observations"
      ]
    },
    {
      score: 3,
      criteria: "Detailed Analysis",
      requirements: [
        "In-depth examination",
        "Supporting evidence",
        "Clear explanations"
      ]
    },
    {
      score: 5,
      criteria: "Expert Analysis",
      requirements: [
        "Comprehensive insights",
        "Actionable recommendations",
        "Strategic implications"
      ]
    }
  ]
}; 