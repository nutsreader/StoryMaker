export interface Block {
  id: string;
  name: string;
  voiceId: string;
  dialogue: string;
}

export interface VoiceItem {
  id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  previewUrl: string | null;
}

export interface PresetItem {
  id?: string;
  speaker_name: string;
  voice_id: string;
}

export interface UserCredits {
  character_count: number;
  character_limit: number;
  remaining_credits: number;
  tier: string;
}

export interface HistoryItem {
  history_item_id: string;
  voice_name: string;
  text: string;
  date_unix: number;
  character_count_change_from?: number;
  character_count_change_to?: number;
}

export type ActiveTab = 'studio' | 'voices' | 'history';