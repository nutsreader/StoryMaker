'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { Block, VoiceItem, PresetItem, ActiveTab } from '@/types';
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
  const [loadingVoices, setLoadingVoices] = useState(false);
  
  // Toast
  const [toastMsg, setToastMsg] = useState < string | null > (null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };
  
  // Live Fetches
  useEffect(() => {
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
  }, []);
  
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
      {/* 1. SEPARATE SIDEBAR COMPONENT */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={mobileMenuOpen}
        setIsOpen={setMobileMenuOpen}
        voiceCount={voices.length}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* 2. SEPARATE TOPBAR COMPONENT */}
        <Topbar
          onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onSavePresets={handleSavePresets}
          onOpenImport={() => setIsImportOpen(true)}
        />

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
          {/* 3. SEPARATE STUDIO VIEW */}
          {activeTab === 'studio' && (
            <StudioView blocks={blocks} setBlocks={setBlocks} showToast={showToast} />
          )}

          {/* 4. SEPARATE VOICE DIRECTORY */}
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

      {/* 5. SEPARATE IMPORT SCRIPT MODAL */}
      <ScriptImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        presets={presets}
        onApplyBlocks={(newBlocks) => setBlocks(newBlocks)}
        showToast={showToast}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsImportOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-tr from-[#a354ff] to-[#685cff] text-white shadow-xl shadow-purple-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition"
        title="Import Script"
      >
        <Upload className="w-6 h-6" />
      </button>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#eef1fb] text-[#111523] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#a354ff]" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}