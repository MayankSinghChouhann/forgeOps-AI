import * as React from "react"
import { ChatSession } from "../types/assistant.types"
import { Plus, MessageSquare, Trash2 } from "lucide-react"

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
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-surface md:flex" aria-label="Assistant sessions">
      {/* Header & New Chat */}
      <div className="border-b border-border p-3">
        <button
          onClick={onNewChat}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-elevated px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
        >
          <Plus className="h-4 w-4" />
          <span>New DevOps Session</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className="px-2 py-1 text-xs font-medium text-text-muted">Session history ({sessions.length})</div>

        {loading && sessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-text-muted">Loading history…</div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-text-muted">No previous sessions.</div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group flex items-center justify-between rounded-md border px-3 py-2.5 text-xs transition-colors ${
                  isActive
                    ? "border-border-strong bg-surface-hover text-text-primary"
                    : "border-transparent text-text-muted hover:bg-surface-hover/70 hover:text-text-primary"
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate flex-1 pr-2">
                  <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-accent" : "text-text-muted"}`} />
                  <span className="truncate">{session.title}</span>
                </div>
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  title="Delete session"
                  aria-label={`Delete ${session.title}`}
                  className="rounded p-1 text-text-muted opacity-0 transition-opacity hover:bg-status-failed/10 hover:text-status-failed group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
