import * as React from "react"
import { ChatSession } from "../types/assistant.types"
import { Plus, MessageSquare, Trash2, Bot } from "lucide-react"

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeSessionId?: string
  onSelectSession: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string, e: React.MouseEvent) => void
  loading: boolean
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  loading
}: ChatSidebarProps) {
  return (
    <div className="w-72 bg-elevated border-r border-border/50 flex flex-col h-full shrink-0">
      {/* Header & New Chat */}
      <div className="p-4 border-b border-border/50">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 bg-brand-blue/20 hover:bg-brand-blue/30 text-brand-cyan border border-brand-blue/40 px-4 py-2.5 rounded-md text-xs font-mono font-medium transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New DevOps Session</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider px-2 py-1 flex items-center">
          <Bot className="h-3 w-3 mr-1.5 text-brand-cyan" />
          <span>Chat History ({sessions.length})</span>
        </div>

        {loading && sessions.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-text-muted">Loading history...</div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-text-muted">No past sessions. Start a new diagnosis!</div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-md text-xs cursor-pointer transition-all ${
                  isActive
                    ? "bg-brand-blue/20 text-brand-cyan border border-brand-blue/40"
                    : "text-text-secondary hover:bg-page/60 hover:text-text-primary border border-transparent"
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate flex-1 pr-2">
                  <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-brand-cyan" : "text-text-muted"}`} />
                  <span className="truncate font-mono">{session.title}</span>
                </div>
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  title="Delete Session"
                  className="opacity-0 group-hover:opacity-100 hover:text-status-failed text-text-muted transition-opacity p-1"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
