import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface ChatLog {
  question: string;
  answer: string;
  created_at?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { question, answer } = await req.json();

    // 입력값 검증
    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const chatLog: ChatLog = {
      question,
      answer,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('chat_logs')
      .insert([chatLog])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json(
        { error: 'Failed to save chat log' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Chat log saved successfully",
      data 
    });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 