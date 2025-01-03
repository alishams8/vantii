import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CustomAnalyzerData } from '../create-analyzer/route';
import { useState, useEffect } from 'react';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'localStorage.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([]);
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const analyzers: CustomAnalyzerData[] = JSON.parse(data);

    return NextResponse.json(analyzers);
  } catch (error) {
    console.error('Error listing analyzers:', error);
    return NextResponse.json({ error: 'Failed to list analyzers' }, { status: 500 });
  }
} 