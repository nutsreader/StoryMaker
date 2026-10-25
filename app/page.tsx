'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { Block, VoiceItem, PresetItem, ActiveTab, UserCredits } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StudioView } from '@/components/studio/StudioView';
import { VoiceDirectory } from '@/components/voices/VoiceDirectory';
import { HistoryView } from '@/components/history/HistoryView';
import { ScriptImportModal } from '@/components/studio/ScriptImportModal';

export default function StoryMakerPage() {
  const [activeTab, setActiveTab] = useState < ActiveTab > ('studio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  // Studio States
  const [blocks, setBlocks] = useState < Block[] > ([
    { id: '1', name: 'Speaker 1', voiceId: '', dialogue: '' },
  ]);
  const [voices, setVoices] = useState < VoiceItem[] > ([]);
  const [presets, setPresets] = useState < PresetItem[] > ([]);
  const [credits, setCredits] = useState < UserCredits | null > (null);
  const [loadingVoices, setLoadingVoices] = useState(false);
  
  // Toast State
  const [toastMsg, setToastMsg] = useState < string | null > (null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };
  
  // 1. Fetch ElevenLabs Live Credits / Quota
  const fetchCredits = useCallback(() => {
    fetch('/api/user')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setCredits(data);
      })
      .catch((e) => console.error('Credits fetch failed:', e));
  }, []);
  
  // 2. Fetch Live Voices mula sa ElevenLabs
  const fetchVoices = useCallback(() => {
    setLoadingVoices(true);
    fetch('/api/voices')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setVoices(d);
      })
      .catch((e) => console.error('Voices fetch failed:', e))
      .finally(() => setLoadingVoices(false));
  }, []);
  
  // 3. Fetch Presets mula sa Supabase
  const fetchPresets = useCallback(() => {
    fetch('/api/presets')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setPresets(d);
      })
      .catch((e) => console.error('Presets fetch failed:', e));
  }, []);
  
  // Initial Data Fetching on mount
  useEffect(() => {
    fetchCredits();
    fetchVoices();
    fetchPresets();
  }, [fetchCredits, fetchVoices, fetchPresets]);
  
  // I-save ang kasalukuyang Voice assignments sa Supabase
  const handleSavePresets = async () => {
    const valid = blocks.filter((b) => b.name.trim() && b.voiceId.trim());
    if (valid.length === 0) {
      showToast('Pumili ng boses sa blocks bago mag-save ng presets.');
      return;
    }
    
    try {
      for (const b of valid) {
        await fetch('/api/presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speaker_name: b.name.trim(),
            voice_id: b.voiceId.trim(),
          }),
        });
      }
      fetchPresets();
      showToast('✓ Na-save ang presets sa Supabase!');
    } catch {
      showToast('Nagka-problema sa pag-save ng presets.');
    }
  };
  
  return (
    <div className="min-h-screen bg-[#080b13] text-[#eef1fb] flex">
      {/* 1. SEPARATE SIDEBAR (Studio, Voices, History, Credits Meter) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={mobileMenuOpen}
        setIsOpen={setMobileMenuOpen}
        voiceCount={voices.length}
        credits={credits}
      />

      {/* MAIN VIEWPORT */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* 2. TOPBAR (May Credits Badge) */}
        <Topbar
          onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onSavePresets={handleSavePresets}
          credits={credits}
        />

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
          {/* TAB 1: MULTI-SPEAKER STUDIO */}
          {activeTab === 'studio' && (
            <StudioView
              blocks={blocks}
              setBlocks={setBlocks}
              voices={voices}
              showToast={(msg) => {
                showToast(msg);
                fetchCredits(); // Mare-refresh ang credits matapos mag-generate
              }}
            />
          )}

          {/* TAB 2: LIVE VOICE DIRECTORY */}
          {activeTab === 'voices' && (
            <VoiceDirectory
              voices={voices}
              isLoading={loadingVoices}
              onSelectVoice={(v) => {
                const empty = blocks.find((b) => !b.voiceId.trim());
                if (empty) {
                  setBlocks((prev) =>
                    prev.map((b) => (b.id === empty.id ? { ...b, voiceId: v.id } : b))
                  );
                } else {
                  setBlocks((prev) => [
                    ...prev,
                    { id: Date.now().toString(), name: v.name, voiceId: v.id, dialogue: '' },
                  ]);
                }
                setActiveTab('studio');
                showToast(`Nagamit ang boses ni ${v.name}`);
              }}
            />
          )}

          {/* TAB 3: AUDIO HISTORY (Dito kukunin ang na-generate nang audio) */}
          {activeTab === 'history' && <HistoryView />}
        </div>
      </main>

      {/* SCRIPT IMPORT MODAL (May Character Voice Mapping Cards) */}
      <ScriptImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        presets={presets}
        voices={voices}
        onApplyBlocks={(newBlocks) => setBlocks(newBlocks)}
        showToast={showToast}
      />

      {/* FLOATING ACTION BUTTON (FAB) PARA SA SCRIPT IMPORT */}
      <button
        onClick={() => setIsImportOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-tr from-[#a354ff] to-[#685cff] text-white shadow-xl shadow-purple-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition"
        title="Import Script (.txt o Paste)"
      >
        <Upload className="w-6 h-6" />
      </button>

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#eef1fb] text-[#111523] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#a354ff]" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}