export type PersonaId =
  | 'Sarcastic HR Manager'
  | 'Gordon Ramsay-style Chef'
  | 'Disappointed Indian Parent'
  | 'Gen-Z Bestie'
  | 'Shark Tank Investor'
  | 'Stand-up Comedian';

export interface PersonaInfo {
  id: PersonaId;
  name: string;
  tagline: string;
  avatarIcon: string;
  quoteSample: string;
}

export type IntensityLevel = 1 | 2 | 3 | 4;

export type LanguageId =
  | 'English'
  | 'Hinglish'
  | 'Malayalam-English mix'
  | 'Hindi'
  | 'Spanish'
  | 'French';

export interface SectionRoast {
  name: string;
  score: number; // 0-10
  roast: string;
  realIssue: string;
}

export interface Buzzword {
  phrase: string;
  count: number;
}

export interface RedFlag {
  issue: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface KeywordMatch {
  percent: number;
  matched: string[];
  missing: string[];
}

export interface Rewrite {
  original: string;
  improved: string;
}

export interface RoastResponse {
  isResume: boolean;
  notResumeReason?: string;
  score: number; // 0-100 burn level
  scoreTitle: string;
  verdict: string;
  mainRoast: string;
  sections: SectionRoast[];
  buzzwords: Buzzword[];
  redFlags: RedFlag[];
  greenFlags: string[];
  atsScore: number;
  atsReasons: string[];
  keywordMatch: KeywordMatch;
  rewrites: Rewrite[];
  checklist: string[];
  pepTalk: string;
}

export interface RoastRequest {
  resumeText: string;
  targetRole: string;
  targetIndustry: string;
  experienceLevel: string;
  jobDescription?: string;
  targetRegion?: string;
  roastIntensity: IntensityLevel;
  persona: PersonaId;
  language: LanguageId;
  focusAreas: string[];
  includeHelpfulFeedback: boolean;
  includeRewrites: boolean;
}

export interface SampleResume {
  id: string;
  title: string;
  badge: string;
  role: string;
  industry: string;
  experience: string;
  text: string;
  jobDescription?: string;
}
