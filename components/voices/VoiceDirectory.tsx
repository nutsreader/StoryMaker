'use client';

import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { VoiceItem } from '@/types';

interface VoiceDirectoryProps {
  voices: VoiceItem[];
  isLoading: boolean;
  onSelectVoice: (voice: VoiceItem) => void;
}

export const VoiceDirectory: React.FC < VoiceDirectoryProps > = ({
  voices,
  isLoading,
  onSelectVoice,
}) => {
  const [search, setSearch] = useState('');
  
  const filtered = voices.filter(
    (v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase()) ||
    v.id.includes(search)
  );
  
  return (
    <div className="bg-[#0d1220] border border-[#202a40] rounded-2xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">Live ElevenLabs Voices</h2>
          <p className="text-xs text-[#8f9bb5]">
            Lahat ng boses na accessible mula sa iyong API account.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8f9bb5]" />
          <input
            type="text"
            placeholder="Search voice or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#080d17] border border-[#222c42] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-xs text-[#8f9bb5] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#a354ff]" />
          Kinukuha ang listahan ng boses mula sa ElevenLabs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#8f9bb5]">
          Walang boses na natagpuan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="p-4 bg-[#0b101c] border border-[#202a40] rounded-xl flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{v.name}</div>
                <div className="text-[11px] text-[#8f9bb5]">{v.category}</div>
                <div className="text-[10px] font-mono text-[#4dd6a2] truncate mt-1">
                  {v.id}
                </div>
                {v.previewUrl && (
                  <audio
                    controls
                    src={v.previewUrl}
                    className="w-full h-6 mt-2 opacity-80"
                  />
                )}
              </div>
              <button
                onClick={() => onSelectVoice(v)}
                className="flex-none px-3 py-1.5 bg-[#19172e] hover:bg-[#25203a] border border-[#a354ff]/40 text-[#c29aff] text-xs font-bold rounded-lg transition"
              >
                Use ID
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};