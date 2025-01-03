import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const { fileData } = await request.json();
    
    // Convert base64 to buffer
    const base64Data = fileData.split(',')[1]; // Remove data URL prefix
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Read the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to JSON with header: 1 to use first row as headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Convert to our spreadsheet format
    const spreadsheetData = {
      rows: jsonData.map((row: any) => ({
        cells: Array.isArray(row) ? row.map((cell: any) => ({
          value: cell?.toString() || ''
        })) : [{ value: '' }]
      }))
    };

    return NextResponse.json(spreadsheetData);
  } catch (error) {
    console.error('Error processing Excel file:', error);
    return NextResponse.json(
      { error: 'Failed to process Excel file: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 