import apiClient from "@/lib/axios"
import { ChatSession, ChatMessage, SendMessagePayload } from "../types/assistant.types"

export const assistantApi = {
  getSessions: async (): Promise<ChatSession[]> => {
    const res = await apiClient.get<ChatSession[]>("/assistant/sessions")
    return Array.isArray(res.data) ? res.data : []
  },

  createSession: async (title: string): Promise<ChatSession> => {
    const res = await apiClient.post<ChatSession>("/assistant/sessions", { title })
    return res.data
  },

  getSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const res = await apiClient.get<ChatMessage[]>(`/assistant/sessions/${sessionId}/messages`)
    return Array.isArray(res.data) ? res.data : []
  },

  sendMessage: async (payload: SendMessagePayload): Promise<ChatMessage> => {
    const res = await apiClient.post<ChatMessage>("/assistant/chat", payload)
    return res.data
  },

  sendMessageStream: async (payload: SendMessagePayload): Promise<ChatMessage> => {
    const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/assistant/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok || !response.body) throw new Error(`Streaming request failed (${response.status})`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let message: ChatMessage | null = null
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() || ''
      for (const block of blocks) {
        const eventName = block.split(/\r?\n/).find((line) => line.startsWith('event:'))?.slice(6).trim()
        const data = block.split(/\r?\n/).filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim()).join('\n')
        if (eventName === 'message' && data) message = JSON.parse(data) as ChatMessage
      }
      if (done) break
    }
    if (!message) throw new Error('Stream completed without an assistant response')
    return message
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/assistant/sessions/${sessionId}`)
  }
}
