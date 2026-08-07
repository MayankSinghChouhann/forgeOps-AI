import api from "@/lib/axios"
import { GenerateTemplateRequest, TemplateResponse } from "../types/generator.types"

export const generatorApi = {
  generateTemplate: async (request: GenerateTemplateRequest): Promise<TemplateResponse> => {
    const response = await api.post<TemplateResponse>("/generator/generate", request)
    return response.data
  },

  getHistory: async (): Promise<TemplateResponse[]> => {
    const response = await api.get<TemplateResponse[]>("/generator/history")
    return response.data
  },

  getById: async (id: string): Promise<TemplateResponse> => {
    const response = await api.get<TemplateResponse>(`/generator/${id}`)
    return response.data
  },
}
