export interface PredictionResponse {

  stage1?: {
    healthy_probability: number
    diseased_probability: number
  }

  stage2?: Record<string, number>

  stage3?: Record<string, number>

  final_decision: {
    stage: number
    result: string
    confidence_percent: number
    type?: string
    medical_advice: string
    cancer_level?: string
  }

}