'use client';

import React from 'react';
import { Menu, Sparkles, Bookmark, Upload } from 'lucide-react';

interface TopbarProps {
  onToggleMenu: () => void;
  onSavePresets: () => void;
  onOpenImport: () => void;
}

export const Topbar: React.FC < TopbarProps > = ({
  onToggleMenu,
  onSavePresets,
  onOpenImport,
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

      <div className="flex items-center gap-2">
        <button
          onClick={onSavePresets}
          className="flex items-center gap-2 px-3 py-2 bg-[#11182a] hover:bg-[#1a233a] border border-[#202a40] text-xs font-semibold rounded-xl text-[#8f9bb5] hover:text-white transition"
          title="Save speaker assignments to Supabase"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save Presets</span>
        </button>
        <button
          onClick={onOpenImport}
          className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-[#a354ff] to-[#685cff] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 active:scale-95 transition"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Script</span>
        </button>
      </div>
    </header>
  );
};