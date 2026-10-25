'use client';

import React from 'react';
import { Sliders, Volume2, X } from 'lucide-react';
import { ActiveTab, UserCredits } from '@/types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  voiceCount: number;
  credits: UserCredits | null;
}

export const Sidebar: React.FC < SidebarProps > = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  voiceCount,
  credits,
}) => {
  // Compute percentage used
  const percentUsed = credits && credits.character_limit > 0 ?
    Math.min(100, (credits.character_count / credits.character_limit) * 100) :
    0;
  
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

        {/* Workspace Nav */}
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

      {/* 📊 TOTAL CREDITS & QUOTA CARD SA BABA NG SIDEBAR */}
      <div className="p-4 bg-[#0d1220] border border-[#202a40] rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-[#8f9bb5]">Plan Tier:</span>
          <span className="px-2 py-0.5 rounded-md bg-[#19172e] text-[#c29aff] font-mono font-bold text-[10px]">
            {credits?.tier || 'CONNECTED'}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-[#8f9bb5]">
            <span>Quota Remaining:</span>
            <span className="font-mono text-white font-semibold">
              {credits
                ? `${credits.remaining_credits.toLocaleString()} / ${credits.character_limit.toLocaleString()}`
                : 'Loading...'}
            </span>
          </div>

          {/* Meter progress bar */}
          <div className="w-full h-1.5 bg-[#20283b] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#a354ff] to-[#685cff] transition-all duration-300"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#202a40] flex items-center justify-between text-[10px] text-[#77839c]">
          <span>Engine Status</span>
          <span className="text-[#4dd6a2] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4dd6a2] animate-pulse" /> Connected
          </span>
        </div>
      </div>
    </aside>
  );
};