import * as React from "react"
import { Send, Sparkles } from "lucide-react"

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
    <div className="p-4 border-t border-border/50 bg-page/80 backdrop-blur space-y-3">
      {/* Quick Prompt Suggestions */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
        <span className="text-text-muted flex items-center shrink-0">
          <Sparkles className="h-3 w-3 mr-1 text-brand-cyan" /> Suggestions:
        </span>
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSend(s)}
            disabled={disabled}
            className="shrink-0 px-2.5 py-1 rounded-full bg-elevated border border-border/60 hover:border-brand-blue/60 hover:text-brand-cyan text-text-secondary transition-all text-[11px] disabled:opacity-50 active:scale-95"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <textarea
          rows={1}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask DevOps Mentor or paste logs, manifests, or shell errors (Enter to send)..."
          disabled={disabled}
          className="w-full bg-elevated border border-border/60 focus:border-brand-blue/80 rounded-xl px-4 py-3 pr-14 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-blue/50 resize-none font-mono transition-all shadow-inner"
        />
        <button
          type="submit"
          disabled={disabled || !prompt.trim()}
          className="absolute right-2.5 bg-brand-blue hover:bg-brand-blue/80 disabled:opacity-40 text-white p-2 rounded-lg transition-all shadow-sm active:scale-95 flex items-center justify-center"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
