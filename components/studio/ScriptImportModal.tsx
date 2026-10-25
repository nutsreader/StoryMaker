'use client';

import React, { useState, useRef } from 'react';
import { FileText, X } from 'lucide-react';
import { Block, PresetItem } from '@/types';

interface ScriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: PresetItem[];
  onApplyBlocks: (blocks: Block[]) => void;
  showToast: (msg: string) => void;
}

export const ScriptImportModal: React.FC < ScriptImportModalProps > = ({
  isOpen,
  onClose,
  presets,
  onApplyBlocks,
  showToast,
}) => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const fileInputRef = useRef < HTMLInputElement > (null);
  
  if (!isOpen) return null;
  
  const parseScript = (raw: string) => {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: { name: string;text: string } [] = [];
    let current: { name: string;text: string } | null = null;
    
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
  
  const handleApply = () => {
    if (!input.trim()) {
      setStatus('Maglagay o mag-paste muna ng script.');
      return;
    }
    const items = parseScript(input);
    if (items.length === 0) {
      setStatus('Walang natukoy na dialogue.');
      return;
    }
    
    const newBlocks: Block[] = items.map((it, idx) => {
      const match = presets.find(
        (p) => p.speaker_name.toLowerCase() === it.name.toLowerCase()
      );
      return {
        id: (Date.now() + idx).toString(),
        name: it.name,
        voiceId: match ? match.voice_id : '',
        dialogue: it.text,
      };
    });
    
    onApplyBlocks(newBlocks);
    onClose();
    showToast(`✓ Na-import ang ${newBlocks.length} dialogue block(s)!`);
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0b101d] border border-[#252e44] rounded-2xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#202a40]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#a354ff]" />
            <h3 className="text-sm font-bold">Import Script (.txt o Paste)</h3>
          </div>
          <button onClick={onClose} className="text-[#8f9bb5] hover:text-white">
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
                setInput(text);
                setStatus(`Na-load: "${file.name}"`);
              }}
              className="w-full text-xs text-[#8f9bb5] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#11182a] file:text-[#c29aff] hover:file:bg-[#19172e]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8f9bb5] block mb-1">
              O I-PASTE ANG RAW SCRIPT
            </label>
            <textarea
              rows={6}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Halimbawa:&#10;Host: Magandang gabi!&#10;Guest: Magandang gabi rin!"
              className="w-full bg-[#080d17] border border-[#222c42] rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#a354ff] font-mono"
            />
          </div>

          {status && <div className="text-xs text-[#4dd6a2] font-semibold">{status}</div>}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#202a40]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#11182a] hover:bg-[#1a233a] border border-[#202a40] text-xs font-bold rounded-xl text-[#8f9bb5]"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-gradient-to-r from-[#a354ff] to-[#685cff] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition"
          >
            Apply to Studio
          </button>
        </div>
      </div>
    </div>
  );
};