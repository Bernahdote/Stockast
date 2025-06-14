import { NextResponse } from 'next/server';

interface TTSRequest {
  text: string;
  stability?: number;
  similarity_boost?: number;
}

export async function POST(request: Request) {
  try {
    const { text, stability = 0.5, similarity_boost = 0.75 } = await request.json() as TTSRequest;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability,
          similarity_boost
        }
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