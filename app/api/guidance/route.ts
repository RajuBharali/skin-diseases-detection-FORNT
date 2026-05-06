import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Action {
  icon: string;
  label: string;
  desc: string;
  category?: 'Immediate' | 'Short-term' | 'Lifestyle' | 'Prevention';
  priority?: number;
}

interface AISuggestionResponse {
  suggestion: string;
  patientSummary: string;
  urgencyLevel: 'URGENT' | 'MODERATE' | 'ROUTINE' | 'WELLNESS';
  confidenceNote: string;
  warningSign: string | null;
  followUp: string;
  actions: Action[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isHealthyCondition(condition: string): boolean {
  return /health|normal|clear|none|no condition|no finding/i.test(condition);
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return 'HIGH';
  if (confidence >= 50) return 'MODERATE';
  return 'LOW';
}

function getUrgencyLevel(condition: string, confidence: number): 'URGENT' | 'MODERATE' | 'ROUTINE' | 'WELLNESS' {
  if (isHealthyCondition(condition)) return 'WELLNESS';
  if (/melanoma|bcc|scc|carcinoma|lymphoma/i.test(condition)) return 'URGENT';
  if (confidence >= 80) return 'MODERATE';
  return 'ROUTINE';
}

// ─── Build Gemini Prompt ──────────────────────────────────────────────────────

// ─── Build Gemini Prompt ──────────────────────────────────────────────────────

function buildPrompt(
  condition: string,
  confidence: number,
  name: string,
  age: string,
  gender: string,
  skinType: string,
  duration: string,
  notes: string
): string {
  const confidenceLabel = getConfidenceLabel(confidence);

  return `
You are a highly experienced AI Dermatology Assistant trained to provide SAFE, CALM, and MEDICALLY RESPONSIBLE guidance.

━━━━━━━━━━━━━━━━━━━
PATIENT PROFILE
━━━━━━━━━━━━━━━━━━━
Name: ${name}
Age: ${age}
Gender: ${gender}
Detected Condition: "${condition}"
AI Confidence: ${confidence}% (${confidenceLabel})
Skin Type: ${skinType}
Duration: ${duration}
Additional Notes: ${notes}

━━━━━━━━━━━━━━━━━━━
CORE INSTRUCTIONS (VERY IMPORTANT)
━━━━━━━━━━━━━━━━━━━

1. SAFETY FIRST:
- NEVER give a final diagnosis.
- ALWAYS include a soft medical disclaimer tone.
- Avoid causing panic, but DO NOT ignore serious risks.

2. CANCER / HIGH-RISK CONDITIONS:
If condition includes: Melanoma, Basal Cell Carcinoma (BCC), Squamous Cell Carcinoma (SCC), or any tumor:
- urgencyLevel MUST be "URGENT"
- suggestion MUST begin with:
  "This may require immediate medical evaluation."
- Strongly recommend dermatologist visit + biopsy
- warningSign MUST include:
  - asymmetry
  - irregular borders
  - color variation
  - bleeding / rapid growth
- First action MUST be:
  "Consult a Dermatologist Immediately"

3. CHRONIC CONDITIONS (Eczema, Psoriasis, etc):
- urgencyLevel = "MODERATE"
- Suggest medical consultation + skincare routine
- Focus on long-term management

4. MILD CONDITIONS (Acne, minor irritation):
- urgencyLevel = "ROUTINE"
- Suggest OTC care + hygiene + lifestyle

5. HEALTHY SKIN:
- urgencyLevel = "WELLNESS"
- Suggest prevention (sunscreen, hydration, skincare)

━━━━━━━━━━━━━━━━━━━
TONE & STYLE
━━━━━━━━━━━━━━━━━━━
- Professional but human
- Clear, calm, reassuring
- Short sentences
- No complex jargon

━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (STRICT JSON ONLY)
━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON. No explanation. No markdown.

{
  "suggestion": "Short assessment for ${name} (max 25 words)",
  "patientSummary": "Personalized explanation addressing ${name} (max 40 words)",
  "urgencyLevel": "URGENT | MODERATE | ROUTINE | WELLNESS",
  "confidenceNote": "Explain confidence simply (1 line)",
  "warningSign": "Key warning signs OR null if none",
  "followUp": "What to do next in simple terms",
  "actions": [
    {
      "icon": "valid_icon_name",
      "label": "Action title",
      "desc": "Short actionable advice",
      "category": "Immediate | Short-term | Lifestyle | Prevention",
      "priority": 1
    }
  ]
}

━━━━━━━━━━━━━━━━━━━
ACTIONS RULES
━━━━━━━━━━━━━━━━━━━
- EXACTLY 4 actions
- Sorted by priority (1 → 4)
- First action = MOST IMPORTANT
- Use ONLY valid icons:
medical_services, warning, health_and_safety, local_hospital, healing, water_drop, block, sanitizer, spa, wb_sunny, face, info, vaccines, medication, science, visibility, psychology, shield, verified

━━━━━━━━━━━━━━━━━━━
FINAL RULE
━━━━━━━━━━━━━━━━━━━
Output must be VALID JSON only.
Do NOT include explanations or extra text.
`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let condition = 'Unknown';
  let confidence = 0;

  try {
    const body = await req.json().catch(() => ({}));

    condition = body.condition || 'Unknown';
    confidence = Number(body.confidence) || 0;
    const name = body.name || 'Patient';
    const age = body.age || 'unknown';
    const gender = body.gender || 'unknown';
    const skinType = body.skinType || 'normal';
    const duration = body.duration || 'unknown';
    const notes = body.notes || '';

    if (!condition || condition === 'Unknown') {
      return NextResponse.json({ error: 'Condition is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // ── Call Gemini ──
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildPrompt(condition, confidence, name, age, gender, skinType, duration, notes);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // More robust JSON extraction (find first { and last })
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("No JSON found in AI response");
    }

    const cleanText = text.substring(jsonStart, jsonEnd + 1);
    const data: AISuggestionResponse = JSON.parse(cleanText);

    // Sanitize: ensure urgencyLevel is always present
    if (!data.urgencyLevel) {
      data.urgencyLevel = getUrgencyLevel(condition, confidence);
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('[ai-suggestion] Error:', error);
    return NextResponse.json({ error: 'Failed to generate AI guidance' }, { status: 500 });
  }
}