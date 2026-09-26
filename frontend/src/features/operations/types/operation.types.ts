export type OperationStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Operation {
  id: string
  requester: string
  approver: string | null
  recommendation: string
  riskLevel: RiskLevel
  status: OperationStatus
  correlationId: string
  decisionReason: string | null
  resultSummary: string | null
  approvalExpiresAt: string
  decidedAt: string | null
  executionStartedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

export interface ExecutionHandoff {
  operationId: string
  recommendation: string
  idempotencyKey: string
  correlationId: string
  instruction: string
}

export interface EvaluationMetrics {
  totalRecommendations: number
  pendingApproval: number
  approved: number
  rejected: number
  executing: number
  succeeded: number
  failed: number
  expired: number
  recommendationAcceptanceRate: number | null
  executionSuccessRate: number | null
  averageApprovalTurnaroundMs: number | null
  averageExecutionLatencyMs: number | null
}
