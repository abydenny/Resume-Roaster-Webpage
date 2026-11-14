import React, { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number; // 0 to 100
  title: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, title }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, score));
    const duration = 1200;
    const stepTime = 16;
    const stepIncrement = (end / (duration / stepTime));

    const timer = setInterval(() => {
      start += stepIncrement;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  // Color mapping based on burn level
  const getColor = (val: number) => {
    if (val < 30) return { stroke: '#eab308', text: 'text-amber-500', glow: 'shadow-amber-500/20' };
    if (val < 65) return { stroke: '#f97316', text: 'text-orange-500', glow: 'shadow-orange-500/20' };
    if (val < 85) return { stroke: '#ef4444', text: 'text-red-500', glow: 'shadow-red-500/20' };
    return { stroke: '#dc2626', text: 'text-rose-600', glow: 'shadow-rose-600/30' };
  };

  const colorInfo = getColor(score);
  const radius = 64;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: colorInfo.stroke }}
      />

      {/* SVG Circle Gauge */}
      <div className="relative shrink-0 w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
          {/* Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-neutral-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Fill */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={colorInfo.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black tabular-nums tracking-tight font-mono">
            {animatedScore}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Burn / 100
          </span>
        </div>
      </div>

      {/* Title & Level Details */}
      <div className="text-center sm:text-left space-y-1.5 flex-1">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
            Resume Burn Level
          </span>
          <span className="text-neutral-500 font-mono text-xs">·</span>
          <span className="text-xs text-neutral-400">
            {score >= 80 ? 'Inferno' : score >= 60 ? 'Crispy' : score >= 35 ? 'Toasty' : 'Warm'}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          "{title}"
        </h3>

        <p className="text-xs text-neutral-300 leading-relaxed max-w-md">
          {score >= 80
            ? 'Your resume experienced 4th-degree linguistic burns. The fire department has been notified.'
            : score >= 60
            ? 'Solidly charred with heavy corporate seasoning. A few parts survived the heat.'
            : score >= 35
            ? 'A gentle toasting. A few clichés got singed, but nothing a spatula can’t rescue.'
            : 'Barely warm! Clean structure with minimal fluff, just minor flavor adjustments needed.'}
        </p>
      </div>
    </div>
  );
};
