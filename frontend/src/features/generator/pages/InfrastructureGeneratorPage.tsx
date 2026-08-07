import * as React from "react"
import { Cloud, Sparkles, Copy, Check, Download, Layers, ShieldCheck, Box, Server } from "lucide-react"
import { generatorApi } from "../api/generator.api"
import { TemplateResponse } from "../types/generator.types"
import { Badge } from "@/components/ui/Badge"

export function InfrastructureGeneratorPage() {
  const [templateType, setTemplateType] = React.useState<"TERRAFORM" | "KUBERNETES" | "DOCKERFILE" | "HELM">("TERRAFORM")
  const [targetProvider, setTargetProvider] = React.useState<"AWS" | "GCP" | "AZURE" | "K8S">("AWS")
  const [serviceName, setServiceName] = React.useState("forgeops-production")
  const [environment, setEnvironment] = React.useState("production")
  const [customPrompt, setCustomPrompt] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [template, setTemplate] = React.useState<TemplateResponse | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    handleGenerate()
  }, [templateType, targetProvider, environment])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await generatorApi.generateTemplate({
        templateType,
        targetProvider,
        serviceName,
        environment,
        customPrompt: customPrompt.trim() ? customPrompt : undefined
      })
      setTemplate(res)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to generate infrastructure template.")
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
    let filename = "main.tf"
    if (templateType === "KUBERNETES") filename = "k8s-deployment.yaml"
    else if (templateType === "DOCKERFILE") filename = "Dockerfile"
    else if (templateType === "HELM") filename = "values.yaml"

    const blob = new Blob([template.codeContent], { type: "text/plain" })
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
          <div className="h-10 w-10 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center shrink-0">
            <Cloud className="h-5 w-5 text-brand-cyan" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight font-mono">
              Infrastructure as Code (IaC) & Container Generator
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Production-hardened Terraform modules, Kubernetes manifests, Helm charts, and multi-stage Dockerfiles.
            </p>
          </div>
        </div>
        <Badge variant="success" className="bg-status-healthy/10 text-status-healthy border-status-healthy/20">
          <span className="h-1.5 w-1.5 rounded-full bg-status-healthy mr-1.5 animate-pulse" />
          IaC Synthesizer Online
        </Badge>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* IaC Format */}
        <div className="bg-elevated border border-border/80 rounded-card p-4 shadow-sm space-y-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            Format
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "TERRAFORM", label: "Terraform (AWS)" },
              { id: "KUBERNETES", label: "K8s Manifest" },
              { id: "HELM", label: "Helm Values" },
              { id: "DOCKERFILE", label: "Dockerfile" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateType(t.id as any)}
                className={`p-2 rounded text-xs font-mono transition-all text-center ${
                  templateType === t.id
                    ? "bg-brand-blue/20 border border-brand-blue text-brand-cyan font-semibold"
                    : "bg-page/50 border border-border/60 text-text-muted hover:text-text-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cloud Provider */}
        <div className="bg-elevated border border-border/80 rounded-card p-4 shadow-sm space-y-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            Target Cloud
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {["AWS", "GCP", "AZURE", "K8S"].map((p) => (
              <button
                key={p}
                onClick={() => setTargetProvider(p as any)}
                className={`p-2 rounded text-xs font-mono transition-all text-center ${
                  targetProvider === p
                    ? "bg-brand-cyan/15 border border-brand-cyan text-brand-cyan font-semibold"
                    : "bg-page/50 border border-border/60 text-text-muted hover:text-text-primary"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Environment */}
        <div className="bg-elevated border border-border/80 rounded-card p-4 shadow-sm space-y-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            Environment
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {["production", "staging", "development"].map((e) => (
              <button
                key={e}
                onClick={() => setEnvironment(e)}
                className={`p-2 rounded text-xs font-mono capitalize transition-all text-center ${
                  environment === e
                    ? "bg-status-healthy/15 border border-status-healthy/40 text-status-healthy font-semibold"
                    : "bg-page/50 border border-border/60 text-text-muted hover:text-text-primary"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-elevated border border-border/80 rounded-card p-4 shadow-sm space-y-2 flex flex-col justify-between">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            Service Name
          </span>
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="w-full rounded bg-page border border-border/80 px-3 py-1.5 font-mono text-xs text-text-primary focus:outline-none focus:border-brand-cyan"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-1.5 rounded bg-brand-blue hover:bg-brand-blue/90 text-white font-mono text-xs font-medium transition-all shadow"
          >
            {loading ? "Synthesizing..." : "Regenerate Template"}
          </button>
        </div>
      </div>

      {/* AI Custom Prompt Customization */}
      <div className="bg-elevated border border-border/80 rounded-card p-4 shadow-sm space-y-2">
        <label className="text-xs font-mono font-medium text-text-primary flex items-center space-x-2">
          <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
          <span>DevOps AI Customization Instructions (Optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Include Redis cluster module with TLS encryption and automatic backup..."
            className="flex-1 rounded bg-page border border-border/80 px-3 py-2 font-mono text-xs text-text-primary focus:outline-none focus:border-brand-blue"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 rounded bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan hover:bg-brand-cyan/30 text-xs font-mono font-medium transition-colors"
          >
            Apply Prompt
          </button>
        </div>
      </div>

      {/* Code Editor & Preview Card */}
      <div className="bg-elevated border border-border/80 rounded-card p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div className="flex items-center space-x-2">
            <div className="h-2.5 w-2.5 rounded-full bg-status-healthy animate-pulse" />
            <span className="text-xs font-mono font-semibold text-text-primary">
              {template?.title || "Generated Infrastructure Code"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-brand-blue/20 text-brand-cyan border border-brand-blue/30 hover:bg-brand-blue/30 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-status-healthy" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy Code"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-page border border-border/80 text-text-primary hover:bg-elevated transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-status-failed/10 border border-status-failed/30 text-xs text-status-failed font-mono">
            {error}
          </div>
        )}

        <div className="relative rounded-md overflow-hidden border border-border bg-[#06080D]">
          <pre className="p-5 text-xs font-mono text-text-primary overflow-x-auto leading-relaxed max-h-[520px]">
            <code>{template?.codeContent || "# Synthesizing infrastructure architecture..."}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
