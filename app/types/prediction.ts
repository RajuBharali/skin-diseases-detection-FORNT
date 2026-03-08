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
     Stage 2 : Disease Group
     Example:
     acne, eczema, psoriasis
  ------------------------------*/
  stage2?: {
    [disease: string]: number
  }

  /* -----------------------------
     Stage 3 : Advanced Classification
     Example:
     melanoma, bcc, akiec
  ------------------------------*/
  stage3?: {
    [disease: string]: number
  }

  /* -----------------------------
     Final AI Decision
  ------------------------------*/
  final_decision: {

    /* Which stage produced result */
    stage: 1 | 2 | 3

    /* Final predicted disease */
    result: string

    /* Confidence percentage */
    confidence_percent: number

    /* Disease category */
    type?: "healthy" | "disease" | "cancer"

    /* Medical recommendation */
    medical_advice: string

    /* Cancer severity (if applicable) */
    cancer_level?: "low" | "moderate" | "high"

  }

}