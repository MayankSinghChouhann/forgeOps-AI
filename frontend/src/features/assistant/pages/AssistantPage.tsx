import * as React from "react"
import { ChatSession, ChatMessage } from "../types/assistant.types"
import { assistantApi } from "../api/assistant.api"
import { ChatSidebar } from "../components/ChatSidebar"
import { ChatMessageList } from "../components/ChatMessageList"
import { ChatInput } from "../components/ChatInput"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { StatusIndicator } from "@/components/ui/StatusIndicator"

export function AssistantPage() {
  const [sessions, setSessions] = React.useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = React.useState<string | undefined>()
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [loadingSessions, setLoadingSessions] = React.useState(true)
  const [loadingMessages, setLoadingMessages] = React.useState(false)
  const [sending, setSending] = React.useState(false)

  // Load user sessions
  const loadSessions = React.useCallback(async (selectFirst = false) => {
    try {
      setLoadingSessions(true)
      const data = await assistantApi.getSessions()
      const safeData = Array.isArray(data) ? data : []
      setSessions(safeData)
      if (selectFirst && safeData.length > 0) {
        setActiveSessionId(safeData[0].id)
      }
    } catch (err) {
      console.error("Failed to load chat sessions", err)
      setSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  React.useEffect(() => {
    loadSessions(true)
  }, [loadSessions])

  // Load messages whenever activeSessionId changes
  React.useEffect(() => {
    if (!activeSessionId) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      try {
        setLoadingMessages(true)
        const data = await assistantApi.getSessionMessages(activeSessionId)
        setMessages(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Failed to load messages", err)
        setMessages([])
      } finally {
        setLoadingMessages(false)
      }
    }

    loadMessages()
  }, [activeSessionId])

  const handleNewChat = () => {
    setActiveSessionId(undefined)
    setMessages([])
  }

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await assistantApi.deleteSession(id)
      setSessions((prev) => (Array.isArray(prev) ? prev.filter((s) => s.id !== id) : []))
      if (activeSessionId === id) {
        handleNewChat()
      }
    } catch (err) {
      console.error("Failed to delete session", err)
    }
  }

  const handleSend = async (prompt: string) => {
    if (!prompt.trim() || sending) return

    // Optimistic User Message
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: "USER",
      content: prompt,
      createdAt: new Date().toISOString()
    }
    setMessages((prev) => [...prev, tempUserMsg])
    setSending(true)

    try {
      const assistantMsg = await assistantApi.sendMessageStream({
        sessionId: activeSessionId,
        prompt
      })

      // If this was a new chat session, refresh sessions to get the new ID
      if (!activeSessionId) {
        const updatedSessions = await assistantApi.getSessions()
        const safeSessions = Array.isArray(updatedSessions) ? updatedSessions : []
        setSessions(safeSessions)
        if (safeSessions.length > 0) {
          setActiveSessionId(safeSessions[0].id)
        }
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      console.error("Failed to send message", err)
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "ASSISTANT",
        content: "⚠️ **System Error**: Unable to reach DevOps Intelligence Engine. Please verify backend connection.",
        createdAt: new Date().toISOString()
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setSending(false)
    }
  }

  const safeSessions = Array.isArray(sessions) ? sessions : []
  const activeSession = safeSessions.find((s) => s.id === activeSessionId)

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 pb-4">
      <PageHeader title="AI Assistant" description="Operational guidance grounded in your current DevOps context." actions={<Button className="md:hidden" variant="secondary" size="sm" onClick={handleNewChat}><Plus className="h-3.5 w-3.5" />New session</Button>} />
      <div className="flex h-[calc(100dvh-11.5rem)] min-h-[520px] overflow-hidden rounded-lg border border-border bg-surface">
        <ChatSidebar sessions={safeSessions} activeSessionId={activeSessionId} onSelectSession={setActiveSessionId} onNewChat={handleNewChat} onDeleteSession={handleDeleteSession} loading={loadingSessions} />
        <div className="flex min-w-0 flex-1 flex-col bg-page">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 sm:px-5">
            <div className="min-w-0"><h2 className="truncate text-sm font-semibold text-text-primary">{activeSession ? activeSession.title : "New operational session"}</h2><div className="mt-1"><StatusIndicator status="healthy" label="Assistant connected" /></div></div>
            <div className="hidden items-center gap-5 text-xs text-text-muted lg:flex"><span>Environment <strong className="font-medium text-text-secondary">Production</strong></span><span>Context <strong className="font-medium text-text-secondary">Shell · Kubernetes · Docker</strong></span></div>
          </div>
          {loadingMessages ? <div className="flex flex-1 items-center justify-center text-sm text-text-muted" role="status">Loading conversation…</div> : <ChatMessageList messages={messages} sending={sending} />}
          <ChatInput onSend={handleSend} disabled={sending} />
        </div>
      </div>
    </div>
  )
}
