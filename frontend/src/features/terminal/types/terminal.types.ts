export interface FlagExplanation {
  flag: string
  description: string
}

export interface CommandExplanationResponse {
  command: string
  safetyLevel: "SAFE" | "CAUTION" | "DANGEROUS"
  riskExplanation: string
  flags: FlagExplanation[]
  safeAlternative?: string
  summary: string
}

export interface ExplainCommandRequest {
  command: string
}

export interface GenerateCommandRequest {
  prompt: string
}
