import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    // 1. Scrapybara (ACI.dev)
    const scrapyRes = await fetch(`https://api.aci.dev/agents/${process.env.ACI_AGENT_ID}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ACI_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });
    const scrapyData = await scrapyRes.json();
    const rawText = scrapyData.result;

    // 2. Summarize: Mistral
    const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-medium',
        messages: [
          { role: 'system', content: 'Summarize the following text concisely and accurately' },
          { role: 'user', content: rawText },
        ],
      }),
    });
    const mistralData = await mistralRes.json();
    const summary = mistralData.choices?.[0]?.message?.content ?? "Summary failed";

    // 3. Text-to-Speech: ElevenLabs
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: summary,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      }),
    });
    const audioBuffer = await ttsRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // 4. Save to Supabase
    await supabase.from('chat_logs').insert([{ question: query, answer: summary }]);

    return NextResponse.json({
      reply: summary,
      audioBase64
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 