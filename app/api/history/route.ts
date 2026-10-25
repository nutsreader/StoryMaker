import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing ELEVENLABS_API_KEY' },
        { status: 500 }
      );
    }

    // Kunin ang huling 100 na-generate mula sa ElevenLabs
    const res = await fetch('https://api.elevenlabs.io/v1/history?page_size=100', {
      headers: { 'xi-api-key': apiKey },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `ElevenLabs history error: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data.history || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}