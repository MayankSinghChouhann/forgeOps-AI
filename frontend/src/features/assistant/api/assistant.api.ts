import apiClient from "@/lib/axios"
import { ChatSession, ChatMessage, SendMessagePayload } from "../types/assistant.types"

export const assistantApi = {
  getSessions: async (): Promise<ChatSession[]> => {
    const res = await apiClient.get<ChatSession[]>("/api/assistant/sessions")
    return Array.isArray(res.data) ? res.data : []
  },

  createSession: async (title: string): Promise<ChatSession> => {
    const res = await apiClient.post<ChatSession>("/api/assistant/sessions", { title })
    return res.data
  },

  getSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const res = await apiClient.get<ChatMessage[]>(`/api/assistant/sessions/${sessionId}/messages`)
    return Array.isArray(res.data) ? res.data : []
  },

  sendMessage: async (payload: SendMessagePayload): Promise<ChatMessage> => {
    const res = await apiClient.post<ChatMessage>("/api/assistant/chat", payload)
    return res.data
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/api/assistant/sessions/${sessionId}`)
  }
}
