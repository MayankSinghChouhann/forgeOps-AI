import api from '@/lib/axios'
import type { EvaluationMetrics, ExecutionHandoff, Operation, OperationStatus, PageResponse } from '../types/operation.types'

export const operationsApi = {
  list: async (status?: OperationStatus): Promise<PageResponse<Operation>> => {
    const response = await api.get<PageResponse<Operation>>('/operations', { params: { status, size: 100 } })
    return response.data
  },
  decide: async (id: string, approved: boolean, reason?: string): Promise<Operation> => {
    const response = await api.post<Operation>(`/operations/${id}/decision`, { approved, reason })
    return response.data
  },
  start: async (id: string, idempotencyKey: string): Promise<ExecutionHandoff> => {
    const response = await api.post<ExecutionHandoff>(`/operations/${id}/execution/start`, { idempotencyKey })
    return response.data
  },
  complete: async (id: string, idempotencyKey: string, succeeded: boolean, summary: string): Promise<Operation> => {
    const response = await api.post<Operation>(`/operations/${id}/execution/result`, { idempotencyKey, succeeded, summary })
    return response.data
  },
  metrics: async (): Promise<EvaluationMetrics> => {
    const response = await api.get<EvaluationMetrics>('/evaluation/metrics')
    return response.data
  },
}
