import { NextResponse } from 'next/server';

const VOICES = [
  {
    voice_id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    gender: "Female",
    description: "Clear and professional female voice"
  },
  {
    voice_id: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    gender: "Female",
    description: "Warm and friendly female voice"
  },
  {
    voice_id: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    gender: "Male",
    description: "Deep and authoritative male voice"
  },
  {
    voice_id: "VR6AewLTigWG4xSOukaG",
    name: "Arnold",
    gender: "Male",
    description: "Strong and confident male voice"
  },
  {
    voice_id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    gender: "Male",
    description: "Natural and engaging male voice"
  }
];

export async function GET() {
  try {
    return NextResponse.json(VOICES);
  } catch (error) {
    console.error('Error fetching voices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 