import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ResumeInput } from './components/ResumeInput';
import { RoastOutput } from './components/RoastOutput';
import { RoastRequest, RoastResponse, SampleResume, PersonaId, IntensityLevel } from './types';
import { SAMPLE_RESUMES } from './data/samples';
import { Flame, AlertCircle, Sparkles, RefreshCw, Layers, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    // Default to dark theme as requested
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true;
  });

  const [request, setRequest] = useState<RoastRequest>({
    resumeText: '',
    targetRole: '',
    targetIndustry: 'Tech',
    experienceLevel: '1-3 yrs',
    jobDescription: '',
    targetRegion: 'US',
    roastIntensity: 2,
    persona: 'Sarcastic HR Manager',
    language: 'English',
    focusAreas: [
      'Formatting & Design',
      'Buzzwords & Clichés',
      'Achievements & Metrics',
      'ATS Compatibility',
    ],
    includeHelpfulFeedback: true,
    includeRewrites: true,
  });

  const [roastData, setRoastData] = useState<RoastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleRequestChange = (updates: Partial<RoastRequest>) => {
    setRequest((prev) => ({ ...prev, ...updates }));
    if (apiError) setApiError(null);
  };

  const handleSelectSample = (sample: SampleResume) => {
    setRequest((prev) => ({
      ...prev,
      resumeText: sample.text,
      targetRole: sample.role,
      targetIndustry: sample.industry,
      experienceLevel: sample.experience,
      jobDescription: sample.jobDescription || '',
    }));
    setApiError(null);
  };

  const handleSubmit = async () => {
    if (!request.resumeText.trim() || !request.targetRole.trim()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to roast resume. Please try again.');
      }

      // Check if input was identified as not a resume
      if (data.isResume === false) {
        setApiError(
          data.notResumeReason ||
            "That doesn't look like a resume. Even my oven needs ingredients. Please paste a real resume or CV!"
        );
        setRoastData(null);
      } else {
        setRoastData(data);
        // On mobile, smoothly scroll down to results
        setTimeout(() => {
          const resultsElem = document.getElementById('roast-results-container');
          if (resultsElem && window.innerWidth < 1024) {
            resultsElem.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      }
    } catch (err: unknown) {
      console.error('Roast error:', err);
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred while roasting.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors selection:bg-orange-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onSelectSample={handleSelectSample}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero Banner / Tagline Strip */}
        <section className="mb-6 sm:mb-8 text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60">
            <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
            <span>Over 25,000 Resumes Sensibly Burned</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-950 dark:text-white">
            Get Roasted by Gemini. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Then Get Hired for Real.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Upload or paste your resume. Pick an intensity and an unapologetic persona.
            Receive hilarious burns plus actionable, ATS-ready rewrites.
          </p>
        </section>

        {/* 2-Column Split: Inputs (left) vs Output (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 w-full">
            <ResumeInput
              request={request}
              onChange={handleRequestChange}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column: Output or Placeholder State */}
          <div className="lg:col-span-7 w-full">
            {apiError ? (
              <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-red-900 dark:text-red-200">
                    Grill Malfunction
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 max-w-md mx-auto leading-relaxed">
                    {apiError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Roast</span>
                </button>
              </div>
            ) : roastData ? (
              <RoastOutput
                roast={roastData}
                persona={request.persona}
                targetRole={request.targetRole}
                intensity={request.roastIntensity}
                onRoastAgain={handleSubmit}
                onTweakPersona={(newP) => {
                  handleRequestChange({ persona: newP });
                  handleSubmit();
                }}
                onTweakIntensity={(newI) => {
                  handleRequestChange({ roastIntensity: newI });
                  handleSubmit();
                }}
              />
            ) : (
              /* Empty Placeholder State before Roasting */
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-6 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto shadow-inner">
                  <Flame className="w-8 h-8 fill-current text-orange-500 animate-pulse" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    The Grill is Empty (For Now)
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Enter your resume on the left or test drive one of our hilarious pre-made
                    candidates to watch the breakdown unfold.
                  </p>
                </div>

                {/* Quick Sample Selector in Empty State */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-left space-y-3">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block text-center">
                    Quick Start with a Bad Resume:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SAMPLE_RESUMES.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSelectSample(sample)}
                        className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-neutral-50/60 dark:bg-neutral-950 hover:bg-orange-50/30 dark:hover:bg-orange-950/20 text-left transition-all group cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors block">
                            {sample.title}
                          </span>
                          <span className="text-[11px] text-neutral-400 block mt-0.5">
                            {sample.badge}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-orange-500 dark:text-orange-400 mt-2 block">
                          Load & Roast →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features Preview Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-left text-xs">
                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850">
                    <span className="font-bold text-neutral-900 dark:text-neutral-200 block">
                      🔥 Burn Gauge
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      0-100 roast heat rating
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850">
                    <span className="font-bold text-neutral-900 dark:text-neutral-200 block">
                      ⚡ ATS Score
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Parser bot breakdown
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850">
                    <span className="font-bold text-neutral-900 dark:text-neutral-200 block">
                      🎯 Bullet Rewrites
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Before vs After metrics
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850">
                    <span className="font-bold text-neutral-900 dark:text-neutral-200 block">
                      ✅ Fix-It List
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Top 7 prioritized actions
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 py-6 px-4 sm:px-6 mt-12 bg-white dark:bg-neutral-950 transition-colors no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              RoastMyResume
            </span>
            <span>· All burns paired with genuine career fixes</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Ephemeral · Never stored
            </span>
            <span>·</span>
            <span>Made with comedy & care</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
