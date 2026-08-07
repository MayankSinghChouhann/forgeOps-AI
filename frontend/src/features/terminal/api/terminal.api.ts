import api from "@/lib/axios"
import { CommandExplanationResponse } from "../types/terminal.types"

export const terminalApi = {
  explainCommand: async (command: string): Promise<CommandExplanationResponse> => {
    const response = await api.post<CommandExplanationResponse>("/terminal/explain", { command })
    return response.data
  },

  generateCommand: async (prompt: string): Promise<{ result: string }> => {
    const response = await api.post<{ result: string }>("/terminal/generate", { prompt })
    return response.data
  },
}
