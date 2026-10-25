'use client';

import React from 'react';
import { Sliders, Volume2, X } from 'lucide-react';
import { ActiveTab } from '@/types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  voiceCount: number;
}

export const Sidebar: React.FC < SidebarProps > = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  voiceCount,
}) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0a0e18] border-r border-[#202a40] p-5 flex flex-col justify-between transform transition-transform duration-200 md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Brand */}
        <div className="flex items-center justify-between px-2 py-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a354ff] to-[#685cff] flex items-center justify-center font-black text-xl shadow-md shadow-purple-500/20">
              ✦
            </div>
            <span className="font-extrabold text-lg tracking-tight">StoryMaker</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-[#8f9bb5] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Options */}
        <div className="text-[10px] font-bold text-[#77839c] tracking-widest px-3 mb-2">
          WORKSPACE
        </div>
        <nav className="space-y-1">
          <button
            onClick={() => {
              setActiveTab('studio');
              setIsOpen(false);
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
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'voices'
                ? 'bg-[#19172e] text-[#c29aff] border border-[#a354ff]/30'
                : 'text-[#8f9bb5] hover:bg-[#11182a] hover:text-[#eef1fb]'
            }`}
          >
            <Volume2 className="w-4 h-4" /> Live Voices{' '}
            {voiceCount > 0 && `(${voiceCount})`}
          </button>
        </nav>
      </div>

      {/* Engine Status Footer */}
      <div className="p-3.5 bg-[#0d1220] border border-[#202a40] rounded-2xl">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-[#8f9bb5]">ElevenLabs Engine</span>
          <span className="text-[10px] text-[#4dd6a2] font-mono">Server-Side</span>
        </div>
        <p className="text-[11px] text-[#77839c] leading-relaxed">
          Direct stream sa device mo. Zero Supabase audio storage consumed.
        </p>
      </div>
    </aside>
  );
};