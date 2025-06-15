import { NextRequest, NextResponse } from 'next/server';

interface TextRequest {
  text: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');

  if (!text) {
    return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/generate-podcast-text?text=${encodeURIComponent(text)}`);
    
    if (!response.ok) {
      throw new Error('Failed to generate podcast text');
    }

    // SSE 응답을 그대로 전달
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate podcast text' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { text, voice_id } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const response = await fetch('http://127.0.0.1:8000/generate-podcast-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice_id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Return the response as a stream
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate podcast text' },
      { status: 500 }
    );
  }
} 