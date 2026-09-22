import api from "@/lib/axios"
import { CommandExplanationResponse, GeneratedCommandResponse } from "../types/terminal.types"

export const terminalApi = {
  explainCommand: async (command: string): Promise<CommandExplanationResponse> => {
    const response = await api.post<CommandExplanationResponse>("/terminal/explain", { command })
    return response.data
  },

  generateCommand: async (prompt: string): Promise<GeneratedCommandResponse> => {
    const response = await api.post<GeneratedCommandResponse>("/terminal/generate", { prompt })
    return response.data
  },
}
