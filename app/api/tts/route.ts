import { NextRequest, NextResponse } from 'next/server';

interface DialogueBlock {
  speaker: string;
  voiceId: string;
  dialogue: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing ELEVENLABS_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { blocks, model, speed, stability, clarity } = body as {
      blocks: DialogueBlock[];
      model?: string;
      speed?: number;
      stability?: number;
      clarity?: number;
    };

    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return NextResponse.json(
        { error: 'No dialogue blocks provided.' },
        { status: 400 }
      );
    }

    const audioBuffers: Buffer[] = [];
    const selectedModel = model || 'eleven_multilingual_v2';

    // I-generate ang audio sa ElevenLabs per dialogue block nang sunod-sunod
    for (const block of blocks) {
      const text = block.dialogue.trim();
      const voiceId = block.voiceId.trim();

      if (!text || !voiceId) continue;

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
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
        console.error(`ElevenLabs error for voice ${voiceId}:`, errorText);
        return NextResponse.json(
          { error: `ElevenLabs API error: ${response.statusText}` },
          { status: response.status }
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      audioBuffers.push(Buffer.from(arrayBuffer));
    }

    if (audioBuffers.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate speech. Please check your text and voice IDs.' },
        { status: 400 }
      );
    }

    // Pagsamahin ang lahat ng MP3 chunks sa iisang tuloy-tuloy na MP3 buffer
    const finalAudioBuffer = Buffer.concat(audioBuffers);

    // Ibalik ang pinagsamang MP3 direkta sa browser
    return new NextResponse(finalAudioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="storymaker_output.mp3"',
        'Content-Length': finalAudioBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('TTS Synthesis route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}