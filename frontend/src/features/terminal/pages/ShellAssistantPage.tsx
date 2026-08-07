import * as React from "react"
import { Terminal, ShieldAlert, ShieldCheck, AlertTriangle, Sparkles, Copy, Check, Info } from "lucide-react"
import { terminalApi } from "../api/terminal.api"
import { CommandExplanationResponse } from "../types/terminal.types"
import { Badge } from "@/components/ui/Badge"

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

export function ShellAssistantPage() {
  const [activeTab, setActiveTab] = React.useState<"AUDIT" | "GENERATE">("AUDIT")
  const [commandInput, setCommandInput] = React.useState("docker system prune -a --volumes")
  const [promptInput, setPromptInput] = React.useState("Find top 10 memory consuming processes on Linux and sort by RAM")
  const [loading, setLoading] = React.useState(false)
  const [explanation, setExplanation] = React.useState<CommandExplanationResponse | null>(null)
  const [generatedOutput, setGeneratedOutput] = React.useState<string | null>(null)
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
      setGeneratedOutput(res.result)
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
      {/* Header */}
      <div className="bg-elevated border border-border/70 rounded-card p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between relative overflow-hidden shadow-lg">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center shrink-0">
            <Terminal className="h-5 w-5 text-brand-cyan" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight font-mono">
              Linux Shell Assistant & Destructive Command Guard
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Deep CLI syntax analysis, destructive command prevention, flag breakdowns, and natural language command generation.
            </p>
          </div>
        </div>
        <Badge variant="success" className="bg-status-healthy/10 text-status-healthy border-status-healthy/20">
          <span className="h-1.5 w-1.5 rounded-full bg-status-healthy mr-1.5 animate-pulse" />
          Guard Active
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-border/50 pb-2">
        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`px-4 py-2 rounded-md font-mono text-xs font-medium transition-all ${
            activeTab === "AUDIT"
              ? "bg-brand-blue text-white shadow-md"
              : "text-text-muted hover:text-text-primary hover:bg-elevated"
          }`}
        >
          1. Command Audit & Safety Guard
        </button>
        <button
          onClick={() => setActiveTab("GENERATE")}
          className={`px-4 py-2 rounded-md font-mono text-xs font-medium transition-all ${
            activeTab === "GENERATE"
              ? "bg-brand-blue text-white shadow-md"
              : "text-text-muted hover:text-text-primary hover:bg-elevated"
          }`}
        >
          2. Natural Language CLI Synthesizer
        </button>
      </div>

      {/* TAB 1: AUDIT */}
      {activeTab === "AUDIT" && (
        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-text-muted uppercase font-semibold mr-2">Audit Presets:</span>
            {SAMPLE_COMMANDS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCommandInput(item.cmd)
                  handleAudit(item.cmd)
                }}
                className="px-2.5 py-1 rounded bg-elevated border border-border/70 hover:border-brand-cyan/40 text-xs font-mono text-text-primary flex items-center space-x-1.5 transition-all"
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
          <div className="bg-elevated border border-border/80 rounded-card p-5 shadow-lg space-y-4">
            <label className="text-xs font-mono font-semibold text-text-primary flex items-center space-x-2">
              <span>Enter Linux / Docker / SRE Shell Command to Audit</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAudit()}
                placeholder="e.g. docker system prune -a --volumes or rm -rf /"
                className="flex-1 rounded-md bg-[#07090E] border border-border/80 px-4 py-3 font-mono text-xs text-text-primary focus:outline-none focus:border-brand-cyan shadow-inner"
              />
              <button
                onClick={() => handleAudit()}
                disabled={loading || !commandInput.trim()}
                className="px-6 py-3 rounded-md bg-brand-blue hover:bg-brand-blue/90 text-white font-mono text-xs font-medium transition-all shadow disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Audit Command"}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded bg-status-failed/10 border border-status-failed/30 text-xs text-status-failed font-mono">
              {error}
            </div>
          )}

          {/* Explanation Output */}
          {explanation && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Safety Banner */}
              <div className={`p-5 rounded-card border shadow-lg ${
                explanation.safetyLevel === "DANGEROUS"
                  ? "bg-status-failed/10 border-status-failed/40"
                  : explanation.safetyLevel === "CAUTION"
                  ? "bg-status-warning/10 border-status-warning/40"
                  : "bg-status-healthy/10 border-status-healthy/40"
              }`}>
                <div className="flex items-start space-x-3.5">
                  {explanation.safetyLevel === "DANGEROUS" ? (
                    <ShieldAlert className="h-6 w-6 text-status-failed shrink-0 animate-bounce" />
                  ) : explanation.safetyLevel === "CAUTION" ? (
                    <AlertTriangle className="h-6 w-6 text-status-warning shrink-0" />
                  ) : (
                    <ShieldCheck className="h-6 w-6 text-status-healthy shrink-0" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono font-bold uppercase tracking-wider text-text-primary">
                        Safety Classification: {explanation.safetyLevel}
                      </span>
                    </div>
                    <p className="text-xs text-text-primary font-mono leading-relaxed">
                      {explanation.riskExplanation}
                    </p>
                    {explanation.safeAlternative && (
                      <p className="text-xs text-brand-cyan font-mono mt-2 pt-2 border-t border-border/40">
                        💡 Recommended Safe Alternative: {explanation.safeAlternative}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Flags Breakdown */}
              {explanation.flags && explanation.flags.length > 0 && (
                <div className="bg-elevated border border-border/80 rounded-card p-6 shadow-md space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-border/50">
                    <Info className="h-4 w-4 text-brand-blue" />
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-primary">
                      Command Flags & Modifiers Breakdown
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {explanation.flags.map((f, i) => (
                      <div key={i} className="p-3 rounded bg-page/70 border border-border/50 flex items-start space-x-3">
                        <code className="text-xs font-mono font-bold text-brand-cyan bg-[#07090E] px-2 py-0.5 rounded border border-border">
                          {f.flag}
                        </code>
                        <p className="text-xs text-text-muted leading-relaxed">{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary / AI Breakdown */}
              <div className="bg-elevated border border-border/80 rounded-card p-6 shadow-md">
                <FormattedContent content={explanation.summary} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GENERATE */}
      {activeTab === "GENERATE" && (
        <div className="space-y-6">
          <div className="bg-elevated border border-border/80 rounded-card p-5 shadow-lg space-y-4">
            <label className="text-xs font-mono font-semibold text-text-primary flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-brand-cyan" />
              <span>Describe what you want to accomplish in Linux / DevOps</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="e.g. Stream the last 200 logs from a container and grep for Exception"
                className="flex-1 rounded-md bg-[#07090E] border border-border/80 px-4 py-3 font-mono text-xs text-text-primary focus:outline-none focus:border-brand-cyan shadow-inner"
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !promptInput.trim()}
                className="px-6 py-3 rounded-md bg-brand-blue hover:bg-brand-blue/90 text-white font-mono text-xs font-medium transition-all shadow disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Command"}
              </button>
            </div>
          </div>

          {generatedOutput && (
            <div className="bg-elevated border border-border/80 rounded-card p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <span className="text-xs font-mono font-semibold text-text-primary">
                  Generated Solution
                </span>
                <button
                  onClick={() => handleCopy(generatedOutput)}
                  className="flex items-center space-x-1.5 px-3 py-1 text-xs font-mono font-medium rounded-md bg-brand-blue/20 text-brand-cyan border border-brand-blue/30 hover:bg-brand-blue/30 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-status-healthy" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <FormattedContent content={generatedOutput} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
