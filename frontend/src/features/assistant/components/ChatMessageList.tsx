import * as React from "react"
import { ChatMessage } from "../types/assistant.types"
import { Bot, User, Copy, Check, Terminal } from "lucide-react"

interface ChatMessageListProps {
  messages: ChatMessage[]
  sending: boolean
}

/**
 * FormattedContent renders formatted markdown-like text, headers, and code blocks
 * with 1-click copy support.
 */
function FormattedContent({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Parse code blocks (```lang ... ```)
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-3 text-sm leading-relaxed text-text-primary">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const firstLineEnd = part.indexOf("\n")
          const language = part.slice(3, firstLineEnd).trim() || "bash"
          const code = part.slice(firstLineEnd + 1, -3).trim()

          return (
            <div key={index} className="my-3 rounded-lg border border-border/60 bg-[#090D16] overflow-hidden shadow-inner font-mono text-xs">
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#121826] border-b border-border/40 text-[11px] text-text-muted">
                <div className="flex items-center space-x-1.5">
                  <Terminal className="h-3.5 w-3.5 text-brand-cyan" />
                  <span className="uppercase tracking-wider font-semibold text-brand-cyan/80">{language}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(code, index)}
                  className="flex items-center space-x-1 hover:text-brand-cyan transition-colors px-2 py-0.5 rounded bg-page/50 border border-border/30 active:scale-95"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3 w-3 text-status-healthy" />
                      <span className="text-status-healthy">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-brand-cyan/95 selection:bg-brand-blue/30 leading-normal">
                <code>{code}</code>
              </pre>
            </div>
          )
        }

        // Standard text lines
        return (
          <div key={index} className="space-y-1.5">
            {part.split("\n").map((line, lIndex) => {
              const trimmed = line.trim()
              if (!trimmed) return <div key={lIndex} className="h-1" />

              // H3
              if (trimmed.startsWith("### ")) {
                return (
                  <h3 key={lIndex} className="text-base font-semibold text-text-primary mt-4 mb-2 flex items-center">
                    {trimmed.replace("### ", "")}
                  </h3>
                )
              }

              // H4
              if (trimmed.startsWith("#### ")) {
                return (
                  <h4 key={lIndex} className="text-sm font-semibold text-brand-cyan/90 mt-3 mb-1.5">
                    {trimmed.replace("#### ", "")}
                  </h4>
                )
              }

              // Bullet points
              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <div key={lIndex} className="flex items-start space-x-2 ml-2 my-1">
                    <span className="text-brand-cyan font-bold leading-none mt-1.5">•</span>
                    <span className="text-text-secondary">{renderInline(trimmed.slice(2))}</span>
                  </div>
                )
              }

              // Numbered list
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
              if (numMatch) {
                return (
                  <div key={lIndex} className="flex items-start space-x-2 ml-2 my-1">
                    <span className="text-brand-cyan font-mono text-xs font-semibold leading-none mt-1">{numMatch[1]}.</span>
                    <span className="text-text-secondary">{renderInline(numMatch[2])}</span>
                  </div>
                )
              }

              return (
                <p key={lIndex} className="text-text-secondary">
                  {renderInline(line)}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function renderInline(text: string) {
  // Bold **text** and inline `code`
  const inlineParts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return inlineParts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-text-primary font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded bg-elevated border border-border/50 font-mono text-xs text-brand-cyan">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

export function ChatMessageList({ messages, sending }: ChatMessageListProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
          <div className="h-14 w-14 rounded-2xl bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(35,103,214,0.15)]">
            <Bot className="h-7 w-7 text-brand-cyan" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">ForgeOps DevOps Intelligence Assistant</h3>
          <p className="text-text-muted text-xs mt-2 leading-relaxed">
            Diagnose Kubernetes CrashLoopBackOff, troubleshoot Docker exit codes, optimize Nginx configurations, or analyze CI/CD pipeline failures.
          </p>
        </div>
      ) : (
        messages.map((msg) => {
          const isAssistant = msg.role === "ASSISTANT"
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3.5 max-w-4xl ${
                isAssistant ? "mr-auto" : "ml-auto flex-row-reverse space-x-reverse"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  isAssistant
                    ? "bg-brand-blue/15 border-brand-blue/40 text-brand-cyan"
                    : "bg-surface border-border text-text-primary"
                }`}
              >
                {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div
                className={`p-4 rounded-xl border max-w-2xl text-sm ${
                  isAssistant
                    ? "bg-elevated/90 border-border/60 shadow-sm"
                    : "bg-brand-blue/10 border-brand-blue/30 text-text-primary"
                }`}
              >
                <FormattedContent content={msg.content} />
              </div>
            </div>
          )
        })
      )}

      {sending && (
        <div className="flex items-start space-x-3.5 max-w-4xl mr-auto animate-pulse">
          <div className="h-8 w-8 rounded-lg bg-brand-blue/15 border border-brand-blue/40 text-brand-cyan flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4" />
          </div>
          <div className="p-4 rounded-xl bg-elevated/90 border border-border/60 text-xs font-mono text-text-muted flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-brand-cyan animate-ping" />
            <span>DevOps Intelligence Engine analyzing system logs...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
