import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Copy,
  Printer,
  Share2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Quote,
  Layers,
  FileCheck2,
  FileDown,
} from 'lucide-react';
import { RoastResponse, PersonaId, IntensityLevel } from '../types';
import { ScoreGauge } from './ScoreGauge';
import { ShareCardModal } from './ShareCardModal';

interface RoastOutputProps {
  roast: RoastResponse;
  persona: PersonaId;
  targetRole: string;
  intensity: IntensityLevel;
  onRoastAgain: () => void;
  onTweakPersona: (newPersona: PersonaId) => void;
  onTweakIntensity: (newIntensity: IntensityLevel) => void;
}

export const RoastOutput: React.FC<RoastOutputProps> = ({
  roast,
  persona,
  targetRole,
  intensity,
  onRoastAgain,
  onTweakPersona,
  onTweakIntensity,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [copiedText, setCopiedText] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Trigger playful firework confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f97316', '#ef4444', '#eab308', '#ffffff'],
    });
  }, []);

  const toggleChecklist = (idx: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = roast.checklist?.length || 0;

  const handleCopyRoast = async () => {
    const fullText = `🔥 ROAST MY RESUME VERDICT
Score: ${roast.score}/100 ("${roast.scoreTitle}")
Persona: ${persona}

Verdict:
"${roast.verdict}"

The Roast:
${roast.mainRoast}

Buzzwords Detected:
${roast.buzzwords?.map((b) => `• ${b.phrase} (${b.count}x)`).join('\n') || 'None'}

Top Action Items:
${roast.checklist?.map((item, i) => `${i + 1}. ${item}`).join('\n') || ''}

Pep Talk:
${roast.pepTalk}
    `;

    try {
      await navigator.clipboard.writeText(fullText.trim());
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch (err) {
      console.error('Failed to copy roast:', err);
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  // Severity style helper
  const getSeverityBadge = (severity: 'Low' | 'Medium' | 'High') => {
    switch (severity) {
      case 'High':
        return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/80 border-red-300 dark:border-red-900';
      case 'Medium':
        return 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-900';
      case 'Low':
      default:
        return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border-blue-300 dark:border-blue-900';
    }
  };

  return (
    <div className="flex flex-col gap-6" id="roast-results-container">
      {/* Action Buttons Bar at the Top of Output */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm no-print">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRoastAgain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Roast Again</span>
          </button>

          <button
            type="button"
            onClick={handleCopyRoast}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Roast</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
            title="Prints / Saves formatted PDF without page clutter"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Roast Card</span>
          </button>
        </div>
      </div>

      {/* 1. Roast Score: Animated Circular Gauge */}
      <section className="print-break-inside-avoid">
        <ScoreGauge score={roast.score} title={roast.scoreTitle} />
      </section>

      {/* 2. One-Line Verdict */}
      <section className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-red-500/10 dark:from-orange-950/40 dark:via-neutral-900 dark:to-red-950/40 border border-orange-200 dark:border-orange-900/60 shadow-sm print-break-inside-avoid">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-2">
          <Quote className="w-4 h-4" />
          <span>The Verdict · {persona}</span>
        </div>
        <p className="text-lg sm:text-xl font-extrabold italic text-neutral-900 dark:text-neutral-50 leading-relaxed font-sans">
          "{roast.verdict}"
        </p>
      </section>

      {/* 3. The Main Roast Paragraph */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3 print-break-inside-avoid">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            The Main Roast
          </h4>
          <span className="text-xs font-mono text-neutral-400">
            Intensity {intensity}/4
          </span>
        </div>
        <div className="text-sm sm:text-base leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-line font-sans">
          {roast.mainRoast}
        </div>
      </section>

      {/* 4. Section-by-Section Roast */}
      {roast.sections && roast.sections.length > 0 && (
        <section className="space-y-3 print-break-inside-avoid">
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-500" />
            Section-by-Section Breakdown
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roast.sections.map((sec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                    {sec.name}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                      sec.score >= 7
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        : sec.score >= 4
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {sec.score} / 10
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-neutral-600 dark:text-neutral-300 italic">
                    🔥 "{sec.roast}"
                  </p>
                  <p className="text-neutral-900 dark:text-neutral-200 font-medium pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">
                      Real Issue:{' '}
                    </span>
                    {sec.realIssue}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Buzzword & Cliché Detector */}
      {roast.buzzwords && roast.buzzwords.length > 0 && (
        <section className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Buzzword & Cliché Detector
            </h4>
            <span className="text-xs font-mono text-neutral-400">
              {roast.buzzwords.length} caught in the act
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Phrases that make recruiters roll their eyes into another dimension:
          </p>

          <div className="flex flex-wrap gap-2">
            {roast.buzzwords.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60"
              >
                <span>"{item.phrase}"</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  {item.count}x
                </span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 6. Red Flags vs 7. Green Flags Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-break-inside-avoid">
        {/* Red Flags */}
        <section className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Red Flags Detected
            </h4>
            <span className="text-xs font-mono text-neutral-400">
              {roast.redFlags?.length || 0} issues
            </span>
          </div>

          <div className="space-y-2">
            {roast.redFlags?.map((flag, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-xs flex items-start justify-between gap-2"
              >
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                  {flag.issue}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${getSeverityBadge(
                    flag.severity
                  )}`}
                >
                  {flag.severity}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Green Flags */}
        <section className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Green Flags (What You Did Right)
            </h4>
            <span className="text-xs font-mono text-neutral-400">
              {roast.greenFlags?.length || 0} strengths
            </span>
          </div>

          <div className="space-y-2">
            {roast.greenFlags?.map((flag, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-xs text-neutral-800 dark:text-neutral-200 flex items-start gap-2"
              >
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span className="font-medium">{flag}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 8. ATS Compatibility Score & Keyword Match */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 print-break-inside-avoid">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            ATS Compatibility Analysis
          </h4>
          <span className="text-xs font-bold font-mono text-neutral-800 dark:text-neutral-200">
            {roast.atsScore} / 100
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                roast.atsScore >= 75
                  ? 'bg-emerald-500'
                  : roast.atsScore >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${roast.atsScore}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Parsing Risk</span>
            <span>Industry Standard (~75+)</span>
            <span>ATS Optimized</span>
          </div>
        </div>

        {/* ATS Reasons */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
            Why this score?
          </span>
          <ul className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
            {roast.atsReasons?.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Keyword Match (if job description provided) */}
        {roast.keywordMatch &&
          (roast.keywordMatch.matched.length > 0 || roast.keywordMatch.missing.length > 0) && (
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Target Role Keyword Match
                </span>
                <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                  {roast.keywordMatch.percent}% Matched
                </span>
              </div>

              {/* Matched Keywords */}
              {roast.keywordMatch.matched.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Matched Keywords ({roast.keywordMatch.matched.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {roast.keywordMatch.matched.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Keywords */}
              {roast.keywordMatch.missing.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                    Missing Keywords to Add ({roast.keywordMatch.missing.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {roast.keywordMatch.missing.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                      >
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
      </section>

      {/* 9. Before → After Bullet Point Rewrites */}
      {roast.rewrites && roast.rewrites.length > 0 && (
        <section className="space-y-3 print-break-inside-avoid">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-orange-500" />
              Before → After Bullet Point Rewrites
            </h4>
            <span className="text-xs text-neutral-400">
              Quantified & Action-Oriented
            </span>
          </div>

          <div className="space-y-3">
            {roast.rewrites.map((rw, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2.5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                  {/* Original */}
                  <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 block font-mono">
                      Original Weak Bullet:
                    </span>
                    <p className="text-neutral-700 dark:text-neutral-300 italic">
                      "{rw.original}"
                    </p>
                  </div>

                  {/* Improved */}
                  <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block font-mono">
                      High-Impact Rewrite:
                    </span>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed">
                      "{rw.improved}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. Fix-It Checklist (Interactive) */}
      {roast.checklist && roast.checklist.length > 0 && (
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Check className="w-4 h-4 text-orange-500" />
                Fix-It Action Checklist
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Top 7 prioritized steps ordered by impact on interviews:
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
              {completedCount} / {totalCount} Done
            </span>
          </div>

          <div className="space-y-2">
            {roast.checklist.map((item, idx) => {
              const isDone = !!checkedItems[idx];
              return (
                <label
                  key={idx}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none text-xs ${
                    isDone
                      ? 'bg-neutral-50 dark:bg-neutral-950 text-neutral-400 dark:text-neutral-500 line-through border-neutral-200 dark:border-neutral-800'
                      : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800 hover:border-orange-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleChecklist(idx)}
                    className="accent-orange-500 w-4 h-4 rounded mt-0.5 shrink-0"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-mono text-neutral-400 text-[11px] shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="font-medium leading-relaxed">{item}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* 11. Final Pep Talk */}
      {roast.pepTalk && (
        <section className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-emerald-950/30 border border-orange-200/80 dark:border-orange-900/50 shadow-sm print-break-inside-avoid">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Final Pep Talk (Because We Actually Want You Hired)</span>
          </div>
          <p className="text-sm sm:text-base font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans italic">
            "{roast.pepTalk}"
          </p>
        </section>
      )}

      {/* Share Card Modal */}
      {isShareModalOpen && (
        <ShareCardModal
          roast={roast}
          persona={persona}
          targetRole={targetRole}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};
