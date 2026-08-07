export interface GenerateTemplateRequest {
  templateType: "TERRAFORM" | "KUBERNETES" | "GITLAB_CI" | "GITHUB_ACTIONS" | "DOCKERFILE" | "HELM"
  targetProvider?: "AWS" | "GCP" | "AZURE" | "K8S" | "GENERIC"
  serviceName?: string
  environment?: string
  runtime?: string
  enablePostgres?: boolean
  enableRedis?: boolean
  enableMonitoring?: boolean
  customPrompt?: string
}

export interface TemplateResponse {
  id: string
  templateType: string
  targetProvider: string
  title: string
  description: string
  codeContent: string
  createdAt: string
}
