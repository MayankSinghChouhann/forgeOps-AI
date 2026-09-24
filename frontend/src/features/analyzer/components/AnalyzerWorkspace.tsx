import * as React from "react"
import { Play, RotateCcw } from "lucide-react"
import { analyzerApi } from "../api/analyzer.api"
import { AnalysisResponse } from "../types/analyzer.types"
import { AnalysisResultCard } from "./AnalysisResultCard"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatusIndicator } from "@/components/ui/StatusIndicator"

export interface AnalyzerPreset { name: string; desc: string; log: string }

interface AnalyzerWorkspaceProps {
  title: string
  description: string
  targetType: AnalysisResponse["targetType"]
  analysisTitle: string
  presets: AnalyzerPreset[]
  inputLabel: string
  placeholder: string
  actionLabel: string
}

export function AnalyzerWorkspace({ title, description, targetType, analysisTitle, presets, inputLabel, placeholder, actionLabel }: AnalyzerWorkspaceProps) {
  const [rawLog, setRawLog] = React.useState(presets[0]?.log ?? "")
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<AnalysisResponse | null>(null)
  const [history, setHistory] = React.useState<AnalysisResponse[]>([])
  const [error, setError] = React.useState<string | null>(null)

  const loadHistory = React.useCallback(async () => {
    try { setHistory((await analyzerApi.getHistory()).filter((item) => item.targetType === targetType)) }
    catch (err) { console.error(`Failed to load ${targetType} history`, err) }
  }, [targetType])

  React.useEffect(() => { loadHistory() }, [loadHistory])

  const handleAnalyze = async () => {
    if (!rawLog.trim()) return
    setLoading(true); setError(null)
    try {
      setResult(await analyzerApi.analyzeLog({ rawLog, targetType, title: analysisTitle }))
      loadHistory()
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      setError(message || "Analysis failed. Verify the backend connection and try again.")
    } finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <PageHeader title={title} description={description} actions={<StatusIndicator status="healthy" label="Analysis engine online" />} />

      <section aria-labelledby="samples-heading">
        <h2 id="samples-heading" className="mb-3 text-sm font-semibold text-text-secondary">Sample incidents</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {presets.map((preset) => (
            <button key={preset.name} type="button" onClick={() => setRawLog(preset.log)} className="rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-hover">
              <span className="text-sm font-medium text-text-primary">{preset.name}</span>
              <span className="mt-1 block text-xs text-text-muted">{preset.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface" aria-labelledby="log-input-heading">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 id="log-input-heading" className="text-sm font-semibold text-text-primary">{inputLabel}</h2>
          <Button variant="ghost" size="sm" onClick={() => setRawLog("")}><RotateCcw className="h-3.5 w-3.5" />Clear</Button>
        </div>
        <div className="space-y-4 p-5">
          <textarea value={rawLog} onChange={(event) => setRawLog(event.target.value)} placeholder={placeholder} rows={10} spellCheck={false} className="w-full resize-y rounded-md border border-border bg-[#0d1015] p-4 font-mono text-xs leading-5 text-text-secondary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          {error && <div role="alert" className="rounded-md border border-status-failed/30 bg-status-failed/10 px-3 py-2 text-sm text-status-failed">{error}</div>}
          <div className="flex justify-end"><Button onClick={handleAnalyze} disabled={loading || !rawLog.trim()}><Play className="h-3.5 w-3.5" />{loading ? "Analyzing…" : actionLabel}</Button></div>
        </div>
      </section>

      {result && <AnalysisResultCard result={result} />}

      {history.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-border bg-surface" aria-labelledby="history-heading">
          <div className="border-b border-border px-5 py-4"><h2 id="history-heading" className="text-base font-semibold">Recent analyses</h2></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-elevated/70 text-xs text-text-muted"><tr><th className="px-5 py-3 font-medium">Analysis</th><th className="px-4 py-3 font-medium">Stage</th><th className="px-4 py-3 font-medium">Severity</th><th className="px-5 py-3 font-medium">Time</th></tr></thead><tbody className="divide-y divide-border">{history.slice(0, 5).map((item) => <tr key={item.id} tabIndex={0} onClick={() => setResult(item)} onKeyDown={(event) => event.key === "Enter" && setResult(item)} className="cursor-pointer hover:bg-surface-hover/60"><td className="px-5 py-3 font-medium text-text-primary">{item.title}</td><td className="px-4 py-3 text-text-muted">{item.failureStage}</td><td className="px-4 py-3"><StatusIndicator status={item.severity === "CRITICAL" ? "failed" : item.severity === "HIGH" ? "warning" : "info"} label={item.severity.charAt(0) + item.severity.slice(1).toLowerCase()} /></td><td className="px-5 py-3 font-mono text-xs text-text-muted">{new Date(item.createdAt).toLocaleTimeString()}</td></tr>)}</tbody></table></div>
        </section>
      )}
    </div>
  )
}
