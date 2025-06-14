import { NextRequest, NextResponse } from 'next/server';

interface TextRequest {
  text: string;
  voice_id?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { text, voice_id } = await req.json() as TextRequest;

    if (!text) {
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 }
      );
    }

    // FastAPI 서버 호출
    const response = await fetch('http://127.0.0.1:8000/process-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id: voice_id || '21m00Tcm4TlvDq8ikWAM'
      }),
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.startsWith('audio/')) {
      // 오디오 파일 등 blob 응답 처리
      const buffer = Buffer.from(await response.arrayBuffer());
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': 'attachment; filename="output.mp3"',
        },
      });
    }

    // 그 외는 json으로 처리
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
} 