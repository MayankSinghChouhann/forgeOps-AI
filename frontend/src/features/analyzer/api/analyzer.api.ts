import api from "@/lib/axios"
import { AnalyzeLogRequest, AnalysisResponse } from "../types/analyzer.types"

export const analyzerApi = {
  analyzeLog: async (request: AnalyzeLogRequest): Promise<AnalysisResponse> => {
    const response = await api.post<AnalysisResponse>("/analyzer/analyze", request)
    return response.data
  },

  getHistory: async (): Promise<AnalysisResponse[]> => {
    const response = await api.get<AnalysisResponse[]>("/analyzer/history")
    return response.data
  },

  getById: async (id: string): Promise<AnalysisResponse> => {
    const response = await api.get<AnalysisResponse>(`/analyzer/${id}`)
    return response.data
  },
}
