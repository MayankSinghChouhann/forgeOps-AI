import * as React from "react"
import { Terminal, ShieldAlert, ShieldCheck, AlertTriangle, Sparkles, Copy, Check, Info } from "lucide-react"
import { terminalApi } from "../api/terminal.api"
import { CommandExplanationResponse, GeneratedCommandResponse } from "../types/terminal.types"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatusIndicator } from "@/components/ui/StatusIndicator"

const SAMPLE_COMMANDS = [
  { label: "rm -rf /", cmd: "rm -rf / --no-preserve-root", level: "DANGEROUS" },
  { label: "docker prune", cmd: "docker system prune -a --volumes", level: "CAUTION" },
  { label: "Find large files", cmd: "find / -type f -size +100M -exec ls -lh {} \\;", level: "SAFE" },
  { label: "Active TCP ports", cmd: "ss -tulpn | grep LISTEN", level: "SAFE" },
]

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

        const lines = part.split("\n")
        return (
          <div key={index} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              if (line.startsWith("### ")) {
                return (
                  <h4 key={lineIdx} className="mt-3 mb-1 text-sm font-semibold text-text-primary">
                    {line.replace("### ", "")}
                  </h4>
                )
              }
              if (line.startsWith("#### ")) {
                return (
                  <h5 key={lineIdx} className="mt-2 mb-1 text-xs font-semibold text-text-primary">
                    {line.replace("#### ", "")}
                  </h5>
                )
              }
              if (line.startsWith("- ")) {
                return (
                  <div key={lineIdx} className="flex items-start space-x-2 text-xs text-text-muted pl-2">
                    <span className="text-accent font-bold mt-0.5">•</span>
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

export function ShellAssistantPage() {
  const [activeTab, setActiveTab] = React.useState<"AUDIT" | "GENERATE">("AUDIT")
  const [commandInput, setCommandInput] = React.useState("docker system prune -a --volumes")
  const [promptInput, setPromptInput] = React.useState("Find top 10 memory consuming processes on Linux and sort by RAM")
  const [loading, setLoading] = React.useState(false)
  const [explanation, setExplanation] = React.useState<CommandExplanationResponse | null>(null)
  const [generatedOutput, setGeneratedOutput] = React.useState<GeneratedCommandResponse | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    handleAudit()
  }, [])

  const handleAudit = async (cmdToAudit = commandInput) => {
    if (!cmdToAudit.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await terminalApi.explainCommand(cmdToAudit)
      setExplanation(res)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to audit command safety.")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!promptInput.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await terminalApi.generateCommand(promptInput)
      setGeneratedOutput(res)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to generate shell command.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      <PageHeader title="API Playground" description="Audit shell commands and generate safer operational commands from natural language." actions={<StatusIndicator status="healthy" label="Command guard active" />} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Command tools">
        <button
          onClick={() => setActiveTab("AUDIT")}
          role="tab"
          aria-selected={activeTab === "AUDIT"}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "AUDIT"
              ? "border-accent text-text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Command audit
        </button>
        <button
          onClick={() => setActiveTab("GENERATE")}
          role="tab"
          aria-selected={activeTab === "GENERATE"}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "GENERATE"
              ? "border-accent text-text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Command generator
        </button>
      </div>

      {/* TAB 1: AUDIT */}
      {activeTab === "AUDIT" && (
        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-xs font-medium text-text-muted">Examples</span>
            {SAMPLE_COMMANDS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCommandInput(item.cmd)
                  handleAudit(item.cmd)
                }}
                className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text-primary transition-colors hover:border-border-strong hover:bg-surface-hover"
              >
                <span>{item.label}</span>
                <span className={`text-[9px] px-1 rounded ${
                  item.level === "DANGEROUS" ? "bg-status-failed/20 text-status-failed" :
                  item.level === "CAUTION" ? "bg-status-warning/20 text-status-warning" : "bg-status-healthy/20 text-status-healthy"
                }`}>
                  {item.level}
                </span>
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
            <label className="text-sm font-semibold text-text-primary">
              <span>Command to audit</span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAudit()}
                placeholder="e.g. docker system prune -a --volumes or rm -rf /"
                className="min-w-0 flex-1 rounded-md border border-border bg-[#0d1015] px-4 py-3 font-mono text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                onClick={() => handleAudit()}
                disabled={loading || !commandInput.trim()}
                className="rounded-md bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Audit Command"}
              </button>
            </div>
          </div>

          {error && (
          <div className="rounded-md border border-status-failed/30 bg-status-failed/10 p-3 text-sm text-status-failed">
              {error}
            </div>
          )}

          {/* Explanation Output */}
          {explanation && (
            <div className="space-y-6">
              {/* Safety Banner */}
              <div className={`rounded-lg border p-5 ${
                explanation.safetyLevel === "DANGEROUS"
                  ? "bg-status-failed/10 border-status-failed/40"
                  : explanation.safetyLevel === "CAUTION"
                  ? "bg-status-warning/10 border-status-warning/40"
                  : "bg-status-healthy/10 border-status-healthy/40"
              }`}>
                <div className="flex items-start space-x-3.5">
                  {explanation.safetyLevel === "DANGEROUS" ? (
                    <ShieldAlert className="h-5 w-5 shrink-0 text-status-failed" />
                  ) : explanation.safetyLevel === "CAUTION" ? (
                    <AlertTriangle className="h-6 w-6 text-status-warning shrink-0" />
                  ) : (
                    <ShieldCheck className="h-6 w-6 text-status-healthy shrink-0" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-text-primary">
                        Safety classification: {explanation.safetyLevel.charAt(0) + explanation.safetyLevel.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {explanation.riskExplanation}
                    </p>
                    {explanation.safeAlternative && (
                      <p className="mt-3 border-t border-border/40 pt-3 text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">Safer alternative:</span> <code className="font-mono text-xs">{explanation.safeAlternative}</code>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Flags Breakdown */}
              {explanation.flags && explanation.flags.length > 0 && (
                <div className="space-y-3 rounded-lg border border-border bg-surface p-5">
                  <div className="flex items-center space-x-2 pb-2 border-b border-border/50">
                    <Info className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-semibold text-text-primary">
                      Flags and modifiers
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {explanation.flags.map((f, i) => (
                      <div key={i} className="p-3 rounded bg-page/70 border border-border/50 flex items-start space-x-3">
                        <code className="rounded border border-border bg-[#0d1015] px-2 py-0.5 font-mono text-xs font-semibold text-text-primary">
                          {f.flag}
                        </code>
                        <p className="text-xs text-text-muted leading-relaxed">{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary / AI Breakdown */}
              <div className="rounded-lg border border-border bg-surface p-5">
                <FormattedContent content={explanation.summary} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GENERATE */}
      {activeTab === "GENERATE" && (
        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
            <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Sparkles className="h-4 w-4 text-text-muted" />
              <span>Describe what you want to accomplish in Linux / DevOps</span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="e.g. Stream the last 200 logs from a container and grep for Exception"
                className="min-w-0 flex-1 rounded-md border border-border bg-page px-4 py-3 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !promptInput.trim()}
                className="rounded-md bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Command"}
              </button>
            </div>
          </div>

          {generatedOutput && (
            <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <span className="text-sm font-semibold text-text-primary">
                  Generated Solution
                </span>
                <button
                  onClick={() => handleCopy(generatedOutput.result)}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-status-healthy" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className={`rounded-md border p-3 text-xs font-mono ${
                generatedOutput.safetyLevel === "DANGEROUS"
                  ? "border-status-failed/40 bg-status-failed/10 text-status-failed"
                  : generatedOutput.safetyLevel === "CAUTION"
                  ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
                  : "border-status-healthy/40 bg-status-healthy/10 text-status-healthy"
              }`}>
                {generatedOutput.safetyLevel}: {generatedOutput.riskExplanation}
              </div>
              <FormattedContent content={generatedOutput.result} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
