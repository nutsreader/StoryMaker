'use client';

import React, { useState, useRef } from 'react';
import { X, Search, Play, Pause, Check, Volume2, Mic } from 'lucide-react';
import { VoiceItem } from '@/types';

interface VoicePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: VoiceItem[];
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
}

export const VoicePickerModal: React.FC < VoicePickerModalProps > = ({
  isOpen,
  onClose,
  voices,
  selectedVoiceId,
  onSelectVoice,
}) => {
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState < string | null > (null);
  const audioRef = useRef < HTMLAudioElement | null > (null);
  
  if (!isOpen) return null;
  
  // Audio preview handler (i-stop ang lumang preview bago mag-play ng bago)
  const togglePlayPreview = (e: React.MouseEvent, voice: VoiceItem) => {
    e.stopPropagation();
    
    if (!voice.previewUrl) return;
    
    if (playingId === voice.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(voice.previewUrl);
    audioRef.current = audio;
    setPlayingId(voice.id);
    
    audio.play().catch(() => setPlayingId(null));
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
  };
  
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingId(null);
    onClose();
  };
  
  const filtered = voices.filter(
    (v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase()) ||
    v.id.includes(search)
  );
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-4">
      <div className="w-full max-w-xl bg-[#0b101d] border border-[#252e44] rounded-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#202a40] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#a354ff] to-[#685cff] flex items-center justify-center text-white">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Select Character Voice</h3>
              <p className="text-[10px] text-[#8f9bb5]">
                Pakinggan ang boses bago i-assign sa iyong dialogue.
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-[#8f9bb5] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-[#202a40] bg-[#080d17]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8f9bb5]" />
            <input
              type="text"
              placeholder="Search by voice name or style (e.g. Rachel, Adam, calm)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0d1220] border border-[#222c42] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#58647b] focus:outline-none focus:border-[#a354ff]"
            />
          </div>
        </div>

        {/* Voices Scrollable List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8f9bb5]">
              Walang boses na tumugma sa hinahanap mo.
            </div>
          ) : (
            filtered.map((voice) => {
              const isSelected = selectedVoiceId === voice.id;
              const isPlaying = playingId === voice.id;

              return (
                <div
                  key={voice.id}
                  onClick={() => {
                    handleClose();
                    onSelectVoice(voice.id);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#19172e] border-[#a354ff]'
                      : 'bg-[#0e1424] hover:bg-[#131b30] border-[#202a40]'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Play Audio Sample Button */}
                    <button
                      type="button"
                      onClick={(e) => togglePlayPreview(e, voice)}
                      disabled={!voice.previewUrl}
                      className={`w-9 h-9 flex-none rounded-xl flex items-center justify-center border transition ${
                        isPlaying
                          ? 'bg-[#a354ff] text-white border-[#a354ff] animate-pulse'
                          : voice.previewUrl
                          ? 'bg-[#19172e] text-[#c29aff] hover:bg-[#a354ff] hover:text-white border-[#a354ff]/30'
                          : 'bg-[#11182a] text-[#475569] border-[#202a40] cursor-not-allowed'
                      }`}
                      title={voice.previewUrl ? 'Play audio preview' : 'No preview available'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {voice.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#19172e] text-[#c29aff] border border-[#a354ff]/30">
                          {voice.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8f9bb5] truncate mt-0.5">
                        {voice.previewUrl ? 'Tap ▶ to preview voice' : 'Standard ElevenLabs Voice'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Select indicator */}
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#4dd6a2]">
                        <Check className="w-4 h-4" /> Selected
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#8f9bb5] group-hover:text-white">
                        Use Voice
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};