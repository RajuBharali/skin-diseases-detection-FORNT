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
  riskScore: number;
  alert: boolean;
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

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.substring(start, i + 1);
      }
    }
  }

  return null;
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
You are an advanced AI Dermatology Assistant.

Your role is to provide SAFE and MEDICALLY RESPONSIBLE skin-health guidance.

━━━━━━━━━━━━━━━━━━━
PATIENT DETAILS
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
CRITICAL MEDICAL RULES
━━━━━━━━━━━━━━━━━━━

1. IMPORTANT:
- Never provide a final diagnosis.
- Always state this is an AI-based assessment.
- Encourage professional medical evaluation when necessary.

2. IF CONDITION IS SKIN CANCER OR HIGH-RISK:
Conditions include:
- Melanoma
- Basal Cell Carcinoma (BCC)
- Squamous Cell Carcinoma (SCC)
- Skin Tumor
- Sarcoma
- Any cancer-related lesion

THEN:
- urgencyLevel MUST be "URGENT"
- riskScore MUST be between 85 and 100
- alert MUST be true
- suggestion MUST start with:
  "⚠️ This may require urgent medical evaluation."
- Strongly recommend dermatologist consultation and biopsy
- Mention warning signs:
  asymmetry, irregular borders, color variation, bleeding, rapid growth
- First action MUST be:
  "Consult a Dermatologist Immediately"

Example:
"You may have BCC (Basal Cell Carcinoma). This AI assessment suggests a potentially serious skin condition requiring urgent clinical evaluation."

3. IF CHRONIC SKIN CONDITION:
Examples:
- Psoriasis
- Eczema
- Rosacea

THEN:
- urgencyLevel = "MODERATE"
- riskScore = 45-75
- alert = false

4. IF MILD CONDITION:
Examples:
- Acne
- Minor irritation
- Dry skin

THEN:
- urgencyLevel = "ROUTINE"
- riskScore = 15-40
- alert = false

5. IF HEALTHY SKIN:
- urgencyLevel = "WELLNESS"
- riskScore = 0-10
- alert = false

━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━

Return ONLY valid raw JSON.

{
  "suggestion": "Short AI assessment",
  "patientSummary": "Personalized explanation",
  "urgencyLevel": "URGENT | MODERATE | ROUTINE | WELLNESS",
  "riskScore": 95,
  "alert": true,
  "confidenceNote": "Simple confidence explanation",
  "warningSign": "Important symptoms or null",
  "followUp": "Next medical step",
  "actions": [
    {
      "icon": "warning",
      "label": "Consult a Dermatologist Immediately",
      "desc": "Schedule an urgent skin examination.",
      "category": "Immediate",
      "priority": 1
    }
  ]
}

━━━━━━━━━━━━━━━━━━━
ACTIONS RULES
━━━━━━━━━━━━━━━━━━━

- Return EXACTLY 4 actions
- Sort by priority ascending
- First action must be highest priority
- Use ONLY these icons:
medical_services, warning, health_and_safety, local_hospital, healing, water_drop, block, sanitizer, spa, wb_sunny, face, info, vaccines, medication, science, visibility, psychology, shield, verified

━━━━━━━━━━━━━━━━━━━
FINAL STRICT RULE
━━━━━━━━━━━━━━━━━━━

- Output ONLY JSON
- No markdown
- No explanations
- No extra text
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

    const cleanText = extractFirstJsonObject(text);
    if (!cleanText) {
      throw new Error("No JSON object found in AI response");
    }

    const data: AISuggestionResponse = JSON.parse(cleanText);

    // Sanitize: ensure urgencyLevel and new fields are present
    if (!data.urgencyLevel) {
      data.urgencyLevel = getUrgencyLevel(condition, confidence);
    }
    if (data.riskScore === undefined) data.riskScore = 0;
    if (data.alert === undefined) data.alert = data.urgencyLevel === 'URGENT';
    if (!Array.isArray(data.actions)) data.actions = [];

    return NextResponse.json(data);

  } catch (error) {
    console.error('[ai-suggestion] Error:', error);
    return NextResponse.json({ error: 'Failed to generate AI guidance' }, { status: 500 });
  }
}