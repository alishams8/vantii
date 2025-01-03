import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const analyzerName = params.name;
    
    console.log(`Forwarding delete request for analyzer: ${analyzerName}`);

    const response = await fetch(`http://localhost:8000/api/backend/delete-analyzer/${analyzerName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Gateway response:', data);

    if (!response.ok) {
      console.error('Gateway delete error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in delete-analyzer route:', error);
    return NextResponse.json(
      { error: 'Failed to delete analyzer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 