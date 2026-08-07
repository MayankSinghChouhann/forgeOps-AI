export interface AnalyzeLogRequest {
  rawLog: string
  targetType: "JENKINS" | "DOCKER" | "KUBERNETES" | "SYSTEM"
  title?: string
}

export interface AnalysisResponse {
  id: string
  targetType: "JENKINS" | "DOCKER" | "KUBERNETES" | "SYSTEM"
  title: string
  rawLog: string
  errorSummary: string
  rootCause: string
  failureStage: string
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  remediationScript: string
  createdAt: string
}
