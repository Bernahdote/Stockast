import { NextResponse } from 'next/server';

interface TTSRequest {
  text: string;
  voice_id: string;
}

export async function POST(request: Request) {
  try {
    const { text, voice_id } = await request.json() as TTSRequest;

    if (!text || !voice_id) {
      return NextResponse.json(
        { error: 'Text and voice_id are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('ElevenLabs API error:', error);
      return NextResponse.json(
        { error: 'Failed to convert text to speech' },
        { status: response.status }
      );
    }

    const audioData = await response.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Content-Disposition', 'attachment; filename="tts-output.mp3"');

    return new NextResponse(audioData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 