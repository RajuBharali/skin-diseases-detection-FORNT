import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  let condition = "Unknown";
  let confidence = 0;

  try {
    const body = await req.json().catch(() => ({}));
    if (body.condition) condition = body.condition;
    if (body.confidence) confidence = body.confidence;
    const age = body.age || "unknown";
    const gender = body.gender || "unknown";

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
          { icon: "medical_services", label: `Consult doctor for ${condition}`, desc: "Book an appointment for professional evaluation" },
          { icon: "water_drop", label: "Keep affected skin moisturized", desc: "Use fragrance-free emollient creams twice daily" },
          { icon: "block", label: "Avoid scratching or irritation", desc: "Use cold compresses to soothe flare-ups" },
          { icon: "sanitizer", label: "Use gentle, unscented products", desc: "Switch to hypoallergenic cleansers and detergents" }
        ]
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an AI dermatologist assistant. The user has received an AI image analysis prediction of "${condition}" for their skin with a confidence score of ${confidence}%. 
    
    Patient Profile:
    - Age: ${age}
    - Gender: ${gender}

    Consider their age and gender when providing the recommendation. (e.g., skincare advice for a teenager with acne might differ from an elderly person).

    If the condition implies the skin is healthy, normal, or clear, reassure the user and DO NOT recommend seeing a doctor. Instead, recommend standard skincare maintenance like sunscreen and moisturizing.
    If the condition is a medical issue (like bcc, melanoma, eczema, etc.), provide appropriate medical advice and urge them to see a doctor.

    Return the result strictly as a JSON object containing two keys: "suggestion" and "actions".

    1. "suggestion": A short paragraph (max 30 words) explaining how seriously they should take this result given the ${confidence}% confidence score and their profile.
    2. "actions": An array of 4 recommended actions they should take. Each action object must have the keys:
       - icon: A valid Google Material icon name (e.g. "medical_services", "water_drop", "block", "sanitizer", "healing", "spa", "local_hospital", "wb_sunny", "face", "health_and_safety", "info", "warning")
       - label: A short, actionable title (max 5 words)
       - desc: A short description (max 12 words)

    Return only the raw JSON object. Do not include markdown formatting.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating AI guidance:', error);
    
    const isHealthy = condition.toLowerCase().includes('health') || condition.toLowerCase().includes('normal') || condition.toLowerCase().includes('clear') || condition.toLowerCase().includes('none');

    // Fallback if the real API fails (e.g., quota exceeded, invalid key)
    
    let suggestion = "";
    let fallbackActions = [];

    if (isHealthy) {
      suggestion = `Your skin appears healthy with a confidence score of ${confidence}%. Keep up the good work and maintain your current skincare routine.`;
      fallbackActions = [
        { icon: "water_drop", label: "Keep skin moisturized", desc: "Use a daily moisturizer to maintain hydration" },
        { icon: "wb_sunny", label: "Apply daily sunscreen", desc: "Protect your skin from UV damage with SPF 30+" },
        { icon: "local_drink", label: "Stay hydrated", desc: "Drink plenty of water throughout the day" },
        { icon: "face", label: "Gentle cleansing", desc: "Wash your face twice daily with a mild cleanser" }
      ];
    } else {
      suggestion = `With a confidence score of ${confidence}%, this is a baseline assessment. `;
      if (confidence > 80) {
        suggestion += "The model is highly confident. Please consult a dermatologist for confirmation and a treatment plan.";
      } else if (confidence > 50) {
        suggestion += "The model is moderately confident. Consider monitoring the area and seeking medical advice if you notice changes.";
      } else {
        suggestion += "The model has low confidence. This might be due to a blurry image or uncommon presentation. A professional evaluation is highly recommended.";
      }
      fallbackActions = [
        { icon: "medical_services", label: `Consult doctor for ${condition}`, desc: "Book an appointment for professional evaluation" },
        { icon: "water_drop", label: "Keep affected skin moisturized", desc: "Use fragrance-free emollient creams twice daily" },
        { icon: "block", label: "Avoid scratching or irritation", desc: "Use cold compresses to soothe flare-ups" },
        { icon: "sanitizer", label: "Use gentle, unscented products", desc: "Switch to hypoallergenic cleansers and detergents" }
      ];
    }

    return NextResponse.json({ 
      suggestion,
      actions: fallbackActions
    });
  }
}
