import * as React from "react"
import { GitMerge, Sparkles, Copy, Check, Download, Layers, ShieldCheck, Cpu } from "lucide-react"
import { generatorApi } from "../api/generator.api"
import { TemplateResponse } from "../types/generator.types"
import { Badge } from "@/components/ui/Badge"

export function PipelineGeneratorPage() {
  const [pipelineType, setPipelineType] = React.useState<"GITLAB_CI" | "GITHUB_ACTIONS">("GITLAB_CI")
  const [serviceName, setServiceName] = React.useState("forgeops-core-service")
  const [runtime, setRuntime] = React.useState("java")
  const [loading, setLoading] = React.useState(false)
  const [template, setTemplate] = React.useState<TemplateResponse | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    handleGenerate()
  }, [pipelineType, runtime])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await generatorApi.generateTemplate({
        templateType: pipelineType,
        targetProvider: "GENERIC",
        serviceName,
        runtime,
        environment: "production",
      })
      setTemplate(res)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to generate CI/CD pipeline template.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (template?.codeContent) {
      navigator.clipboard.writeText(template.codeContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!template?.codeContent) return
    const filename = pipelineType === "GITLAB_CI" ? ".gitlab-ci.yml" : "deploy.yml"
    const blob = new Blob([template.codeContent], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="bg-elevated border border-border/70 rounded-card p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between relative overflow-hidden shadow-lg">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-lg bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center shrink-0">
            <GitMerge className="h-5 w-5 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight font-mono">
              CI/CD Pipeline Generator
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Production-grade GitLab CI & GitHub Actions YAML workflows with security gates, caching, and automated deployment.
            </p>
          </div>
        </div>
        <Badge variant="success" className="bg-status-healthy/10 text-status-healthy border-status-healthy/20">
          <span className="h-1.5 w-1.5 rounded-full bg-status-healthy mr-1.5 animate-pulse" />
          Pipeline Engine Active
        </Badge>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pipeline Target */}
        <div className="bg-elevated border border-border/80 rounded-card p-5 shadow-sm space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            1. Target CI/CD Platform
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPipelineType("GITLAB_CI")}
              className={`p-3 rounded-md border text-xs font-mono font-medium transition-all ${
                pipelineType === "GITLAB_CI"
                  ? "bg-brand-blue/20 border-brand-blue text-brand-cyan shadow-sm"
                  : "bg-page/50 border-border/60 text-text-muted hover:text-text-primary hover:bg-page"
              }`}
            >
              GitLab CI/CD
              <span className="block text-[10px] text-text-muted mt-0.5">.gitlab-ci.yml</span>
            </button>
            <button
              onClick={() => setPipelineType("GITHUB_ACTIONS")}
              className={`p-3 rounded-md border text-xs font-mono font-medium transition-all ${
                pipelineType === "GITHUB_ACTIONS"
                  ? "bg-brand-blue/20 border-brand-blue text-brand-cyan shadow-sm"
                  : "bg-page/50 border-border/60 text-text-muted hover:text-text-primary hover:bg-page"
              }`}
            >
              GitHub Actions
              <span className="block text-[10px] text-text-muted mt-0.5">deploy.yml</span>
            </button>
          </div>
        </div>

        {/* Runtime Stack */}
        <div className="bg-elevated border border-border/80 rounded-card p-5 shadow-sm space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            2. Application Runtime
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "java", label: "Java 21 (Spring Boot)" },
              { id: "node", label: "Node.js (React/Vite)" },
              { id: "go", label: "Go (Golang 1.22)" },
              { id: "python", label: "Python (FastAPI)" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRuntime(r.id)}
                className={`p-2.5 rounded-md border text-xs font-mono transition-all text-left ${
                  runtime === r.id
                    ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan"
                    : "bg-page/50 border-border/60 text-text-muted hover:text-text-primary"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Gates */}
        <div className="bg-elevated border border-border/80 rounded-card p-5 shadow-sm space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            3. Included Stages
          </span>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center space-x-2 text-status-healthy">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Unit & Integration Testing</span>
            </div>
            <div className="flex items-center space-x-2 text-brand-cyan">
              <Layers className="h-3.5 w-3.5" />
              <span>Docker Multi-Stage Build & Push</span>
            </div>
            <div className="flex items-center space-x-2 text-status-warning">
              <Cpu className="h-3.5 w-3.5" />
              <span>Trivy Container Security Vulnerability Scan</span>
            </div>
            <div className="flex items-center space-x-2 text-text-primary">
              <GitMerge className="h-3.5 w-3.5 text-brand-blue" />
              <span>Kubernetes Zero-Downtime Rollout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor & Preview Card */}
      <div className="bg-elevated border border-border/80 rounded-card p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div className="flex items-center space-x-2">
            <div className="h-2.5 w-2.5 rounded-full bg-status-healthy animate-pulse" />
            <span className="text-xs font-mono font-semibold text-text-primary">
              {pipelineType === "GITLAB_CI" ? ".gitlab-ci.yml" : ".github/workflows/deploy.yml"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-brand-blue/20 text-brand-cyan border border-brand-blue/30 hover:bg-brand-blue/30 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-status-healthy" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy YAML"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-page border border-border/80 text-text-primary hover:bg-elevated transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-status-failed/10 border border-status-failed/30 text-xs text-status-failed font-mono">
            {error}
          </div>
        )}

        <div className="relative rounded-md overflow-hidden border border-border bg-[#06080D]">
          <pre className="p-5 text-xs font-mono text-text-primary overflow-x-auto leading-relaxed max-h-[500px]">
            <code>{template?.codeContent || "# Generating pipeline specification..."}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
