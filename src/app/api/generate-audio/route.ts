import { NextRequest, NextResponse } from 'next/server';

interface TTSRequest {
  text: string;
  voice_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const { text, voice_id } = await req.json() as TTSRequest;

    if (!text || !voice_id) {
      return NextResponse.json(
        { error: 'Text and voice_id are required' },
        { status: 400 }
      );
    }

    // FastAPI 서버 호출 - 오디오 생성
    const response = await fetch('http://127.0.0.1:8000/generate-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate audio');
    }

    // 오디오 파일 응답 처리
    const buffer = Buffer.from(await response.arrayBuffer());
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="output.mp3"',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
} 