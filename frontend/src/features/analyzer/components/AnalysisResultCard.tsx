import * as React from "react"
import { AnalysisResponse } from "../types/analyzer.types"
import { Badge } from "@/components/ui/Badge"
import { Terminal, AlertTriangle, Check, Copy, ChevronDown, ChevronUp, Cpu, Wrench } from "lucide-react"

interface AnalysisResultCardProps {
  result: AnalysisResponse
}

function FormattedContent({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

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
              <pre className="p-4 overflow-x-auto text-brand-cyan/95 leading-normal">
                <code>{code}</code>
              </pre>
            </div>
          )
        }

        const lines = part.split("\n")
        return (
          <div key={index} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              if (line.startsWith("### ")) {
                return (
                  <h4 key={lineIdx} className="text-sm font-semibold text-text-primary mt-3 mb-1 font-mono">
                    {line.replace("### ", "")}
                  </h4>
                )
              }
              if (line.startsWith("#### ")) {
                return (
                  <h5 key={lineIdx} className="text-xs font-semibold text-brand-cyan mt-2 mb-1 uppercase tracking-wider font-mono">
                    {line.replace("#### ", "")}
                  </h5>
                )
              }
              if (line.startsWith("- ")) {
                return (
                  <div key={lineIdx} className="flex items-start space-x-2 text-xs text-text-muted pl-2">
                    <span className="text-brand-blue font-bold mt-0.5">•</span>
                    <span>{line.replace("- ", "")}</span>
                  </div>
                )
              }
              if (!line.trim()) {
                return <div key={lineIdx} className="h-1.5" />
              }
              return (
                <p key={lineIdx} className="text-xs text-text-muted leading-relaxed">
                  {line}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  const [copied, setCopied] = React.useState(false)
  const [showRaw, setShowRaw] = React.useState(false)

  const handleCopyScript = () => {
    if (result.remediationScript) {
      navigator.clipboard.writeText(result.remediationScript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge variant="destructive" className="animate-pulse">CRITICAL SEVERITY</Badge>
      case "HIGH":
        return <Badge variant="warning">HIGH PRIORITY</Badge>
      case "MEDIUM":
        return <Badge variant="secondary">MEDIUM PRIORITY</Badge>
      default:
        return <Badge variant="outline">INFO</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-elevated border border-border/80 rounded-card p-5 relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="h-10 w-10 rounded-lg bg-status-failed/10 border border-status-failed/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-status-failed" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-text-primary tracking-tight font-mono">{result.title}</h3>
              </div>
              <p className="text-xs text-text-muted mt-1 font-mono">
                Stage: <span className="text-brand-cyan">{result.failureStage || "Pipeline Execution"}</span> • Target: <span className="text-text-primary">{result.targetType}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getSeverityBadge(result.severity)}
          </div>
        </div>

        {/* Error Summary */}
        {result.errorSummary && (
          <div className="mt-4 p-3 rounded-md bg-page/80 border border-border/60 text-xs font-mono text-text-primary leading-relaxed">
            <span className="text-status-failed font-semibold mr-2">[FAULT]</span>
            {result.errorSummary}
          </div>
        )}
      </div>

      {/* Root Cause Analysis (RCA) Content */}
      <div className="bg-elevated border border-border/80 rounded-card p-6 shadow-lg">
        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-border/50">
          <Cpu className="h-4 w-4 text-brand-blue" />
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-primary">
            Root Cause Analysis & Diagnostic Assessment
          </h4>
        </div>
        <FormattedContent content={result.rootCause || "Analysis completed without explicit notes."} />
      </div>

      {/* Remediation Script */}
      {result.remediationScript && (
        <div className="bg-elevated border border-border/80 rounded-card p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
            <div className="flex items-center space-x-2">
              <Wrench className="h-4 w-4 text-status-healthy" />
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-primary">
                Automated Remediation Script
              </h4>
            </div>
            <button
              onClick={handleCopyScript}
              className="flex items-center space-x-1.5 px-3 py-1 text-xs font-mono font-medium rounded-md bg-brand-blue/20 text-brand-cyan border border-brand-blue/30 hover:bg-brand-blue/30 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-status-healthy" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied to Clipboard" : "Copy Bash Script"}</span>
            </button>
          </div>
          <div className="relative rounded-md overflow-hidden border border-border bg-[#07090E]">
            <pre className="p-4 text-xs font-mono text-text-primary overflow-x-auto leading-relaxed">
              <code>{result.remediationScript}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Raw Log Inspection */}
      <div className="bg-elevated/60 border border-border/60 rounded-card overflow-hidden">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono text-text-muted hover:text-text-primary hover:bg-page/40 transition-colors"
        >
          <span className="flex items-center space-x-2">
            <Terminal className="h-3.5 w-3.5" />
            <span>Raw Log Payload ({result.rawLog ? result.rawLog.length.toLocaleString() : 0} characters)</span>
          </span>
          {showRaw ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showRaw && (
          <div className="p-4 border-t border-border/50 bg-[#05070B]">
            <pre className="text-[11px] font-mono text-text-muted overflow-x-auto max-h-80 whitespace-pre-wrap">
              {result.rawLog}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
