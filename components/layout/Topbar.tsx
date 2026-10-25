'use client';

import React from 'react';
import { Menu, Sparkles, Bookmark, Coins } from 'lucide-react';
import { UserCredits } from '@/types';

interface TopbarProps {
  onToggleMenu: () => void;
  onSavePresets: () => void;
  credits: UserCredits | null;
}

export const Topbar: React.FC < TopbarProps > = ({
  onToggleMenu,
  onSavePresets,
  credits,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080b13]/90 backdrop-blur-md border-b border-[#202a40] px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMenu}
          className="md:hidden p-2 text-[#8f9bb5] hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm md:text-base font-extrabold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#a354ff]" /> Multi-Speaker Studio
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        {/* 🪙 LIVE CREDITS DISPLAY SA TAAS */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#11182a] border border-[#202a40] rounded-xl text-xs font-semibold">
          <Coins className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[#8f9bb5] hidden sm:inline">Credits:</span>
          <span className="font-mono text-[#4dd6a2]">
            {credits ? credits.remaining_credits.toLocaleString() : '---'}
          </span>
        </div>

        {/* SAVE PRESETS BUTTON */}
        <button
          onClick={onSavePresets}
          className="flex items-center gap-2 px-3 py-2 bg-[#11182a] hover:bg-[#1a233a] border border-[#202a40] text-xs font-semibold rounded-xl text-[#8f9bb5] hover:text-white transition"
          title="Save speaker assignments to Supabase"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save Presets</span>
        </button>
      </div>
    </header>
  );
};