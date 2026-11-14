import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  ShieldCheck,
  Flame,
  ChevronDown,
  Sparkles,
  Info,
  Loader2,
  FileCheck,
} from 'lucide-react';
import {
  RoastRequest,
  PersonaId,
  IntensityLevel,
  LanguageId,
} from '../types';
import { PERSONAS, FOCUS_AREAS, LOADING_PUNCHLINES } from '../data/samples';
import { autoRedactResumeText } from '../utils/redactor';

interface ResumeInputProps {
  request: RoastRequest;
  onChange: (updates: Partial<RoastRequest>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const INDUSTRIES = [
  'Tech',
  'Finance',
  'Marketing',
  'Healthcare',
  'Design',
  'Education',
  'Sales',
  'Government',
  'Startup',
  'Other',
];

const EXPERIENCE_LEVELS = [
  'Student/Fresher',
  '1-3 yrs',
  '4-8 yrs',
  '9+ yrs',
  'Career switcher',
];

const LANGUAGES: LanguageId[] = [
  'English',
  'Hinglish',
  'Malayalam-English mix',
  'Hindi',
  'Spanish',
  'French',
];

const REGIONS = ['US', 'India', 'UK', 'Canada', 'Australia', 'Europe', 'Global'];

export const ResumeInput: React.FC<ResumeInputProps> = ({
  request,
  onChange,
  onSubmit,
  isLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [uploadSuccessNote, setUploadSuccessNote] = useState<string | null>(null);
  const [autoRedactEnabled, setAutoRedactEnabled] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const [showJobDescription, setShowJobDescription] = useState(!!request.jobDescription);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rotate fun loading messages
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMessageIdx((prev) => (prev + 1) % LOADING_PUNCHLINES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setIsParsingFile(true);
    setParsingError(null);
    setUploadSuccessNote(null);

    const validExtensions = ['.pdf', '.docx', '.txt'];
    const fileNameLower = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isValid) {
      setParsingError('Please upload a PDF, DOCX, or TXT file.');
      setIsParsingFile(false);
      return;
    }

    try {
      if (fileNameLower.endsWith('.txt')) {
        const text = await file.text();
        applyExtractedText(text, file.name);
      } else {
        // PDF or DOCX: Send to server endpoint /api/parse-file
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const res = await fetch('/api/parse-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data: base64,
            fileName: file.name,
            fileType: file.type,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to parse document');
        }

        applyExtractedText(data.text, file.name);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error extracting text from file';
      setParsingError(msg);
    } finally {
      setIsParsingFile(false);
    }
  };

  const applyExtractedText = (text: string, fileName: string) => {
    let finalText = text;
    if (autoRedactEnabled) {
      const { redactedText } = autoRedactResumeText(text);
      finalText = redactedText;
    }
    onChange({ resumeText: finalText });
    setUploadSuccessNote(`Successfully extracted ${text.length.toLocaleString()} characters from ${fileName}`);
    setTimeout(() => setUploadSuccessNote(null), 5000);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    onChange({ resumeText: '' });
    setUploadSuccessNote(null);
    setParsingError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleAutoRedact = () => {
    const nextState = !autoRedactEnabled;
    setAutoRedactEnabled(nextState);
    if (nextState && request.resumeText.trim().length > 0) {
      const { redactedText, count } = autoRedactResumeText(request.resumeText);
      onChange({ resumeText: redactedText });
      setUploadSuccessNote(`Auto-redacted ${count} sensitive item(s).`);
      setTimeout(() => setUploadSuccessNote(null), 4000);
    }
  };

  const toggleFocusArea = (area: string) => {
    const current = new Set(request.focusAreas);
    if (current.has(area)) {
      current.delete(area);
    } else {
      current.add(area);
    }
    onChange({ focusAreas: Array.from(current) });
  };

  const isSubmitDisabled = !request.resumeText.trim() || !request.targetRole.trim() || isLoading;

  // Flame icons based on intensity
  const flames = Array.from({ length: request.roastIntensity }, (_, i) => '🔥').join('');

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
      {/* Step 1: Resume Upload / Paste */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-black">
              1
            </span>
            Resume Input
            <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3 text-xs">
            {/* Auto Redact Switch */}
            <button
              type="button"
              onClick={handleToggleAutoRedact}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                autoRedactEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Masks candidate name, email addresses, and phone numbers before submitting"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auto-Redact Info</span>
            </button>
            {request.resumeText && (
              <button
                type="button"
                onClick={handleClear}
                className="text-neutral-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                title="Clear resume text"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-all ${
            isDragging
              ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 scale-[0.99]'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            {isParsingFile ? (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting text from resume file…</span>
              </div>
            ) : (
              <>
                <Upload className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                  Drop PDF, DOCX, or TXT
                </span>
                <span className="text-neutral-400">or click to browse</span>
              </>
            )}
          </div>
        </div>

        {parsingError && (
          <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900">
            {parsingError}
          </p>
        )}

        {uploadSuccessNote && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5" />
            {uploadSuccessNote}
          </p>
        )}

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={request.resumeText}
            onChange={(e) => onChange({ resumeText: e.target.value })}
            placeholder="…or paste your resume text right here (Summary, Experience, Skills, Education). Don't worry, we're not shy with the grill."
            rows={7}
            className="w-full text-xs sm:text-sm font-mono leading-relaxed p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all resize-y"
          />
          <div className="flex items-center justify-between mt-1 px-1 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Processed only for the roast · Never stored
            </span>
            <span className="tabular-nums font-mono">
              {request.resumeText.length.toLocaleString()} chars
            </span>
          </div>
        </div>
      </section>

      {/* Step 2: Context Inputs */}
      <section className="space-y-3.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
        <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-black">
            2
          </span>
          Target Context
        </label>

        {/* Role & Industry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Target Job Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={request.targetRole}
              onChange={(e) => onChange({ targetRole: e.target.value })}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Target Industry
            </label>
            <select
              value={request.targetIndustry}
              onChange={(e) => onChange({ targetIndustry: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Experience Level Segmented Control */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Experience Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
            {EXPERIENCE_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onChange({ experienceLevel: lvl })}
                className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all text-center whitespace-nowrap truncate ${
                  request.experienceLevel === lvl
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Region & Optional Job Description Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Target Country / Region (Conventions)
            </label>
            <select
              value={request.targetRegion || 'US'}
              onChange={(e) => onChange({ targetRegion: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:self-end">
            <button
              type="button"
              onClick={() => setShowJobDescription(!showJobDescription)}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg text-left border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center justify-between text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <span>{showJobDescription ? 'Hide' : 'Add'} Job Description (Keyword Match)</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showJobDescription ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Expandable Job Description textarea */}
        {showJobDescription && (
          <div className="space-y-1 animate-in fade-in duration-200">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Paste Job Description (Optional)
            </label>
            <textarea
              value={request.jobDescription || ''}
              onChange={(e) => onChange({ jobDescription: e.target.value })}
              placeholder="Paste the target job description or requirements here to calculate ATS Keyword Match % and discover missing skills…"
              rows={4}
              className="w-full text-xs sm:text-sm font-mono p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
            />
          </div>
        )}
      </section>

      {/* Step 3: Roast Settings */}
      <section className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
        <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-black">
            3
          </span>
          Roast Settings & Persona
        </label>

        {/* Intensity Slider */}
        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Roast Intensity:
            </span>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <span>{flames}</span>
              <span>
                {request.roastIntensity === 1 && 'Gentle Toast'}
                {request.roastIntensity === 2 && 'Medium Roast'}
                {request.roastIntensity === 3 && 'Well Done'}
                {request.roastIntensity === 4 && 'Extra Crispy (Savage)'}
              </span>
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="4"
            step="1"
            value={request.roastIntensity}
            onChange={(e) =>
              onChange({ roastIntensity: parseInt(e.target.value, 10) as IntensityLevel })
            }
            className="w-full accent-orange-500 cursor-pointer h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-neutral-400 mt-1.5">
            <span>Gentle Toast</span>
            <span>Medium</span>
            <span>Well Done</span>
            <span className="font-semibold text-red-500">Extra Crispy</span>
          </div>
        </div>

        {/* Persona Selector */}
        <div>
          <span className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Choose Your In-Character Roaster:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PERSONAS.map((p) => {
              const isSelected = request.persona === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ persona: p.id })}
                  className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 ring-2 ring-orange-500/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-950'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl" role="img" aria-label={p.name}>
                      {p.avatarIcon}
                    </span>
                    <span
                      className={`text-xs font-bold leading-tight ${
                        isSelected
                          ? 'text-orange-700 dark:text-orange-400'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {p.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                    {p.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Language / Flavor
          </label>
          <select
            value={request.language}
            onChange={(e) => onChange({ language: e.target.value as LanguageId })}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Focus Areas Multi-Select Chips */}
        <div>
          <span className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Focus Areas:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {FOCUS_AREAS.map((area) => {
              const active = request.focusAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleFocusArea(area)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    active
                      ? 'bg-orange-500 text-white border-orange-600 font-medium shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={request.includeHelpfulFeedback}
              onChange={(e) => onChange({ includeHelpfulFeedback: e.target.checked })}
              className="accent-orange-500 w-4 h-4 rounded"
            />
            <span className="text-neutral-700 dark:text-neutral-300">
              Include serious, helpful feedback after the roast (recommended)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={request.includeRewrites}
              onChange={(e) => onChange({ includeRewrites: e.target.checked })}
              className="accent-orange-500 w-4 h-4 rounded"
            />
            <span className="text-neutral-700 dark:text-neutral-300">
              Include Before → After bullet point rewrites
            </span>
          </label>
        </div>
      </section>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
            isSubmitDisabled
              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-600 hover:via-orange-700 hover:to-red-700 text-white shadow-orange-500/25 active:scale-[0.99] cursor-pointer'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{LOADING_PUNCHLINES[loadingMessageIdx]}</span>
            </div>
          ) : (
            <>
              <Flame className="w-5 h-5 fill-current" />
              <span>Roast Me 🔥</span>
            </>
          )}
        </button>

        {(!request.resumeText.trim() || !request.targetRole.trim()) && (
          <p className="text-[11px] text-center text-neutral-400 mt-2">
            Please enter your resume text and target job role to fire up the grill.
          </p>
        )}
      </div>
    </div>
  );
};
