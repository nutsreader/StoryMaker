'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Users,
  Sliders,
  Sparkles,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Block, VoiceItem } from '@/types';

interface StudioViewProps {
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  voices: VoiceItem[]; // <-- Kukunin ang live list ng boses
  showToast: (msg: string) => void;
}

export const StudioView: React.FC<StudioViewProps> = ({
  blocks,
  setBlocks,
  voices,
  showToast,
}) => {
  // Bulk Assign
  const [bulkTag, setBulkTag] = useState('');
  const [bulkVoiceId, setBulkVoiceId] = useState('');

  // Audio Tuning
  const [model, setModel] = useState('eleven_multilingual_v2');
  const [speed, setSpeed] = useState(1.0);
  const [stability, setStability] = useState(0.5);
  const [clarity, setClarity] = useState(0.75);

  // Synthesis & Audio
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const addBlock = (name = `Speaker ${blocks.length + 1}`, voiceId = '', dialogue = '') => {
    setBlocks((prev) => [
      ...prev,
      { id: Date.now().toString(), name, voiceId, dialogue },
    ]);
  };

  const removeBlock = (id: string) => {
    if (blocks.length === 1) {
      showToast('Panatilihin ang kahit isang block.');
      return;
    }
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBlock = (id: string, field: keyof Block, val: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: val } : b))
    );
  };

  const applyBulkVoice = () => {
    if (!bulkVoiceId.trim()) {
      showToast('Pumili ng boses sa dropdown muna.');
      return;
    }
    const tag = bulkTag.trim().toLowerCase();
    let count = 0;
    setBlocks((prev) =>
      prev.map((b) => {
        if (!tag || b.name.toLowerCase().includes(tag)) {
          count++;
          return { ...b, voiceId: bulkVoiceId.trim() };
        }
        return b;
      })
    );
    showToast(`Na-assign ang boses sa ${count} speaker block(s)!`);
  };

  const handleSynthesize = async () => {
    const valid = blocks.filter((b) => b.dialogue.trim() && b.voiceId.trim());

    if (valid.length === 0) {
      showToast('Pumili ng boses at maglagay ng dialogue sa blocks bago mag-synthesize.');
      return;
    }

    setIsGenerating(true);
    showToast('✦ Pinagsasama ang audio sa ElevenLabs...');

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: valid.map((b) => ({
            speaker: b.name,
            voiceId: b.voiceId,
            dialogue: b.dialogue,
          })),
          model,
          speed,
          stability,
          clarity,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Nabigo ang synthesis.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Auto-download sa device
      const link = document.createElement('a');
      link.href = url;
      link.download = `storymaker_${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('✓ Audio synthesized at awtomatikong na-download!');
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* SCRIPT BLOCKS */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-[#0d1220] border border-[#202a40] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#202a40] mb-4">
            <div>
              <h2 className="text-sm font-bold">Dialogue Blocks</h2>
              <p className="text-[11px] text-[#8f9bb5]">Pumili ng boses sa dropdown para sa bawat linya.</p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#19172e] text-[#c29aff] border border-[#a354ff]/30">
              {blocks.length} BLOCKS
            </span>
          </div>

          <div className="space-y-3.5">
            {blocks.map((block, idx) => (
              <div
                key={block.id}
                className="bg-[#0b101c] border border-[#202a40] rounded-xl p-3.5 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex-none rounded-lg bg-[#2a1d42] text-[#d6b9ff] text-xs font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>

                  {/* Speaker Tag Input */}
                  <input
                    type="text"
                    value={block.name}
                    onChange={(e) => updateBlock(block.id, 'name', e.target.value)}
                    placeholder="Speaker Tag"
                    className="flex-1 min-w-0 bg-[#080d17] border border-[#222c42] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#a354ff]"
                  />

                  {/* 🎙️ VOICE DROPDOWN (Pinalitan ang raw ID input) */}
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <select
                      value={block.voiceId}
                      onChange={(e) => updateBlock(block.id, 'voiceId', e.target.value)}
                      className="w-full bg-[#080d17] border border-[#222c42] rounded-lg px-2.5 py-1.5 text-xs text-[#4dd6a2] font-medium focus:outline-none focus:border-[#a354ff] truncate"
                    >
                      <option value="" className="text-[#8f9bb5]">
                        Select voice
                      </option>
                      {voices.map((v) => (
                        <option key={v.id} value={v.id} className="bg-[#0d1220] text-white">
                          {v.name} {v.category ? `(${v.category})` : ''}
                        </option>
                      ))}
                      {/* Fallback kung may Voice ID na wala sa dropdown list */}
                      {block.voiceId && !voices.some((v) => v.id === block.voiceId) && (
                        <option value={block.voiceId} className="bg-[#0d1220] text-[#4dd6a2]">
                          Saved ID: {block.voiceId}
                        </option>
                      )}
                    </select>

                    <button
                      onClick={() => {
                        if (!block.voiceId) return showToast('Pumili muna ng boses');
                        navigator.clipboard.writeText(block.voiceId);
                        showToast('Voice ID copied');
                      }}
                      className="p-1.5 text-[#8f9bb5] hover:text-white bg-[#12192a] border border-[#202a40] rounded-lg"
                      title="Copy raw Voice ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeBlock(block.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 bg-[#12192a] border border-[#202a40] rounded-lg"
                    title="Delete Block"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={block.dialogue}
                  onChange={(e) => updateBlock(block.id, 'dialogue', e.target.value)}
                  placeholder="I-type dito ang dialogue..."
                  className="w-full bg-[#080d17] border border-[#222c42] rounded-lg p-2.5 text-xs leading-relaxed text-white focus:outline-none focus:border-[#a354ff] resize-y"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#202a40]">
            <button
              onClick={() => addBlock()}
              className="text-xs font-bold text-[#c29aff] hover:text-purple-300 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Magdagdag ng Block
            </button>
            <button
              onClick={() => {
                setBlocks([{ id: '1', name: 'Speaker 1', voiceId: '', dialogue: '' }]);
                showToast('Cleared');
              }}
              className="text-xs text-[#8f9bb5] hover:text-white"
            >
              I-reset Lahat
            </button>
          </div>
        </div>

        {/* Bulk Assignment with Dropdown */}
        <div className="bg-[#0d1220] border border-[#202a40] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#a354ff]" />
            <span className="text-xs font-bold text-[#8f9bb5]">BULK VOICE ASSIGNMENT</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Target Tag (e.g. Narrator o blank)"
              value={bulkTag}
              onChange={(e) => setBulkTag(e.target.value)}
              className="bg-[#080d17] border border-[#222c42] rounded-xl px-3 py-2 text-xs text-white"
            />
            {/* Dropdown din para sa Bulk Assignment */}
            <select
              value={bulkVoiceId}
              onChange={(e) => setBulkVoiceId(e.target.value)}
              className="bg-[#080d17] border border-[#222c42] rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="">Select voice to bulk assign...</option>
              {voices.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#0d1220] text-white">
                  {v.name} {v.category ? `(${v.category})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={applyBulkVoice}
            className="w-full py-2 bg-[#11182a] hover:bg-[#1a233a] border border-[#202a40] rounded-xl text-xs font-bold text-white transition"
          >
            I-apply sa tumutugmang speakers
          </button>
        </div>
      </div>

      {/* Audio Tuning & Synthesize */}
      <div className="space-y-4">
        <div className="bg-[#0d1220] border border-[#202a40] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2 pb-3 border-b border-[#202a40]">
            <Sliders className="w-4 h-4 text-[#a354ff]" /> Audio Tuning
          </h2>

          <div>
            <label className="text-[11px] font-bold text-[#8f9bb5] block mb-1">
              MODEL ENGINE
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#080d17] border border-[#222c42] rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="eleven_multilingual_v2">Eleven Multilingual v2</option>
              <option value="eleven_turbo_v2_5">Eleven Turbo v2.5</option>
              <option value="eleven_monolingual_v1">Eleven English v1</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-[#8f9bb5] mb-1">
              <span>READING SPEED</span>
              <span className="font-mono text-[#c29aff]">{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.3}
              step={0.05}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-[#a354ff]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-[#8f9bb5] mb-1">
              <span>VOICE STABILITY</span>
              <span className="font-mono text-[#c29aff]">{stability.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.05}
              value={stability}
              onChange={(e) => setStability(parseFloat(e.target.value))}
              className="w-full accent-[#a354ff]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-[#8f9bb5] mb-1">
              <span>CLARITY & SIMILARITY</span>
              <span className="font-mono text-[#c29aff]">{clarity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.05}
              value={clarity}
              onChange={(e) => setClarity(parseFloat(e.target.value))}
              className="w-full accent-[#a354ff]"
            />
          </div>

          <button
            onClick={handleSynthesize}
            disabled={isGenerating}
            className="w-full py-3.5 bg-gradient-to-r from-[#a354ff] to-[#685cff] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Synthesizing & Stitching Audio...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Synthesize & Combine Audio
              </>
            )}
          </button>

          {audioUrl && (
            <div className="mt-4 p-3 bg-[#0c1d1a] border border-[#285342] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#4dd6a2] font-bold">
                <CheckCircle className="w-4 h-4" /> Ready & Auto-Downloaded!
              </div>
              <audio controls src={audioUrl} className="w-full h-8" />
              <a
                href={audioUrl}
                download={`storymaker_${Date.now()}.mp3`}
                className="w-full block text-center py-2 bg-[#112d27] hover:bg-[#163c33] border border-[#285342] rounded-lg text-xs font-semibold text-[#4dd6a2]"
              >
                ↓ I-download muli ang MP3
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};