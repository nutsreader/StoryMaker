import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Kunin ang lahat ng naka-save na Voice Presets
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('voice_presets')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Mag-save o mag-update ng Voice Preset
export async function POST(req: NextRequest) {
  try {
    const { speaker_name, voice_id } = await req.json();

    if (!speaker_name || !voice_id) {
      return NextResponse.json(
        { error: 'Speaker name and Voice ID are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('voice_presets')
      .upsert({ speaker_name, voice_id }, { onConflict: 'speaker_name' })
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}