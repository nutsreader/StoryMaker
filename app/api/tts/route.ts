import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing ELEVENLABS_API_KEY in Vercel environment variables.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { voiceId, text, model, speed, stability, clarity } = body as {
      voiceId: string;
      text: string;
      model?: string;
      speed?: number;
      stability?: number;
      clarity?: number;
    };

    if (!voiceId || !text) {
      return NextResponse.json(
        { error: 'Voice ID and text dialogue are required.' },
        { status: 400 }
      );
    }

    const selectedModel = model || 'eleven_multilingual_v2';

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: selectedModel,
          voice_settings: {
            stability: stability ?? 0.5,
            similarity_boost: clarity ?? 0.75,
            speed: speed ?? 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs Error:', errorText);
      return NextResponse.json(
        { error: `ElevenLabs error (${response.status}): ${response.statusText}` },
        { status: response.status }
      );
    }

    const audioArrayBuffer = await response.arrayBuffer();

    return new NextResponse(audioArrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error: any) {
    console.error('TTS Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}