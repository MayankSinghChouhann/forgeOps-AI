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
            <div key={index} className="my-3 overflow-hidden rounded-md border border-border bg-[#0d1015] font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border bg-elevated px-3.5 py-2 text-[11px] text-text-muted">
                <div className="flex items-center space-x-1.5">
                  <Terminal className="h-3.5 w-3.5" />
                  <span className="font-medium">{language}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(code, index)}
                  className="flex items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-surface-hover hover:text-text-primary"
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
              <pre className="overflow-x-auto p-4 leading-normal text-text-secondary">
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
                  <h4 key={lIndex} className="mt-3 mb-1.5 text-sm font-semibold text-text-primary">
                    {trimmed.replace("#### ", "")}
                  </h4>
                )
              }

              // Bullet points
              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <div key={lIndex} className="flex items-start space-x-2 ml-2 my-1">
                    <span className="mt-1.5 font-bold leading-none text-text-muted">•</span>
                    <span className="text-text-secondary">{renderInline(trimmed.slice(2))}</span>
                  </div>
                )
              }

              // Numbered list
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
              if (numMatch) {
                return (
                  <div key={lIndex} className="flex items-start space-x-2 ml-2 my-1">
                    <span className="mt-1 font-mono text-xs font-semibold leading-none text-text-muted">{numMatch[1]}.</span>
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
        <code key={i} className="mx-0.5 rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-xs text-text-primary">
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
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      {messages.length === 0 ? (
        <div className="mx-auto flex h-full max-w-xl flex-col justify-center py-12 text-center">
          <h3 className="text-base font-semibold text-text-primary">Start an operational investigation</h3>
          <p className="mt-2 text-sm leading-6 text-text-muted">Ask about Kubernetes failures, Docker exit codes, Nginx configuration, CI/CD incidents, or infrastructure design.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl divide-y divide-border">{messages.map((msg) => {
          const isAssistant = msg.role === "ASSISTANT"
          return (
            <div
              key={msg.id}
              className="flex items-start gap-3 py-5"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                  isAssistant
                    ? "border-border bg-elevated text-accent"
                    : "border-border bg-surface-hover text-text-secondary"
                }`}
              >
                {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div className="min-w-0 flex-1 text-sm">
                <p className="mb-2 text-xs font-medium text-text-muted">{isAssistant ? "ForgeOps Assistant" : "You"}</p>
                <FormattedContent content={msg.content} />
              </div>
            </div>
          )
        })}</div>
      )}

      {sending && (
        <div className="mx-auto flex max-w-4xl items-start gap-3 border-t border-border py-5" role="status">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-elevated text-accent">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2 pt-2 text-sm text-text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            <span>Analyzing the current context…</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
