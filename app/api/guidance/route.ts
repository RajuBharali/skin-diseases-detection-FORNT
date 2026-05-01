import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { condition, confidence } = await req.json();

    if (!condition) {
      return NextResponse.json({ error: 'Condition is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // If no API key is provided, return intelligent mock data
    if (!apiKey) {
      let suggestion = `With a confidence score of ${confidence}%, this is a baseline assessment. `;
      if (confidence > 80) {
        suggestion += "The model is highly confident. Please consult a dermatologist for confirmation and a treatment plan.";
      } else if (confidence > 50) {
        suggestion += "The model is moderately confident. Consider monitoring the area and seeking medical advice if you notice changes.";
      } else {
        suggestion += "The model has low confidence. This might be due to a blurry image or uncommon presentation. A professional evaluation is highly recommended.";
      }

      return NextResponse.json({
        suggestion,
        actions: [
          { icon: "clinical_notes", label: `Consult doctor for ${condition}`, desc: "Book an appointment for professional evaluation" },
          { icon: "water_drop", label: "Keep affected skin moisturized", desc: "Use fragrance-free emollient creams twice daily" },
          { icon: "block", label: "Avoid scratching or irritation", desc: "Use cold compresses to soothe flare-ups" },
          { icon: "sanitizer", label: "Use gentle, unscented products", desc: "Switch to hypoallergenic cleansers and detergents" }
        ]
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an AI dermatologist assistant. The user has received an AI image analysis prediction of "${condition}" for their skin with a confidence score of ${confidence}%. 
Return the result strictly as a JSON object containing two keys: "suggestion" and "actions".

1. "suggestion": A short paragraph (max 30 words) explaining how seriously they should take this result given the ${confidence}% confidence score.
2. "actions": An array of 4 recommended actions they should take. Each action object must have the keys:
   - icon: A valid Google Material icon name (e.g. "clinical_notes", "water_drop", "block", "sanitizer", "healing", "medical_services", "spa", "local_hospital", "info", "warning")
   - label: A short, actionable title (max 5 words)
   - desc: A short description (max 10 words)

Example output:
{
  "suggestion": "Given the high confidence score, it is strongly advised to schedule a consultation with a dermatologist for a professional biopsy and treatment plan.",
  "actions": [
    { "icon": "clinical_notes", "label": "Consult a certified dermatologist", "desc": "Book an appointment for professional evaluation" }
  ]
}
Do not include markdown code block syntax like \`\`\`json. Return only the raw JSON object.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating AI guidance:', error);
    return NextResponse.json({ error: 'Failed to generate guidance' }, { status: 500 });
  }
}
