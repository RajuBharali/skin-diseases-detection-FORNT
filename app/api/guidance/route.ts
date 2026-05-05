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

// ─── Fallback Data ────────────────────────────────────────────────────────────

function getFallbackResponse(
  condition: string,
  confidence: number
): AISuggestionResponse {
  const healthy = isHealthyCondition(condition);
  const urgencyLevel = getUrgencyLevel(condition, confidence);
  const confidenceLabel = getConfidenceLabel(confidence);

  if (healthy) {
    return {
      suggestion: `Your skin appears healthy with a ${confidence}% confidence score. Maintain your current skincare routine and focus on prevention.`,
      urgencyLevel: 'WELLNESS',
      confidenceNote: `At ${confidence}% confidence, the model is ${confidenceLabel === 'HIGH' ? 'highly' : 'moderately'} certain your skin is in good condition.`,
      warningSign: null,
      followUp: 'Annual skin check recommended',
      actions: [
        { icon: 'wb_sunny', label: 'Apply daily sunscreen', desc: 'Use SPF 30+ every morning, even on cloudy days', category: 'Prevention', priority: 1 },
        { icon: 'water_drop', label: 'Keep skin moisturized', desc: 'Apply a fragrance-free moisturizer twice daily', category: 'Lifestyle', priority: 2 },
        { icon: 'local_drink', label: 'Stay well hydrated', desc: 'Drink at least 8 glasses of water daily', category: 'Lifestyle', priority: 3 },
        { icon: 'face', label: 'Gentle cleansing routine', desc: 'Cleanse with a mild, pH-balanced cleanser twice daily', category: 'Lifestyle', priority: 4 },
      ],
    };
  }

  const isUrgent = urgencyLevel === 'URGENT';

  let suggestion = `With a ${confidence}% confidence score, `;
  if (confidenceLabel === 'HIGH') {
    suggestion += `the model strongly indicates ${condition}. ${isUrgent ? 'Seek medical attention promptly.' : 'Please consult a dermatologist for confirmation and a treatment plan.'}`;
  } else if (confidenceLabel === 'MODERATE') {
    suggestion += `the model moderately suspects ${condition}. Monitor the area and seek medical advice if you notice any changes.`;
  } else {
    suggestion += `the model has low confidence. The image may be unclear or the condition uncommon. A professional evaluation is highly recommended.`;
  }

  return {
    suggestion,
    urgencyLevel,
    confidenceNote: `A ${confidence}% confidence score means the model is ${confidenceLabel === 'HIGH' ? 'highly' : confidenceLabel === 'MODERATE' ? 'moderately' : 'not very'} certain about this finding.`,
    warningSign: isUrgent
      ? 'Rapid growth, irregular borders, multiple colors, or bleeding — see a doctor immediately.'
      : 'Sudden changes in size, color, or texture warrant urgent medical review.',
    followUp: isUrgent ? 'Within 1–2 weeks' : confidence >= 80 ? 'Within 2–4 weeks' : 'Within 4–6 weeks if symptoms persist',
    actions: [
      { icon: 'medical_services', label: `Consult doctor for ${condition}`, desc: 'Book a dermatologist appointment for professional evaluation', category: 'Immediate', priority: 1 },
      { icon: 'water_drop', label: 'Keep affected skin moisturized', desc: 'Use fragrance-free emollient creams twice daily', category: 'Short-term', priority: 2 },
      { icon: 'block', label: 'Avoid scratching or irritation', desc: 'Use cold compresses to soothe flare-ups', category: 'Lifestyle', priority: 3 },
      { icon: 'sanitizer', label: 'Use gentle, unscented products', desc: 'Switch to hypoallergenic cleansers and detergents', category: 'Prevention', priority: 4 },
    ],
  };
}

// ─── Build Gemini Prompt ──────────────────────────────────────────────────────

function buildPrompt(
  condition: string,
  confidence: number,
  age: string,
  gender: string,
  skinType: string,
  duration: string,
  notes: string
): string {
  const healthy = isHealthyCondition(condition);
  const confidenceLabel = getConfidenceLabel(confidence);

  return `You are an expert AI dermatologist assistant providing personalized skin health guidance.

Patient Profile:
- Detected condition: "${condition}"
- AI confidence: ${confidence}% (${confidenceLabel} confidence)
- Age: ${age}
- Gender: ${gender}
- Skin type: ${skinType}
- Symptom duration: ${duration}
- Additional notes: ${notes || 'None'}

IMPORTANT RULES:
${healthy
      ? `- The skin appears HEALTHY. Focus on maintenance and prevention ONLY.
- Do NOT recommend urgent doctor visits.
- Reassure the patient and provide wellness-focused advice.`
      : `- The AI detected a possible skin condition: ${condition}.
- Tailor advice specifically to this condition, the patient's age, gender, and skin type.
- For serious conditions (melanoma, BCC, SCC, carcinoma), use URGENT urgency and strongly advise immediate medical attention.
- For moderate conditions (eczema, psoriasis, rosacea), use MODERATE urgency.
- For minor/uncertain conditions, use ROUTINE urgency.
- All 4 actions must be specific to ${condition} — avoid generic advice.`}

Return ONLY a raw JSON object (no markdown, no backticks, no explanation) with this exact structure:
{
  "suggestion": "2–3 sentence clinical assessment personalized to this patient's age, gender, skin type and condition (max 50 words)",
  "urgencyLevel": "${healthy ? 'WELLNESS' : 'URGENT | MODERATE | ROUTINE'}",
  "confidenceNote": "One sentence interpreting the ${confidence}% confidence score for this patient",
  "warningSign": ${healthy ? 'null' : '"One specific red-flag symptom that should prompt urgent care (max 20 words)"'},
  "followUp": "Specific recommended follow-up timeline (e.g. 'Within 2 weeks', 'Annual check', etc.)",
  "actions": [
    {
      "icon": "<valid Google Material Icons name>",
      "label": "Short actionable title (max 5 words)",
      "desc": "Specific, personalized instruction for this patient (max 15 words)",
      "category": "Immediate | Short-term | Lifestyle | Prevention",
      "priority": 1
    }
  ]
}

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
    const age = body.age || 'unknown';
    const gender = body.gender || 'unknown';
    const skinType = body.skinType || 'normal';
    const duration = body.duration || 'unknown';
    const notes = body.notes || '';

    if (!condition || condition === 'Unknown') {
      return NextResponse.json({ error: 'Condition is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // ── No API key: return smart fallback ──
    if (!apiKey) {
      return NextResponse.json(getFallbackResponse(condition, confidence));
    }

    // ── Call Gemini ──
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildPrompt(condition, confidence, age, gender, skinType, duration, notes);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Strip any accidental markdown fences
    const cleanText = text.replace(/```json|```/g, '').trim();
    const data: AISuggestionResponse = JSON.parse(cleanText);

    // Sanitize: ensure urgencyLevel is always present
    if (!data.urgencyLevel) {
      data.urgencyLevel = getUrgencyLevel(condition, confidence);
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('[ai-suggestion] Error:', error);
    // Always return a valid response — never a 500 to the client
    return NextResponse.json(getFallbackResponse(condition, confidence));
  }
}