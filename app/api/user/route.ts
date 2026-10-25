import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY missing' },
        { status: 500 }
      );
    }

    const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey },
      next: { revalidate: 30 }, // fresh kada 30 seconds
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `ElevenLabs subscription error: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const count = data.character_count || 0;
    const limit = data.character_limit || 0;
    const remaining = Math.max(0, limit - count);

    return NextResponse.json({
      character_count: count,
      character_limit: limit,
      remaining_credits: remaining,
      tier: (data.tier || 'Free').toUpperCase(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}