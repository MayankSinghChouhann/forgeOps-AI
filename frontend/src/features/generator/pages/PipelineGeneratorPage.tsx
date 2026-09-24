import * as React from "react"
import { Sparkles, Copy, Check, Download, Layers, ShieldCheck, Cpu, GitMerge } from "lucide-react"
import { generatorApi } from "../api/generator.api"
import { TemplateResponse } from "../types/generator.types"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatusIndicator } from "@/components/ui/StatusIndicator"

export function PipelineGeneratorPage() {
  const [pipelineType, setPipelineType] = React.useState<"GITLAB_CI" | "GITHUB_ACTIONS">("GITLAB_CI")
  const [serviceName, setServiceName] = React.useState("forgeops-core-service")
  const [runtime, setRuntime] = React.useState("java")
  const [loading, setLoading] = React.useState(false)
  const [template, setTemplate] = React.useState<TemplateResponse | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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
      <PageHeader title="CI/CD" description="Generate reviewable GitLab CI and GitHub Actions workflows with testing, security, and deployment stages." actions={<StatusIndicator status="healthy" label="Pipeline engine online" />} />

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Pipeline Target */}
        <div className="space-y-3 rounded-lg border border-border bg-surface p-5">
          <span className="text-sm font-semibold text-text-secondary">
            Target platform
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPipelineType("GITLAB_CI")}
              className={`rounded-md border p-3 text-xs font-medium transition-colors ${
                pipelineType === "GITLAB_CI"
                  ? "border-accent bg-accent/10 text-text-primary"
                  : "border-border bg-page text-text-muted hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              GitLab CI/CD
              <span className="block text-[10px] text-text-muted mt-0.5">.gitlab-ci.yml</span>
            </button>
            <button
              onClick={() => setPipelineType("GITHUB_ACTIONS")}
              className={`rounded-md border p-3 text-xs font-medium transition-colors ${
                pipelineType === "GITHUB_ACTIONS"
                  ? "border-accent bg-accent/10 text-text-primary"
                  : "border-border bg-page text-text-muted hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              GitHub Actions
              <span className="block text-[10px] text-text-muted mt-0.5">deploy.yml</span>
            </button>
          </div>
        </div>

        {/* Runtime Stack */}
        <div className="space-y-3 rounded-lg border border-border bg-surface p-5">
          <span className="text-sm font-semibold text-text-secondary">
            Application runtime
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
                className={`rounded-md border p-2.5 text-left text-xs transition-colors ${
                  runtime === r.id
                    ? "border-accent bg-accent/10 text-text-primary"
                    : "border-border bg-page text-text-muted hover:text-text-primary"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Gates */}
        <div className="space-y-3 rounded-lg border border-border bg-surface p-5">
          <span className="text-sm font-semibold text-text-secondary">
            Included stages
          </span>
          <div className="space-y-2 text-xs text-text-secondary">
            <div className="flex items-center space-x-2 text-status-healthy">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Unit & Integration Testing</span>
            </div>
            <div className="flex items-center space-x-2 text-accent">
              <Layers className="h-3.5 w-3.5" />
              <span>Docker Multi-Stage Build & Push</span>
            </div>
            <div className="flex items-center space-x-2 text-status-warning">
              <Cpu className="h-3.5 w-3.5" />
              <span>Trivy Container Security Vulnerability Scan</span>
            </div>
            <div className="flex items-center space-x-2 text-text-primary">
              <GitMerge className="h-3.5 w-3.5 text-accent" />
              <span>Kubernetes Zero-Downtime Rollout</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-surface p-5">
          <span className="text-sm font-semibold text-text-secondary">
            Service
          </span>
          <input
            value={serviceName}
            onChange={(event) => setServiceName(event.target.value)}
            aria-label="Service name"
            className="w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !serviceName.trim()}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {loading ? "Generating..." : "Generate Pipeline"}
          </button>
        </div>
      </div>

      {/* Code Editor & Preview Card */}
      <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-text-primary">
              {pipelineType === "GITLAB_CI" ? ".gitlab-ci.yml" : ".github/workflows/deploy.yml"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-border bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-status-healthy" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy YAML"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-md border border-border bg-page px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-status-failed/30 bg-status-failed/10 p-3 text-sm text-status-failed">
            {error}
          </div>
        )}

        <div className="relative rounded-md overflow-hidden border border-border bg-[#06080D]">
          <pre className="p-5 text-xs font-mono text-text-primary overflow-x-auto leading-relaxed max-h-[500px]">
            <code>{template?.codeContent || "# Configure the options above, then generate a pipeline."}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
