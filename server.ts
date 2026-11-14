import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Support payloads for resume uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Initialize GoogleGenAI client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// JSON Schema for structured Roast output
const roastResponseSchema = {
  type: Type.OBJECT,
  properties: {
    isResume: {
      type: Type.BOOLEAN,
      description: 'True if the text is a resume/CV, false if it is gibberish, too short, irrelevant text, shopping list, etc.',
    },
    notResumeReason: {
      type: Type.STRING,
      description: 'Funny, friendly error message if isResume is false, e.g. "That does not look like a resume. Even my oven needs ingredients."',
    },
    score: {
      type: Type.INTEGER,
      description: 'Resume Burn Level from 0 (barely warm) to 100 (total ashes/inferno).',
    },
    scoreTitle: {
      type: Type.STRING,
      description: 'Funny title describing the burn level, e.g. "Lukewarm Toast", "Slightly Charred", "Crispy Cajun", "Fire Extinguisher Needed", "Total Ashes".',
    },
    verdict: {
      type: Type.STRING,
      description: 'A single punchy, razor-sharp sentence in the chosen persona voice summarizing the resume.',
    },
    mainRoast: {
      type: Type.STRING,
      description: 'A 120-200 word hilarious roast paragraph in the chosen persona, language, and intensity level. Witty, funny, but never attacking protected traits.',
    },
    sections: {
      type: Type.ARRAY,
      description: 'Section-by-section breakdown for sections found in the resume.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Section name, e.g. Summary, Experience, Skills, Education, Projects, Formatting' },
          score: { type: Type.INTEGER, description: 'Score out of 10 for this section' },
          roast: { type: Type.STRING, description: 'One-line funny roast of this section' },
          realIssue: { type: Type.STRING, description: 'One-line serious, actionable issue with this section' },
        },
        required: ['name', 'score', 'roast', 'realIssue'],
      },
    },
    buzzwords: {
      type: Type.ARRAY,
      description: 'Overused clichés and corporate buzzwords found with approximate occurrence count.',
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          count: { type: Type.INTEGER },
        },
        required: ['phrase', 'count'],
      },
    },
    redFlags: {
      type: Type.ARRAY,
      description: 'Critical flaws, vague bullets, formatting mistakes, missing metrics, or unprofessional items.',
      items: {
        type: Type.OBJECT,
        properties: {
          issue: { type: Type.STRING },
          severity: { type: Type.STRING, description: '"Low", "Medium", or "High"' },
        },
        required: ['issue', 'severity'],
      },
    },
    greenFlags: {
      type: Type.ARRAY,
      description: 'Genuine strengths and good points in the resume so user is not completely demoralized.',
      items: { type: Type.STRING },
    },
    atsScore: {
      type: Type.INTEGER,
      description: 'Estimated ATS (Applicant Tracking System) compatibility score from 0 to 100.',
    },
    atsReasons: {
      type: Type.ARRAY,
      description: '3 to 5 concrete reasons explaining the ATS compatibility score.',
      items: { type: Type.STRING },
    },
    keywordMatch: {
      type: Type.OBJECT,
      description: 'Keyword match analysis against target role or provided job description.',
      properties: {
        percent: { type: Type.INTEGER, description: 'Match percentage from 0 to 100' },
        matched: { type: Type.ARRAY, items: { type: Type.STRING } },
        missing: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['percent', 'matched', 'missing'],
    },
    rewrites: {
      type: Type.ARRAY,
      description: '3 to 5 weakest bullet points rewritten side by side with metrics and strong action verbs.',
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING, description: 'The original weak or vague bullet point' },
          improved: { type: Type.STRING, description: 'The rewritten high-impact bullet point with metrics and action verbs' },
        },
        required: ['original', 'improved'],
      },
    },
    checklist: {
      type: Type.ARRAY,
      description: 'Top 7 prioritized, high-impact action items the user can tick off to fix their resume.',
      items: { type: Type.STRING },
    },
    pepTalk: {
      type: Type.STRING,
      description: '2 to 3 encouraging, uplifting lines to end on a positive, motivating note.',
    },
  },
  required: [
    'isResume',
    'score',
    'scoreTitle',
    'verdict',
    'mainRoast',
    'sections',
    'buzzwords',
    'redFlags',
    'greenFlags',
    'atsScore',
    'atsReasons',
    'keywordMatch',
    'rewrites',
    'checklist',
    'pepTalk',
  ],
};

// API Endpoint: Parse File (PDF / DOCX) to extract plain text
app.post('/api/parse-file', async (req: Request, res: Response) => {
  try {
    const { base64Data, fileName, fileType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    let text = '';

    const isPdf = fileType === 'application/pdf' || (fileName && fileName.toLowerCase().endsWith('.pdf'));
    const isDocx = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || (fileName && fileName.toLowerCase().endsWith('.docx'));

    if (isPdf) {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text || '';
    } else if (isDocx) {
      const docResult = await mammoth.extractRawText({ buffer });
      text = docResult.value || '';
    } else {
      // Default to utf-8 text
      text = buffer.toString('utf-8');
    }

    const trimmed = text.trim();
    return res.json({
      text: trimmed,
      charCount: trimmed.length,
      fileName,
    });
  } catch (err: unknown) {
    console.error('File parsing error:', err);
    const message = err instanceof Error ? err.message : 'Failed to parse file';
    return res.status(500).json({ error: message });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  const key = process.env.GEMINI_API_KEY || '';
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(key),
    keyPrefix: key.slice(0, 6),
    keyLength: key.length,
  });
});

// API Endpoint: Roast Resume via Gemini API
app.post('/api/roast', async (req: Request, res: Response) => {
  console.log('[API] /api/roast received request. Has GEMINI_API_KEY:', Boolean(process.env.GEMINI_API_KEY));
  try {
    const {
      resumeText,
      targetRole,
      targetIndustry,
      experienceLevel,
      jobDescription,
      targetRegion,
      roastIntensity = 2,
      persona = 'Sarcastic HR Manager',
      language = 'English',
      focusAreas = [],
      includeHelpfulFeedback = true,
      includeRewrites = true,
    } = req.body;

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'Resume text is required.' });
    }
    if (!targetRole || targetRole.trim().length === 0) {
      return res.status(400).json({ error: 'Target job role is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in the Settings > Secrets panel.',
      });
    }

    const intensityNames: Record<number, string> = {
      1: 'Gentle Toast (Friendly, playful, warm ribbing, light teasing, highly constructive)',
      2: 'Medium Roast (Sassy, cheeky, witty, calling out fluff and clichés with good humor)',
      3: 'Well Done (Brutally honest, sharp, witty, no sugarcoating, pungent burns)',
      4: 'Extra Crispy / Savage (Unfiltered comedic demolition, maximum comedic heat, merciless on buzzwords and vagueness, while strictly abiding by ethics)',
    };

    const intensityDesc = intensityNames[roastIntensity] || intensityNames[2];

    const personaDescriptions: Record<string, string> = {
      'Sarcastic HR Manager': 'A world-weary, cynical Talent Acquisition manager who has read 50,000 resumes, lives on cold brew coffee, sighs heavily at every generic cliché, and has zero patience for "results-oriented team players".',
      'Gordon Ramsay-style Chef': 'An intense, fiery, passionate head chef evaluating the resume as if it were a disastrous culinary dish. Uses hilarious kitchen metaphors ("It\'s RAW! Where is the seasoning? This bullet point is drier than overcooked turkey!"). Fictional comedic parody style.',
      'Disappointed Indian Parent': 'The classic exaggerated comedic parent comparing the applicant to Sharma ji ka beta who became a VP at Google at age 22. Wonders why the GPA is not 100%, questions life choices, but secretly wants them to succeed.',
      'Gen-Z Bestie': 'Uses modern internet slang naturally ("bestie no", "the math is not mathing", "it\'s giving unemployable", "delulu", "caught in 4k", "crying in the club"). Playful and brutally honest.',
      'Shark Tank Investor': 'An aggressive, no-nonsense venture capitalist obsessed with ROI, bottom-line revenue, and unit economics. "Where are the metrics? You spearheaded a transformation? What was the margin? For that reason, I am OUT."',
      'Stand-up Comedian': 'A sharp comedy club headliner doing an observational breakdown of corporate absurdity, resume contradictions, and resume buzzwords with punchlines and comedic timing.',
    };

    const personaDesc = personaDescriptions[persona] || personaDescriptions['Sarcastic HR Manager'];

    const systemInstruction = `You are RoastMyResume, an elite comedy writer and expert career coach powered by Gemini.
Your mission is to hilariously roast the provided resume in the specified comedic persona, intensity, and language, while also delivering world-class, genuinely actionable career feedback.

CRITICAL ROAST RULES:
1. ROAST THE WRITING AND RESUME ONLY: Roast the buzzwords, vague bullets, lack of metrics, bizarre formatting, inflated titles, and corporate jargon. NEVER roast or make jokes about personal protected traits: gender, age, race, religion, caste, nationality, disability, appearance, sexuality, or marital status.
2. FICTIONAL PERSONA IMITATION ONLY: Use the comedic persona style as parody. Never impersonate living real people or attribute real quotes.
3. REAL ACTIONABLE FIXES: Even at the highest "Savage" intensity, every single burn must be paired with real, practical, actionable advice that will help the candidate land interviews.
4. HONEST RESUME VERIFICATION: If the input text is clearly NOT a resume (e.g., gibberish, fewer than 50 characters, a cookie recipe, song lyrics, shopping list, or random unrelated essay), set "isResume": false and provide a funny, friendly error in "notResumeReason" like "That doesn't look like a resume. Even my oven needs ingredients." Do NOT fabricate a full roast for non-resumes.
5. NO HALLUCINATED FACTS: Only reference items, dates, roles, or claims actually mentioned in the resume.

CONFIGURED PARAMETERS:
- Persona: ${persona} (${personaDesc})
- Intensity Level: Level ${roastIntensity} - ${intensityDesc}
- Language: ${language} (Write the verdict, main roast, section roasts, and pep talk in this language/dialect naturally and authentically. If Hinglish, use natural Hindi-English conversational mix. If Malayalam-English mix, use natural funny expressions).
- Target Role: ${targetRole}
- Target Industry: ${targetIndustry || 'Not specified'}
- Experience Level: ${experienceLevel || 'Not specified'}
- Target Country/Region: ${targetRegion || 'Not specified'}
- Focus Areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'All standard resume areas'}
- Include Helpful Feedback: ${includeHelpfulFeedback ? 'YES' : 'NO'}
- Include Bullet Point Rewrites: ${includeRewrites ? 'YES (rewrite 3-5 of the weakest bullets)' : 'NO'}`;

    const promptText = `Please roast this resume and provide comprehensive feedback based on the parameters.

RESUME CONTENT:
"""
${resumeText}
"""

${jobDescription ? `TARGET JOB DESCRIPTION TO MATCH AGAINST:\n"""\n${jobDescription}\n"""` : ''}`;

    // Call Gemini API with automatic retry and model fallback
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let lastError: unknown = null;
    let jsonText: string | undefined;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: promptText,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: roastResponseSchema,
            },
          });
          jsonText = response.text;
          if (jsonText) break;
        } catch (err: unknown) {
          lastError = err;
          console.warn(`Attempt ${attempt} on ${modelName} failed:`, err instanceof Error ? err.message : err);
          // If 503 or transient, wait briefly before retrying
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, attempt * 1200));
          }
        }
      }
      if (jsonText) break;
    }

    if (!jsonText) {
      const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
      if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
        throw new Error('The AI grill is currently experiencing peak demand. Please click "Retry Roast" in a few seconds!');
      }
      throw new Error(`Gemini service error: ${errMsg}`);
    }

    const parsedData = JSON.parse(jsonText);
    return res.json(parsedData);
  } catch (err: unknown) {
    console.error('Roast error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate roast';
    return res.status(500).json({ error: message });
  }
});

// Configure Vite middleware in development or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`RoastMyResume server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
