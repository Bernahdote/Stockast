import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    return NextResponse.json({ error: 'Chat log saving is disabled.' }, { status: 501 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 