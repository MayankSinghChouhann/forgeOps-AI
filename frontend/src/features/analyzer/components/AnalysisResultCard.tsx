import * as React from "react"
import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react"
import { AnalysisResponse } from "../types/analyzer.types"
import { Button } from "@/components/ui/Button"
import { StatusIndicator, StatusTone } from "@/components/ui/StatusIndicator"

function InlineContent({ text }: { text: string }) {
  return <>{text.split(/(`.*?`|\*\*.*?\*\*)/g).map((part, index) => part.startsWith("`") && part.endsWith("`") ? <code key={index} className="rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-xs text-text-primary">{part.slice(1, -1)}</code> : part.startsWith("**") && part.endsWith("**") ? <strong key={index} className="font-semibold text-text-primary">{part.slice(2, -2)}</strong> : part)}</>
}

function FormattedContent({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm leading-6 text-text-secondary">
      {content.split("\n").map((line, index) => {
        const value = line.trim()
        if (!value) return <div key={index} className="h-1" />
        if (value.startsWith("### ")) return <h3 key={index} className="pt-2 text-base font-semibold text-text-primary">{value.slice(4)}</h3>
        if (value.startsWith("#### ")) return <h4 key={index} className="pt-2 text-sm font-semibold text-text-primary">{value.slice(5)}</h4>
        if (value.startsWith("- ") || value.startsWith("* ")) return <div key={index} className="flex gap-2"><span className="text-text-muted">•</span><span><InlineContent text={value.slice(2)} /></span></div>
        return <p key={index}><InlineContent text={line} /></p>
      })}
    </div>
  )
}

export function AnalysisResultCard({ result }: { result: AnalysisResponse }) {
  const [copied, setCopied] = React.useState(false)
  const [showRaw, setShowRaw] = React.useState(false)
  const tone: StatusTone = result.severity === "CRITICAL" ? "failed" : result.severity === "HIGH" ? "warning" : result.severity === "MEDIUM" ? "info" : "neutral"

  const copyScript = async () => {
    if (!result.remediationScript) return
    await navigator.clipboard.writeText(result.remediationScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface" aria-labelledby="analysis-result-title">
      <div className="flex flex-col justify-between gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-start">
        <div><h2 id="analysis-result-title" className="text-base font-semibold text-text-primary">{result.title}</h2><p className="mt-1 text-sm text-text-muted">{result.failureStage || "Pipeline execution"} · {result.targetType}</p></div>
        <StatusIndicator status={tone} label={`${result.severity.charAt(0)}${result.severity.slice(1).toLowerCase()} severity`} />
      </div>

      {result.errorSummary && <div className="border-b border-border bg-status-failed/5 px-5 py-4"><p className="text-xs font-medium text-status-failed">Failure summary</p><p className="mt-1 text-sm text-text-secondary">{result.errorSummary}</p></div>}

      <div className="grid gap-0 xl:grid-cols-2">
        <div className="border-b border-border p-5 xl:border-b-0 xl:border-r"><h3 className="mb-4 text-sm font-semibold text-text-primary">Root cause analysis</h3><FormattedContent content={result.rootCause || "Analysis completed without explicit notes."} /></div>
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-text-primary">Recommended actions</h3>{result.remediationScript && <Button variant="secondary" size="sm" onClick={copyScript}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy script"}</Button>}</div>
          {result.remediationScript ? <pre className="max-h-80 overflow-auto rounded-md border border-border bg-[#0d1015] p-4 font-mono text-xs leading-5 text-text-secondary"><code>{result.remediationScript}</code></pre> : <p className="text-sm text-text-muted">No automated remediation was generated.</p>}
        </div>
      </div>

      <button type="button" onClick={() => setShowRaw((value) => !value)} className="flex w-full items-center justify-between border-t border-border px-5 py-3 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary" aria-expanded={showRaw}>
        <span>Raw log payload · {result.rawLog?.length.toLocaleString() || 0} characters</span>{showRaw ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {showRaw && <pre className="max-h-80 overflow-auto border-t border-border bg-[#0d1015] p-5 font-mono text-xs leading-5 text-text-muted">{result.rawLog}</pre>}
    </section>
  )
}
