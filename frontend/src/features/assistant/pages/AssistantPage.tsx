import * as React from "react"
import { ChatSession, ChatMessage } from "../types/assistant.types"
import { assistantApi } from "../api/assistant.api"
import { ChatSidebar } from "../components/ChatSidebar"
import { ChatMessageList } from "../components/ChatMessageList"
import { ChatInput } from "../components/ChatInput"
import { Bot, Terminal, Cpu } from "lucide-react"

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
      const assistantMsg = await assistantApi.sendMessage({
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
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-border/50 bg-page overflow-hidden shadow-2xl">
      {/* Sidebar */}
      <ChatSidebar
        sessions={safeSessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        loading={loadingSessions}
      />

      {/* Main Chat Pane */}
      <div className="flex-1 flex flex-col h-full bg-page/40">
        {/* Chat Topbar */}
        <div className="px-6 py-3.5 border-b border-border/50 bg-elevated/60 backdrop-blur flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-brand-blue/15 border border-brand-blue/30 text-brand-cyan flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary tracking-tight font-mono">
                {activeSession ? activeSession.title : "New DevOps Diagnostic Session"}
              </h2>
              <p className="text-[11px] text-text-muted flex items-center space-x-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-status-healthy" />
                <span>DevOps Intelligence Engine v1.0 • Connected</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-text-muted">
            <span className="px-2 py-0.5 rounded bg-page/60 border border-border/40 flex items-center space-x-1">
              <Terminal className="h-3 w-3 text-brand-cyan" />
              <span>Shell + K8s + Docker</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-page/60 border border-border/40 flex items-center space-x-1">
              <Cpu className="h-3 w-3 text-brand-cyan" />
              <span>LangChain4j Ready</span>
            </span>
          </div>
        </div>

        {/* Message Area */}
        {loadingMessages ? (
          <div className="flex-1 flex items-center justify-center text-xs font-mono text-text-muted">
            Loading conversation messages...
          </div>
        ) : (
          <ChatMessageList messages={messages} sending={sending} />
        )}

        {/* Prompt Input */}
        <ChatInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  )
}
