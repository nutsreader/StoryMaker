import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY is not configured in Vercel environment variables.' },
        { status: 500 }
      );
    }

    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
      next: { revalidate: 3600 }, // I-cache ng 1 oras para tipid sa request
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `ElevenLabs error: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // I-format ang boses: Kunin ang ID, pangalan, kategorya, at preview URL
    const voices = (data.voices || []).map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      category: v.category || 'Standard',
      labels: v.labels || {},
      previewUrl: v.preview_url || null,
    }));

    return NextResponse.json(voices);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}