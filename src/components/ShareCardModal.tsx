import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { X, Download, Copy, Check, Flame, Sparkles } from 'lucide-react';
import { RoastResponse, PersonaId } from '../types';

interface ShareCardModalProps {
  roast: RoastResponse;
  persona: PersonaId;
  targetRole: string;
  onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  roast,
  persona,
  targetRole,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Top 3 burns from section roasts or red flags
  const topBurns = [
    ...(roast.sections || []).map((s) => `[${s.name}] ${s.roast}`),
    ...(roast.redFlags || []).map((r) => r.issue),
  ].slice(0, 3);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `RoastMyResume-Score-${roast.score}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export card image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      // Fetch blob and write to clipboard
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Clipboard write failed, falling back to download:', err);
      handleDownloadImage();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-white">Shareable Roast Card</h3>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
              Personal Data Scrubbed
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Screenshot-Friendly Card to Render */}
        <div
          ref={cardRef}
          className="p-6 rounded-2xl bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white border border-neutral-800 shadow-xl space-y-4 font-sans select-none"
        >
          {/* Card Top Brand */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white">
                <Flame className="w-3.5 h-3.5 fill-white" />
              </div>
              <span className="font-black text-sm tracking-tight text-white">
                RoastMyResume
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Target Role
              </span>
              <p className="text-xs font-bold text-orange-400 truncate max-w-[160px]">
                {targetRole}
              </p>
            </div>
          </div>

          {/* Burn Score & Title */}
          <div className="flex items-center justify-between bg-neutral-900/90 p-4 rounded-xl border border-neutral-800">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Resume Burn Level
              </span>
              <h4 className="text-lg font-black text-white">"{roast.scoreTitle}"</h4>
              <span className="text-xs text-neutral-400">Persona: {persona}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-orange-600/10 border border-orange-500/30 text-orange-500 font-mono font-black text-2xl">
              <span>{roast.score}</span>
              <span className="text-[9px] uppercase tracking-tighter text-neutral-400">/ 100</span>
            </div>
          </div>

          {/* Verdict Quote */}
          <div className="p-3 rounded-xl bg-orange-500/10 border-l-2 border-orange-500 text-xs italic text-orange-200 leading-relaxed">
            "{roast.verdict}"
          </div>

          {/* Top 3 Burns */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
              Top Burns:
            </span>
            {topBurns.map((burn, idx) => (
              <div
                key={idx}
                className="text-xs text-neutral-300 bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/80 flex items-start gap-2"
              >
                <span className="text-orange-500 font-bold shrink-0">#{idx + 1}</span>
                <span className="leading-snug">{burn}</span>
              </div>
            ))}
          </div>

          {/* Card Footer */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-500">
            <span>Powered by Gemini AI</span>
            <span>roastmyresume.app</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyImage}
            disabled={isGenerating}
            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Card Image</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isGenerating}
            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
