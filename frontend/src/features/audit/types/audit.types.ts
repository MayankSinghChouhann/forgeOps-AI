export interface AuditEvent {
  id: string
  actorEmail: string | null
  actorRole: string | null
  action: string
  resourceType: string
  resourceId: string | null
  correlationId: string
  success: boolean
  metadata: string
  createdAt: string
}

export interface AuditPageResponse {
  content: AuditEvent[]
  totalElements: number
  totalPages: number
  number: number
}
