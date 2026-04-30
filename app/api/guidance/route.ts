import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { condition } = await req.json();

    if (!condition) {
      return NextResponse.json({ error: 'Condition is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // If no API key is provided, return intelligent mock data
    if (!apiKey) {
      return NextResponse.json({
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

    const prompt = `You are an AI dermatologist assistant. The user has received an AI image analysis prediction of "${condition}" for their skin. 
Provide 4 recommended actions they should take. Return the result strictly as a JSON array of objects. 
Each object must have the following keys:
- icon: A valid Google Material icon name (e.g. "clinical_notes", "water_drop", "block", "sanitizer", "healing", "medical_services", "spa", "local_hospital")
- label: A short, actionable title (max 5 words)
- desc: A short description (max 10 words)

Example output:
[
  { "icon": "clinical_notes", "label": "Consult a certified dermatologist", "desc": "Book an appointment for professional evaluation" }
]
Do not include markdown code block syntax like \`\`\`json. Return only the raw JSON array.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const actions = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

    return NextResponse.json({ actions });
  } catch (error) {
    console.error('Error generating AI guidance:', error);
    return NextResponse.json({ error: 'Failed to generate guidance' }, { status: 500 });
  }
}
