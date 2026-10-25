import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

    const historyItemId = params.id;

    // Kunin ang audio mula sa ElevenLabs History
    const res = await fetch(
      `https://api.elevenlabs.io/v1/history/${historyItemId}/audio`,
      {
        headers: { 'xi-api-key': apiKey },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch audio' },
        { status: res.status }
      );
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="history_${historyItemId}.mp3"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}