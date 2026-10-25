'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  X,
  Sparkles,
  Check,
  Users,
  Mic,
  Play,
  Pause,
  ChevronDown,
} from 'lucide-react';
import { Block, PresetItem, VoiceItem } from '@/types';
import { VoicePickerModal } from './VoicePickerModal';

interface ScriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: PresetItem[];
  voices: VoiceItem[];
  onApplyBlocks: (blocks: Block[]) => void;
  showToast: (msg: string) => void;
}

const SFX_TAG_REGEX = /^(sfx|sound|music|bgm|scene|fx|ambient|ambience|audio|effect|pause|cut)\b/i;

export const ScriptImportModal: React.FC<ScriptImportModalProps> = ({
  isOpen,
  onClose,
  presets,
  voices,
  onApplyBlocks,
  showToast,
}) => {
  const [scriptText, setScriptText] = useState('');
  const [fileName, setFileName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // 👥 Natukoy na unique characters
  const [detectedCharacters, setDetectedCharacters] = useState<
    { name: string; count: number }[]
  >([]);
  const [charVoiceMap, setCharVoiceMap] = useState<Record<string, string>>({});

  // 🎙️ Voice Picker Modal para sa bawat karakter
  const [activePickingChar, setActivePickingChar] = useState<string | null>(null);

  // 🔊 Audio player para sa mini-play preview sa card
  const [playingPreviewUrl, setPlayingPreviewUrl] = useState<string | null>(null);
  const cardAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Mini preview player para sa boses ng karakter sa card
  const playCardPreview = (e: React.MouseEvent, previewUrl: string) => {
    e.stopPropagation();

    if (playingPreviewUrl === previewUrl) {
      cardAudioRef.current?.pause();
      setPlayingPreviewUrl(null);
      return;
    }

    if (cardAudioRef.current) {
      cardAudioRef.current.pause();
    }

    const audio = new Audio(previewUrl);
    cardAudioRef.current = audio;
    setPlayingPreviewUrl(previewUrl);

    audio.play().catch(() => setPlayingPreviewUrl(null));
    audio.onended = () => setPlayingPreviewUrl(null);
    audio.onerror = () => setPlayingPreviewUrl(null);
  };

  // Smart Parser
  const parseScriptLines = (raw: string) => {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: { name: string; dialogue: string }[] = [];
    let currentBlock: { name: string; dialogue: string } | null = null;

    for (const line of lines) {
      const bracketMatch = line.match(/^\[([^\]]+)\]\s*:?\s*(.*)$/);

      if (bracketMatch) {
        const potentialTag = bracketMatch[1].trim();
        const restOfLine = bracketMatch[2].trim();

        if (SFX_TAG_REGEX.test(potentialTag)) {
          if (currentBlock) {
            currentBlock.dialogue += ` [${potentialTag}] ${restOfLine}`.trim();
          } else {
            currentBlock = {
              name: 'NARRATOR',
              dialogue: `[${potentialTag}] ${restOfLine}`.trim(),
            };
            parsed.push(currentBlock);
          }
          continue;
        }

        currentBlock = {
          name: potentialTag.toUpperCase(),
          dialogue: restOfLine,
        };
        parsed.push(currentBlock);
        continue;
      }

      const colonMatch = line.match(/^([A-Za-z0-9 _.'-]{1,35})\s*:\s*(.+)$/);
      if (colonMatch && !SFX_TAG_REGEX.test(colonMatch[1])) {
        currentBlock = {
          name: colonMatch[1].trim().toUpperCase(),
          dialogue: colonMatch[2].trim(),
        };
        parsed.push(currentBlock);
        continue;
      }

      if (currentBlock) {
        currentBlock.dialogue += (currentBlock.dialogue ? ' ' : '') + line;
      } else {
        currentBlock = { name: 'NARRATOR', dialogue: line };
        parsed.push(currentBlock);
      }
    }

    return parsed.filter((p) => p.dialogue.trim());
  };

  // ✦ AUTO-FORMAT
  const handleAutoFormat = () => {
    if (!scriptText.trim()) {
      setStatusMessage('Mag-upload o mag-paste muna ng script.');
      return;
    }

    const parsed = parseScriptLines(scriptText);
    if (parsed.length === 0) {
      setStatusMessage('Walang natukoy na dialogue.');
      return;
    }

    const counts: Record<string, number> = {};
    parsed.forEach((p) => {
      counts[p.name] = (counts[p.name] || 0) + 1;
    });

    const charactersList = Object.keys(counts).map((name) => ({
      name,
      count: counts[name],
    }));

    setDetectedCharacters(charactersList);

    const initialMap: Record<string, string> = { ...charVoiceMap };
    charactersList.forEach((char) => {
      if (!initialMap[char.name]) {
        const match = presets.find(
          (p) => p.speaker_name.toUpperCase() === char.name.toUpperCase()
        );
        if (match) initialMap[char.name] = match.voice_id;
      }
    });
    setCharVoiceMap(initialMap);

    const formatted = parsed.map((p) => `[${p.name}]\n${p.dialogue}`).join('\n\n');
    setScriptText(formatted);

    setStatusMessage(
      `✓ Natukoy ang ${parsed.length} blocks mula sa ${charactersList.length} character(s). Piliin at pakinggan ang boses sa cards sa ibaba!`
    );
    showToast('Characters detected!');
  };

  // 🚀 APPLY TO STUDIO
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

    const finalBlocks: Block[] = parsed.map((item, index) => {
      const assignedVoiceId = charVoiceMap[item.name] || '';
      return {
        id: (Date.now() + index).toString(),
        name: item.name,
        voiceId: assignedVoiceId,
        dialogue: item.dialogue,
      };
    });

    if (cardAudioRef.current) cardAudioRef.current.pause();
    onApplyBlocks(finalBlocks);
    onClose();
    showToast(`✓ Na-apply ang ${finalBlocks.length} blocks kasama ang napiling boses!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-4">
      <div className="w-full max-w-2xl bg-[#0b101d] border border-[#252e44] rounded-2xl p-5 md:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202a40]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a354ff] to-[#685cff] flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Import Script & Bulk Character Voices</h3>
              <p className="text-[10px] text-[#8f9bb5]">
                Pakinggan at i-assign ang boses ng bawat karakter nang minsanan.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (cardAudioRef.current) cardAudioRef.current.pause();
              onClose();
            }}
            className="text-[#8f9bb5] hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Picker */}
        <div>
          <label className="text-[10px] font-bold text-[#8f9bb5] tracking-wider block mb-1">
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

        {/* Script Preview / Editor */}
        <div>
          <label className="text-[10px] font-bold text-[#8f9bb5] tracking-wider block mb-1">
            SCRIPT PREVIEW / EDITOR
          </label>
          <textarea
            rows={5}
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder="I-paste dito ang script..."
            className="w-full bg-[#080d17] border border-[#222c42] rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#a354ff] font-mono resize-y"
          />
          {statusMessage && (
            <div className="text-[11px] text-[#4dd6a2] font-semibold mt-1">
              {statusMessage}
            </div>
          )}
        </div>

        {/* 🎭 MODERN CARDS: CHARACTER VOICE ASSIGNMENT (WALANG LUMANG SELECT) */}
        {detectedCharacters.length > 0 && (
          <div className="p-3.5 bg-[#080d17] border border-[#202a40] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Users className="w-4 h-4 text-[#a354ff]" />
                <span>NATUKOY NA CHARACTERS ({detectedCharacters.length})</span>
              </div>
              <span className="text-[10px] text-[#4dd6a2]">
                Piliin at pakinggan ang boses ng bawat isa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {detectedCharacters.map((char) => {
                const assignedVoiceId = charVoiceMap[char.name];
                const matchedVoice = voices.find((v) => v.id === assignedVoiceId);

                return (
                  <div
                    key={char.name}
                    className="p-3 bg-[#0d1220] border border-[#202a40] rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white block truncate">
                        {char.name}
                      </span>
                      <span className="text-[10px] text-[#8f9bb5] font-mono">
                        {char.count} lines
                      </span>
                    </div>

                    {/* 🎙️ Modern Voice Picker Button + Mini Play Button */}
                    <div className="flex items-center gap-1.5 flex-none">
                      {/* Play Audio Sample sa Card */}
                      {matchedVoice?.previewUrl && (
                        <button
                          type="button"
                          onClick={(e) => playCardPreview(e, matchedVoice.previewUrl!)}
                          className={`p-1.5 rounded-lg border transition ${
                            playingPreviewUrl === matchedVoice.previewUrl
                              ? 'bg-[#a354ff] text-white border-[#a354ff]'
                              : 'bg-[#12192a] hover:bg-[#1a233a] border-[#202a40] text-[#c29aff]'
                          }`}
                          title="Pakinggan ang boses"
                        >
                          {playingPreviewUrl === matchedVoice.previewUrl ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* Custom Voice Trigger Pill */}
                      <button
                        type="button"
                        onClick={() => setActivePickingChar(char.name)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition max-w-[135px] truncate ${
                          matchedVoice
                            ? 'bg-[#111c2e] border-[#22446a] text-[#4dd6a2]'
                            : 'bg-[#080d17] border-[#222c42] text-[#8f9bb5] hover:border-[#a354ff]'
                        }`}
                      >
                        <Mic className="w-3 h-3 text-[#a354ff] flex-none" />
                        <span className="truncate">
                          {matchedVoice ? matchedVoice.name : 'Select voice'}
                        </span>
                        <ChevronDown className="w-3 h-3 text-[#8f9bb5] flex-none" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
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
              onClick={() => {
                if (cardAudioRef.current) cardAudioRef.current.pause();
                onClose();
              }}
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

      {/* 🚀 CUSTOM VOICE PICKER MODAL (May Play Preview sa bawat boses) */}
      <VoicePickerModal
        isOpen={activePickingChar !== null}
        onClose={() => setActivePickingChar(null)}
        voices={voices}
        selectedVoiceId={activePickingChar ? charVoiceMap[activePickingChar] || '' : ''}
        onSelectVoice={(voiceId) => {
          if (activePickingChar) {
            setCharVoiceMap((prev) => ({
              ...prev,
              [activePickingChar]: voiceId,
            }));
          }
        }}
      />
    </div>
  );
};