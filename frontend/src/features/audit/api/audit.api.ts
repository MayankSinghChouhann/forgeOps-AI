import api from '@/lib/axios'
import type { AuditPageResponse } from '../types/audit.types'

export const auditApi = {
  search: async (correlationId?: string, actor?: string, action?: string): Promise<AuditPageResponse> => {
    const response = await api.get<AuditPageResponse>('/audit', {
      params: { correlationId: correlationId || undefined, actor: actor || undefined, action: action || undefined, size: 100 },
    })
    return response.data
  },
}
