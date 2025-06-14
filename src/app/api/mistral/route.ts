import { MistralClient } from '@mistralai/mistralai';
import { NextResponse } from 'next/server';

const client = new MistralClient(process.env.MISTRAL_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await client.chat({
      model: 'mistral-tiny',
      messages: messages,
    });

    return NextResponse.json({ response: response.choices[0].message });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 