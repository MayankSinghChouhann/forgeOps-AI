import * as React from "react"
import { Send } from "lucide-react"

interface ChatInputProps {
  onSend: (prompt: string) => void
  disabled: boolean
}

const SUGGESTIONS = [
  "How to diagnose Kubernetes CrashLoopBackOff?",
  "Troubleshoot Docker container Exit Code 137 (OOMKilled)",
  "Fix Nginx 502 Bad Gateway with Spring Boot backend",
  "Generate production Terraform AWS VPC module"
]

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [prompt, setPrompt] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || disabled) return
    onSend(prompt.trim())
    setPrompt("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="space-y-3 border-t border-border bg-surface p-3 sm:p-4">
      {/* Quick Prompt Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="shrink-0 text-text-muted">Suggestions</span>
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSend(s)}
            disabled={disabled}
            className="shrink-0 rounded-md border border-border bg-page px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="relative flex items-end">
        <textarea
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about an incident, or paste logs, manifests, and shell errors…"
          disabled={disabled}
          className="max-h-32 min-h-14 w-full resize-none rounded-lg border border-border bg-page px-4 py-3 pr-14 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={disabled || !prompt.trim()}
          className="absolute bottom-2.5 right-2.5 flex items-center justify-center rounded-md bg-accent p-2 text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
