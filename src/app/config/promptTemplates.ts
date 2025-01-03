import { PromptTemplate } from '../types/analyzer';
import { defaultStructure } from './analyzer';

export const defaultPromptTemplates: PromptTemplate[] = [
  {
    name: "Code Quality Analyzer",
    description: "Analyzes code quality and provides improvement suggestions",
    systemPrompt: {
      role: "system",
      content: "You are an expert code reviewer. Analyze code quality focusing on maintainability, readability, and best practices.",
      description: "Default code quality analysis prompt"
    },
    structure: defaultStructure
  },
  {
    name: "Performance Analyzer",
    description: "Analyzes performance metrics and bottlenecks",
    systemPrompt: {
      role: "system",
      content: "You are a performance optimization expert. Analyze performance metrics and identify potential bottlenecks and optimization opportunities.",
      description: "Default performance analysis prompt"
    },
    structure: defaultStructure
  }
]; 