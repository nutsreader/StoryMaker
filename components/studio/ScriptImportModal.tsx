'use client';

import React, { useState, useRef } from 'react';
import { FileText, X, Sparkles, Check } from 'lucide-react';
import { Block, PresetItem } from '@/types';

interface ScriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: PresetItem[];
  onApplyBlocks: (blocks: Block[]) => void;
  showToast: (msg: string) => void;
}

// Mga tags na DAPAT HINDI maging speaker name (mga SFX at stage directions)
const SFX_TAG_REGEX = /^(sfx|sound|music|bgm|scene|fx|ambient|ambience|audio|effect|pause|cut)\b/i;

export const ScriptImportModal: React.FC < ScriptImportModalProps > = ({
  isOpen,
  onClose,
  presets,
  onApplyBlocks,
  showToast,
}) => {
  const [scriptText, setScriptText] = useState('');
  const [fileName, setFileName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef < HTMLInputElement > (null);
  
  if (!isOpen) return null;
  
  // 🧠 SMART PARSER ENGINE: Hihiwalayin ang Speaker sa SFX at Dialogue
  const parseScriptLines = (raw: string) => {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: { name: string;dialogue: string } [] = [];
    let currentBlock: { name: string;dialogue: string } | null = null;
    
    for (const line of lines) {
      // 1. I-check kung nagsisimula sa bracket: [DJ CARLO] o [NARRATOR]
      const bracketMatch = line.match(/^\[([^\]]+)\]\s*:?\s*(.*)$/);
      
      if (bracketMatch) {
        const potentialTag = bracketMatch[1].trim();
        const restOfLine = bracketMatch[2].trim();
        
        // Kung ang nasa bracket ay [SFX: ...] o [MUSIC: ...], DIRECTION ito, HINDI speaker!
        if (SFX_TAG_REGEX.test(potentialTag)) {
          if (currentBlock) {
            currentBlock.dialogue += ` [${potentialTag}] ${restOfLine}`.trim();
          } else {
            currentBlock = { name: 'NARRATOR', dialogue: `[${potentialTag}] ${restOfLine}`.trim() };
            parsed.push(currentBlock);
          }
          continue;
        }
        
        // Tunay na Speaker ito (e.g. [DJ CARLO], [NARRATOR], [PAUL])
        currentBlock = {
          name: potentialTag.toUpperCase(),
          dialogue: restOfLine,
        };
        parsed.push(currentBlock);
        continue;
      }
      
      // 2. I-check kung standard format: DJ CARLO: "dialogue..."
      const colonMatch = line.match(/^([A-Za-z0-9 _.'-]{1,35})\s*:\s*(.+)$/);
      if (colonMatch && !SFX_TAG_REGEX.test(colonMatch[1])) {
        currentBlock = {
          name: colonMatch[1].trim().toUpperCase(),
          dialogue: colonMatch[2].trim(),
        };
        parsed.push(currentBlock);
        continue;
      }
      
      // 3. Karugtong na linya o plain narration
      if (currentBlock) {
        currentBlock.dialogue += (currentBlock.dialogue ? ' ' : '') + line;
      } else {
        currentBlock = { name: 'NARRATOR', dialogue: line };
        parsed.push(currentBlock);
      }
    }
    
    return parsed.filter((p) => p.dialogue.trim());
  };
  
  // ✦ ACTION 1: AUTO-FORMAT BUTTON
  const handleAutoFormat = () => {
    if (!scriptText.trim()) {
      setStatusMessage('Mag-upload ng .txt o mag-paste muna ng script.');
      return;
    }
    
    const parsed = parseScriptLines(scriptText);
    if (parsed.length === 0) {
      setStatusMessage('Walang natukoy na dialogue.');
      return;
    }
    
    // Aayusin ang text sa loob ng Preview box para kitang-kita ang format
    const formattedPreview = parsed
      .map((p) => `[${p.name}]\n${p.dialogue}`)
      .join('\n\n');
    
    setScriptText(formattedPreview);
    
    // Kukunin ang listahan ng unique speakers
    const uniqueSpeakers = Array.from(new Set(parsed.map((p) => p.name)));
    setStatusMessage(
      `✓ Natukoy ang ${parsed.length} dialogue turns mula sa (${uniqueSpeakers.join(', ')}). Pindutin ang "Apply to Studio".`
    );
    showToast('Auto-Format complete!');
  };
  
  // 🚀 ACTION 2: APPLY TO STUDIO BUTTON
  const handleApplyToStudio = () => {
    if (!scriptText.trim()) {
      setStatusMessage('Mag-paste o mag-load muna ng script.');
      return;
    }
    
    const parsed = parseScriptLines(scriptText);
    if (parsed.length === 0) {
      setStatusMessage('Walang dialogue na mai-a-apply.');
      return;
    }
    
    // Ikakabit ang mga boses mula sa Supabase presets kung may kaparehong pangalan
    const finalBlocks: Block[] = parsed.map((item, index) => {
      const match = presets.find(
        (p) => p.speaker_name.toUpperCase() === item.name.toUpperCase()
      );
      
      return {
        id: (Date.now() + index).toString(),
        name: item.name,
        voiceId: match ? match.voice_id : '',
        dialogue: item.dialogue,
      };
    });
    
    onApplyBlocks(finalBlocks);
    onClose();
    showToast(`✓ Na-apply ang ${finalBlocks.length} dialogue blocks sa Studio!`);
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0b101d] border border-[#252e44] rounded-2xl p-5 md:p-6 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202a40]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a354ff] to-[#685cff] flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Import Script (.txt)</h3>
              <p className="text-[10px] text-[#8f9bb5]">
                Load and preview your story lines before converting to speakers.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8f9bb5] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Picker */}
        <div>
          <label className="text-[10px] font-bold text-[#8f9bb5] tracking-wider block mb-1.5">
            SELECT TEXT FILE
          </label>
          <div className="flex items-center gap-3 p-2 bg-[#080d17] border border-[#222c42] rounded-xl">
            <input
              type="file"
              accept=".txt"
              ref={fileInputRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFileName(file.name);
                const text = await file.text();
                setScriptText(text);
                setStatusMessage(`Loaded "${file.name}". Pindutin ang "Auto-Format".`);
              }}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer px-3 py-1.5 bg-[#a354ff] hover:bg-[#9244ee] text-white text-xs font-bold rounded-lg transition"
            >
              Choose File
            </label>
            <span className="text-xs text-[#8f9bb5] truncate">
              {fileName || 'No file chosen'}
            </span>
          </div>
        </div>

        {/* Script Preview / Editor Textarea */}
        <div>
          <label className="text-[10px] font-bold text-[#8f9bb5] tracking-wider block mb-1.5">
            SCRIPT PREVIEW / EDITOR
          </label>
          <textarea
            rows={8}
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder={`I-paste dito ang raw script lines tulad nito:\n\n[DJ CARLO] [SFX: Mic click] "Magandang hatinggabi..."\n[NARRATOR] [SFX: Piano starts] "Tahimik ang gabi..."\n[PAUL]: [SFX: Flashlight click] "Ang tahimik dito..."`}
            className="w-full bg-[#080d17] border border-[#222c42] rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#a354ff] font-mono resize-y"
          />
          {statusMessage && (
            <div className="text-[11px] text-[#4dd6a2] font-semibold mt-1">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Modal Buttons (Eksaktong tulad ng nasa screenshot) */}
        <div className="flex items-center justify-between pt-3 border-t border-[#202a40]">
          <button
            onClick={handleAutoFormat}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#19172e] hover:bg-[#25203a] border border-[#a354ff]/40 text-[#c29aff] text-xs font-bold rounded-xl active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#a354ff]" />
            Auto-Format
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-[#11182a] hover:bg-[#1a233a] border border-[#202a40] text-xs font-bold rounded-xl text-[#8f9bb5]"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyToStudio}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#a354ff] to-[#685cff] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition"
            >
              <Check className="w-3.5 h-3.5" />
              Apply to Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};