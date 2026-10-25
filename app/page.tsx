'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Play,
  Volume2,
  Sliders,
  Users,
  FileText,
  Menu,
  X,
  Bookmark,
  CheckCircle,
  Loader2,
  Search,
} from 'lucide-react';

interface Block {
  id: string;
  name: string;
  voiceId: string;
  dialogue: string;
}

interface VoiceItem {
  id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  previewUrl: string | null;
}

interface PresetItem {
  id?: string;
  speaker_name: string;
  voice_id: string;
}

export default function StoryMakerStudio() {
  const [activeTab, setActiveTab] = useState<'studio' | 'voices'>('studio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic States (Walang hardcoded data)
  const [blocks, setBlocks] = useState<Block[]>([
    { id: '1', name: 'Speaker 1', voiceId: '', dialogue: '' },
  ]);
  const [liveVoices, setLiveVoices] = useState<VoiceItem[]>([]);
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState('');

  // Bulk Settings
  const [bulkTag, setBulkTag] = useState('');
  const [bulkVoiceId, setBulkVoiceId] = useState('');

  // Audio Tuning
  const [model, setModel] = useState('eleven_multilingual_v2');
  const [speed, setSpeed] = useState(1.0);
  const [stability, setStability] = useState(0.5);
  const [clarity, setClarity] = useState(0.75);

  // Audio Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Script Importer
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. Live Fetch ng Voices mula sa ElevenLabs API
  useEffect(() => {
    setLoadingVoices(true);
    fetch('/api/voices')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLiveVoices(data);
        }
      })
      .catch((err) => console.error('Failed to load live voices:', err))
      .finally(() => setLoadingVoices(false));
  }, []);

  // 2. Live Fetch ng Presets mula sa Supabase
  const loadPresets = () => {
    fetch('/api/presets')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPresets(data);
        }
      })
      .catch((err) => console.error('Failed to load presets:', err));
  };

  useEffect(() => {
    loadPresets();
  }, []);

  // Block Handlers
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
      prev.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, [field]: val };

        // Kung binago ang speaker name at tumugma sa Supabase preset, kusa nitong i-assign ang Voice ID
        if (field === 'name' && !b.voiceId) {
          const match = presets.find(
            (p) => p.speaker_name.toLowerCase() === val.trim().toLowerCase()
          );
          if (match) updated.voiceId = match.voice_id;
        }

        return updated;
      })
    );
  };

  // Bulk Apply
  const applyBulkVoice = () => {
    if (!bulkVoiceId.trim()) {
      showToast('Ilagay ang Voice ID na nais i-assign.');
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
    showToast(`Na-update ang ${count} speaker block(s)!`);
  };

  // I-save ang kasalukuyang speaker assignments sa Supabase
  const savePresetsToDatabase = async () => {
    const validPresets = blocks.filter((b) => b.name.trim() && b.voiceId.trim());
    if (validPresets.length === 0) {
      showToast('Walang valid na speaker name at Voice ID na mase-save.');
      return;
    }

    try {
      for (const b of validPresets) {
        await fetch('/api/presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speaker_name: b.name.trim(),
            voice_id: b.voiceId.trim(),
          }),
        });
      }
      loadPresets();
      showToast('✓ Matagumpay na na-save ang Presets sa Supabase!');
    } catch {
      showToast('Error sa pag-save ng presets.');
    }
  };

  // Parser para sa Script (.txt o Paste)
  const parseScript = (raw: string) => {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: { name: string; text: string }[] = [];
    let current: { name: string; text: string } | null = null;

    for (const line of lines) {
      const match =
        line.match(/^\[([^\]]{1,60})\]\s*:?\s*(.*)$/) ||
        line.match(/^([A-Za-z0-9 _.'-]{1,40})\s*:\s*(.+)$/);

      if (match) {
        current = { name: match[1].trim(), text: match[2].trim() };
        parsed.push(current);
      } else if (current) {
        current.text += (current.text ? ' ' : '') + line;
      } else {
        current = { name: `Speaker ${parsed.length + 1}`, text: line };
        parsed.push(current);
      }
    }
    return parsed.filter((p) => p.text.trim());
  };

  const handleApplyScript = () => {
    if (!importInput.trim()) {
      setImportStatus('Maglagay muna ng script.');
      return;
    }
    const items = parseScript(importInput);
    if (items.length === 0) {
      setImportStatus('Walang dialogue na natukoy.');
      return;
    }

    setBlocks(
      items.map((it, idx) => {
        // I-check kung may katugmang Voice ID na sa Supabase presets
        const matchedPreset = presets.find(
          (p) => p.speaker_name.toLowerCase() === it.name.toLowerCase()
        );

        return {
          id: (Date.now() + idx).toString(),
          name: it.name,
          voiceId: matchedPreset ? matchedPreset.voice_id : '',
          dialogue: it.text,
        };
      })
    );

    setIsImportOpen(false);
    showToast(`✓ Na-import ang ${items.length} block(s)!`);
  };

  // Synthesize & Auto-Download Engine
  const handleSynthesize = async () => {
    const valid = blocks.filter((b) => b.dialogue.trim() && b.voiceId.trim());

    if (valid.length === 0) {
      showToast('Kailangan may Voice ID at Dialogue ang mga blocks bago mag-generate.');
      return;
    }

    setIsGenerating(true);
    showToast('✦ Bumubuo ng audio sa ElevenLabs...');

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
        throw new Error(errorData.error || 'Hindi matagumpay ang synthesis.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Kusa at agarang magda-download sa device
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

  const filteredVoices = liveVoices.filter(
    (v) =>
      v.name.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      v.category.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      v.id.includes(voiceSearch)
  );

  return (
    <div className="min-h-screen bg-[#080b13] text-[#eef1fb] flex">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0a0e18] border-r border-[#202a40] p-5 flex flex-col justify-between transform transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a354ff] to-[#685cff] flex items-center justify-center font-black text-xl shadow-md shadow-purple-500/20">
              ✦
            </div>
            <span className="font-extrabold text-lg tracking-tight">StoryMaker</span>
          </div>

          <div className="text-[10px] font-bold text-[#77839c] tracking-widest px-3 mb-2">
            WORKSPACE
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('studio');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === 'studio'
                  ? 'bg-[#19172e] text-[#c29aff] border border-[#a354ff]/30'
                  : 'text-[#8f9bb5] hover:bg-[#11182a] hover:text-[#eef1fb]'
              }`}
            >
              <Sliders className="w-4 h-4" /> Multi-Speaker Studio
            </button>
            <button
              onClick={() => {
                setActiveTab('voices');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === 'voices'
                  ? 'bg-[#19172e] text-[#c29aff] border border-[#a354ff]/30'
                  : 'text-[#8f9bb5] hover:bg-[#11182a] hover:text-[#eef1fb]'
              }`}
            >
              <Volume2 className="w-4 h-4" /> Live Voice Library ({liveVoices.length})
            </button>
          </nav>
        </div>

        <div className="p-3.5 bg-[#0d1220] border border-[#202a40] rounded-2xl">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-[#8f9bb5]">ElevenLabs API</span>
            <span className="text-[10px] text-[#4dd6a2] font-mono">Protected</span>
          </div>
          <p className="text-[11px] text-[#77839c]">
            Direct device download. Zero audio storage consumed sa Supabase.
          </p>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-[#080b13]/90 backdrop-blur-md border-b border-[#202a40] px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#8f9bb5] hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-sm md:text-base font-extrabold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#a354ff]" /> Multi-Speaker Studio
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={savePresetsToDatabase}
              className="flex items-center gap-2 px-3 py-2 bg-[#11182a] hover:bg-[#1a233a] border border-[#202a40] text-xs font-semibold rounded-xl text-[#8f9bb5] hover:text-white transition"
              title="Save voice mapping to Supabase"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save Presets</span>
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-[#a354ff] to-[#685cff] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 active:scale-95 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Script</span>
            </button>
          </div>
        </header>

        {/* Contents */}
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
          {activeTab === 'studio' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Script Blocks */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-[#0d1220] border border-[#202a40] rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-[#202a40] mb-4">
                    <div>
                      <h2 className="text-sm font-bold">Dialogue Blocks</h2>
                      <p className="text-[11px] text-[#8f9bb5]">Magdagdag ng speakers at dialogue.</p>
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
                          <input
                            type="text"
                            value={block.name}
                            onChange={(e) => updateBlock(block.id, 'name', e.target.value)}
                            placeholder="Speaker Name"
                            className="flex-1 min-w-0 bg-[#080d17] border border-[#222c42] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#a354ff]"
                          />
                          <div className="flex-1 min-w-0 flex items-center gap-1">
                            <input
                              type="text"
                              value={block.voiceId}
                              onChange={(e) => updateBlock(block.id, 'voiceId', e.target.value)}
                              placeholder="Voice ID"
                              className="w-full bg-[#080d17] border border-[#222c42] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#4dd6a2] focus:outline-none focus:border-[#a354ff]"
                            />
                            <button
                              onClick={() => {
                                if (!block.voiceId) return;
                                navigator.clipboard.writeText(block.voiceId);
                                showToast('Voice ID copied');
                              }}
                              className="p-1.5 text-[#8f9bb5] hover:text-white bg-[#12192a] border border-[#202a40] rounded-lg"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeBlock(block.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 bg-[#12192a] border border-[#202a40] rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={block.dialogue}
                          onChange={(e) => updateBlock(block.id, 'dialogue', e.target.value)}
                          placeholder="I-type dito ang sasabihin..."
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

                {/* Bulk Voice Assignment */}
                <div className="bg-[#0d1220] border border-[#202a40] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#a354ff]" />
                    <span className="text-xs font-bold text-[#8f9bb5]">BULK VOICE ASSIGNMENT</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Target Speaker Tag (optional)"
                      value={bulkTag}
                      onChange={(e) => setBulkTag(e.target.value)}
                      className="bg-[#080d17] border border-[#222c42] rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Bagong Voice ID"
                      value={bulkVoiceId}
                      onChange={(e) => setBulkVoiceId(e.target.value)}
                      className="bg-[#080d17] border border-[#222c42] rounded-xl px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>
                  <button
                    onClick={applyBulkVoice}
                    className="w-full py-2 bg-[#11182a] hover:bg-[#1a233a] border border-[#202a40] rounded-xl text-xs font-bold text-white transition"
                  >
                    I-apply sa tumutugmang speakers
                  </button>
                </div>
              </div>

              {/* Right Column: Audio Tuning & Synthesize */}
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

                  {/* Audio Player and Download */}
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
          )}

          {/* TAB: LIVE VOICE LIBRARY */}
          {activeTab === 'voices' && (
            <div className="bg-[#0d1220] border border-[#202a40] rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">Live ElevenLabs Voices</h2>
                  <p className="text-xs text-[#8f9bb5]">
                    Lahat ng boses na accessible sa ElevenLabs API Key mo.
                  </p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8f9bb5]" />
                  <input
                    type="text"
                    placeholder="Search voice name or ID..."
                    value={voiceSearch}
                    onChange={(e) => setVoiceSearch(e.target.value)}
                    className="bg-[#080d17] border border-[#222c42] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {loadingVoices ? (
                <div className="py-12 flex flex-col items-center justify-center text-xs text-[#8f9bb5] gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#a354ff]" />
                  Kinukuha ang listahan ng boses mula sa ElevenLabs...
                </div>
              ) : filteredVoices.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8f9bb5]">
                  Walang boses na natagpuan. Siguraduhing tama ang `ELEVENLABS_API_KEY` mo sa Vercel.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
                  {filteredVoices.map((v) => (
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
                        onClick={() => {
                          const emptyBlock = blocks.find((b) => !b.voiceId.trim());
                          if (emptyBlock) {
                            updateBlock(emptyBlock.id, 'voiceId', v.id);
                          } else {
                            addBlock(v.name, v.id);
                          }
                          setActiveTab('studio');
                          showToast(`Nagamit ang ID ni ${v.name}`);
                        }}
                        className="flex-none px-3 py-1.5 bg-[#19172e] hover:bg-[#25203a] border border-[#a354ff]/40 text-[#c29aff] text-xs font-bold rounded-lg transition"
                      >
                        Use ID
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* SCRIPT IMPORT MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0b101d] border border-[#252e44] rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#202a40]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#a354ff]" />
                <h3 className="text-sm font-bold">Import Script (.txt o Paste)</h3>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="text-[#8f9bb5] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#8f9bb5] block mb-1">
                  PUMILI NG .TXT FILE
                </label>
                <input
                  type="file"
                  accept=".txt"
                  ref={fileInputRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    setImportInput(text);
                    setImportStatus(`Na-load ang "${file.name}".`);
                  }}
                  className="w-full text-xs text-[#8f9bb5] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#11182a] file:text-[#c29aff] hover:file:bg-[#19172e]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8f9bb5] block mb-1">
                  O I-PASTE ANG SCRIPT
                </label>
                <textarea
                  rows={6}
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="Halimbawa:&#10;Host: Kamusta kayo!&#10;Guest: Mabuti naman!"
                  className="w-full bg-[#080d17] border border-[#222c42] rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#a354ff] font-mono"
                />
              </div>

              {importStatus && (
                <div className="text-xs text-[#4dd6a2] font-semibold">{importStatus}</div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#202a40]">
              <button
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 bg-[#11182a] hover:bg-[#1a233a] border border-[#202a40] text-xs font-bold rounded-xl text-[#8f9bb5]"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyScript}
                className="px-4 py-2 bg-gradient-to-r from-[#a354ff] to-[#685cff] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition"
              >
                Apply to Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB IMPORT BUTTON */}
      <button
        onClick={() => setIsImportOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-tr from-[#a354ff] to-[#685cff] text-white shadow-xl shadow-purple-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition"
        title="Import / Paste Script"
      >
        <Upload className="w-6 h-6" />
      </button>

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#eef1fb] text-[#111523] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#a354ff]" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}