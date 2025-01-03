import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const registryPath = path.join(process.cwd(), 'src/app/analyzers/registry.json');
    
    if (!fs.existsSync(registryPath)) {
      return NextResponse.json({
        success: true,
        analyzers: []
      });
    }

    const registryContent = fs.readFileSync(registryPath, 'utf-8');
    const registry = JSON.parse(registryContent);

    // Transform registry data into analyzer format with all necessary fields
    const analyzers = Object.entries(registry).map(([key, value]: [string, any]) => ({
      name: value.name,
      componentName: value.componentName,
      analyzerType: 'custom',
      configPath: value.configPath,
      // Load and include the analyzer config if it exists
      ...loadAnalyzerConfig(value.configPath)
    }));

    return NextResponse.json({
      success: true,
      analyzers
    });
  } catch (error) {
    console.error('Error loading analyzers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load analyzers' },
      { status: 500 }
    );
  }
}

function loadAnalyzerConfig(configPath: string) {
  try {
    const fullPath = path.join(process.cwd(), 'src', configPath);
    if (fs.existsSync(fullPath)) {
      const configContent = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(configContent);
    }
  } catch (error) {
    console.error(`Error loading analyzer config from ${configPath}:`, error);
  }
  return {};
} 