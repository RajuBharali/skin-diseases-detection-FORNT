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

  return `You are an expert AI dermatologist assistant providing personalized skin health guidance.

Patient Profile:
- Name: ${name}
- Age: ${age}
- Gender: ${gender}
- Detected condition: "${condition}"
- AI confidence: ${confidence}% (${confidenceLabel} confidence)
- Skin type: ${skinType}

IMPORTANT RULES:
1. If the condition is potentially cancerous (e.g., Melanoma, Basal Cell Carcinoma, Squamous Cell Carcinoma, Sarcoma, etc.):
   - Set urgencyLevel to "URGENT".
   - The suggestion MUST start with a recommendation to see a dermatologist for a clinical biopsy.
   - The first action MUST be "Consult a Dermatologist".
   - Mention specific "Red Flags" like irregular borders, color changes, or bleeding.
2. If the condition is a chronic skin issue (Eczema, Psoriasis, etc.):
   - Set urgencyLevel to "MODERATE".
   - Recommend a dermatologist for a professional treatment plan.
3. If the skin is healthy/clear:
   - Set urgencyLevel to "WELLNESS".
   - Recommend maintenance (sunscreen, moisturizer).
4. Format: Return ONLY a raw JSON object.
5. Icons: medical_services, warning, health_and_safety, local_hospital, healing, water_drop, block.

Structure:
{
  "suggestion": "Short assessment for ${name} (max 30 words)",
  "patientSummary": "A direct summary addressing ${name} by name. If cancer is suspected, use 'Cancer screening/consult' tone. If skin issue, use 'Skin doctor guidance' tone. (max 40 words)",
  "urgencyLevel": "URGENT | MODERATE | ROUTINE | WELLNESS",
  "confidenceNote": "...",
  "warningSign": "...",
  "followUp": "...",
  "actions": [...]
}
Return exactly 4 actions.

Valid icon names: medical_services, water_drop, block, sanitizer, healing, spa, local_hospital, wb_sunny, face, health_and_safety, info, warning, vaccines, medication, coronavirus, science, visibility, thermostat, psychology, self_improvement, shield, verified, monitor_heart

Return exactly 4 action objects sorted by priority (1 = most important).
All text must be in English. Do not include any field other than those listed above.`;
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