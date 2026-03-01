export interface PredictionResponse {
  final_decision: {
    stage: number
    result: string
    confidence_percent: number
    medical_advice: string
    cancer_level?: string
  }
  stage1?: any
  stage2?: any
  stage3?: any
}