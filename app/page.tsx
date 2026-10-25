'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { Block, VoiceItem, PresetItem, ActiveTab, UserCredits } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StudioView } from '@/components/studio/StudioView';
import { VoiceDirectory } from '@/components/voices/VoiceDirectory';
import { ScriptImportModal } from '@/components/studio/ScriptImportModal';

export default function StoryMakerPage() {
  const [activeTab, setActiveTab] = useState < ActiveTab > ('studio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  // States
  const [blocks, setBlocks] = useState < Block[] > ([
    { id: '1', name: 'Speaker 1', voiceId: '', dialogue: '' },
  ]);
  const [voices, setVoices] = useState < VoiceItem[] > ([]);
  const [presets, setPresets] = useState < PresetItem[] > ([]);
  const [credits, setCredits] = useState < UserCredits | null > (null);
  const [loadingVoices, setLoadingVoices] = useState(false);
  
  // Toast
  const [toastMsg, setToastMsg] = useState < string | null > (null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };
  
  // Fetch Credits
  const fetchCredits = useCallback(() => {
    fetch('/api/user')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setCredits(data);
      })
      .catch((e) => console.error('Credits fetch failed:', e));
  }, []);
  
  // Initial Fetches
  useEffect(() => {
    fetchCredits();
    
    setLoadingVoices(true);
    fetch('/api/voices')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setVoices(d))
      .catch((e) => console.error(e))
      .finally(() => setLoadingVoices(false));
    
    fetch('/api/presets')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setPresets(d))
      .catch((e) => console.error(e));
  }, [fetchCredits]);
  
  const handleSavePresets = async () => {
    const valid = blocks.filter((b) => b.name.trim() && b.voiceId.trim());
    if (valid.length === 0) return showToast('Walang valid presets na mase-save.');
    for (const b of valid) {
      await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speaker_name: b.name.trim(), voice_id: b.voiceId.trim() }),
      });
    }
    showToast('✓ Na-save ang presets sa Supabase!');
  };
  
  return (
    <div className="min-h-screen bg-[#080b13] text-[#eef1fb] flex">
      {/* 1. SIDEBAR WITH CREDITS METER */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={mobileMenuOpen}
        setIsOpen={setMobileMenuOpen}
        voiceCount={voices.length}
        credits={credits}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* 2. TOPBAR WITH CREDITS BADGE (WALA NANG IMPORT BUTTON) */}
        <Topbar
          onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onSavePresets={handleSavePresets}
          credits={credits}
        />

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
          {/* STUDIO VIEW */}
          {activeTab === 'studio' && (
            <StudioView
              blocks={blocks}
              setBlocks={setBlocks}
              showToast={(msg) => {
                showToast(msg);
                fetchCredits(); // Auto-update ng credits pagka-synthesize
              }}
            />
          )}

          {/* VOICE DIRECTORY */}
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
                showToast(`Nagamit ang Voice ID ni ${v.name}`);
              }}
            />
          )}
        </div>
      </main>

      {/* SCRIPT IMPORT MODAL */}
      <ScriptImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        presets={presets}
        onApplyBlocks={(newBlocks) => setBlocks(newBlocks)}
        showToast={showToast}
      />

      {/* FLOATING ACTION BUTTON (FAB) PARA SA IMPORT */}
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