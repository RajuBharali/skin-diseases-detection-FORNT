export interface PredictionResponse {

  /* -----------------------------
     Stage 1 : Binary Detection
     Healthy vs Diseased
  ------------------------------*/
  stage1?: {
    healthy_probability: number
    diseased_probability: number
  }

  /* -----------------------------
     Stage 2 : Cancer / Lesion Model
     Example:
     mel, bcc, nv
  ------------------------------*/
  stage2?: Record<string, number>

  /* -----------------------------
     Stage 3 : General Skin Disease
     Example:
     Acne, Psoriasis, Eczema
  ------------------------------*/
  stage3?: Record<string, number>

  /* -----------------------------
     Final AI Decision
  ------------------------------*/
  final_decision: {

    /* Which stage produced the result */
    stage: 1 | 2 | 3

    /* Final predicted disease */
    result: string

    /* Confidence percentage (0-100) */
    confidence_percent: number

    /* Disease category */
    type?:
      | "Healthy"
      | "Cancer"
      | "Benign Lesion"
      | "General Skin Condition"

    /* Medical recommendation */
    medical_advice: string

    /* Cancer severity if applicable */
    cancer_level?: "low" | "moderate" | "high"

  }

}