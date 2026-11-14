import React from 'react';
import { Flame, Moon, Sun, Sparkles } from 'lucide-react';
import { SAMPLE_RESUMES } from '../data/samples';
import { SampleResume } from '../types';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onSelectSample: (sample: SampleResume) => void;
}

export const Header: React.FC<HeaderProps> = ({ isDark, onToggleTheme, onSelectSample }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand mark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-lg">
            <Flame className="w-5 h-5 fill-white text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
                RoastMyResume
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50">
                AI Career Grill
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden md:block">
              Your resume called. It wants a better life.
            </p>
          </div>
        </div>

        {/* Zone 2: Sample Picker & Nav */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 transition-colors"
              aria-label="Try with a sample resume"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline">Try with a</span> Sample
            </button>
            <div className="absolute right-0 mt-1 w-64 p-1.5 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 hidden group-hover:block hover:block z-50">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Select a sample:
              </div>
              {SAMPLE_RESUMES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => onSelectSample(sample)}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-orange-50 dark:hover:bg-orange-950/40 text-neutral-800 dark:text-neutral-200 transition-colors flex flex-col gap-0.5"
                >
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{sample.title}</span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{sample.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Zone 3: Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
