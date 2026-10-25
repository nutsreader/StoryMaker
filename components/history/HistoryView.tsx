'use client';

import React, { useState, useEffect, useRef } from 'react';
import { History, Play, Pause, Download, Loader2, Sparkles } from 'lucide-react';
import { HistoryItem } from '@/types';

export const HistoryView: React.FC = () => {
  const [items, setItems] = useState < HistoryItem[] > ([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState < string | null > (null);
  const audioRef = useRef < HTMLAudioElement | null > (null);
  
  const fetchHistory = () => {
    setLoading(true);
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };
  
  useEffect(() => {
    fetchHistory();
  }, []);
  
  const togglePlay = (id: string) => {
    const audioUrl = `/api/history/${id}`;
    
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    
    if (audioRef.current) audioRef.current.pause();
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingId(id);
    
    audio.play().catch(() => setPlayingId(null));
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
  };
  
  return (
    <div className="bg-[#0d1220] border border-[#202a40] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#202a40]">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-[#a354ff]" /> Na-generate na Audio Clips
          </h2>
          <p className="text-xs text-[#8f9bb5]">
            Lahat ng boses na nabawasan ng credits ay naka-save dito. Pakinggan at i-download nang libre.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="px-3 py-1.5 bg-[#11182a] hover:bg-[#1a233a] border border-[#202a40] text-xs font-semibold rounded-xl text-[#c29aff]"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-[#8f9bb5]">
          <Loader2 className="w-6 h-6 animate-spin text-[#a354ff]" />
          Kinukuha ang mga audio clips mula sa ElevenLabs History...
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#8f9bb5]">
          Walang natagpuang history items sa account mo.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {items.map((item) => {
            const isPlaying = playingId === item.history_item_id;
            const date = new Date(item.date_unix * 1000).toLocaleString();

            return (
              <div
                key={item.history_item_id}
                className="p-3.5 bg-[#0b101c] border border-[#202a40] rounded-xl flex items-center justify-between gap-3"
              >
                {/* Play Button */}
                <button
                  type="button"
                  onClick={() => togglePlay(item.history_item_id)}
                  className={`w-9 h-9 flex-none rounded-xl flex items-center justify-center border transition ${
                    isPlaying
                      ? 'bg-[#a354ff] text-white border-[#a354ff]'
                      : 'bg-[#19172e] text-[#c29aff] hover:bg-[#a354ff] hover:text-white border-[#a354ff]/30'
                  }`}
                  title="Pakinggan"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span>{item.voice_name || 'Voice'}</span>
                    <span className="text-[10px] text-[#8f9bb5] font-normal">{date}</span>
                  </div>
                  <p className="text-[11px] text-[#8f9bb5] truncate mt-0.5 font-mono">
                    "{item.text}"
                  </p>
                </div>

                {/* Download Button */}
                <a
                  href={`/api/history/${item.history_item_id}`}
                  download={`audio_${item.history_item_id}.mp3`}
                  className="flex-none p-2 bg-[#12192a] hover:bg-[#1a233a] border border-[#202a40] rounded-lg text-[#4dd6a2]"
                  title="I-download ang MP3"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};