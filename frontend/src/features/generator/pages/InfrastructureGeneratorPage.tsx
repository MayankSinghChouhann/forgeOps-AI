import * as React from "react"
import { Sparkles, Copy, Check, Download } from "lucide-react"
import { generatorApi } from "../api/generator.api"
import { TemplateResponse } from "../types/generator.types"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatusIndicator } from "@/components/ui/StatusIndicator"

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
      <PageHeader title="Infrastructure" description="Generate production-ready Terraform, Kubernetes, Helm, and container definitions." actions={<StatusIndicator status="healthy" label="IaC engine online" />} />

      {/* Control Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* IaC Format */}
        <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
          <span className="text-sm font-semibold text-text-secondary">
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
                className={`rounded-md border p-2 text-center text-xs transition-colors ${
                  templateType === t.id
                    ? "border-accent bg-accent/10 font-semibold text-text-primary"
                    : "border-border bg-page text-text-muted hover:text-text-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cloud Provider */}
        <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
          <span className="text-sm font-semibold text-text-secondary">
            Target Cloud
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {["AWS", "GCP", "AZURE", "K8S"].map((p) => (
              <button
                key={p}
                onClick={() => setTargetProvider(p as any)}
                className={`rounded-md border p-2 text-center text-xs transition-colors ${
                  targetProvider === p
                    ? "border-accent bg-accent/10 font-semibold text-text-primary"
                    : "border-border bg-page text-text-muted hover:text-text-primary"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Environment */}
        <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
          <span className="text-sm font-semibold text-text-secondary">
            Environment
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {["production", "staging", "development"].map((e) => (
              <button
                key={e}
                onClick={() => setEnvironment(e)}
                className={`rounded-md border p-2 text-center text-xs capitalize transition-colors ${
                  environment === e
                    ? "border-accent bg-accent/10 font-semibold text-text-primary"
                    : "border-border bg-page text-text-muted hover:text-text-primary"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col justify-between space-y-2 rounded-lg border border-border bg-surface p-4">
          <span className="text-sm font-semibold text-text-secondary">
            Service Name
          </span>
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="h-9 w-full rounded-md bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {loading ? "Synthesizing..." : "Regenerate Template"}
          </button>
        </div>
      </div>

      {/* AI Custom Prompt Customization */}
      <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Sparkles className="h-3.5 w-3.5 text-text-muted" />
          <span>Customization instructions <span className="font-normal text-text-muted">(optional)</span></span>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Include Redis cluster module with TLS encryption and automatic backup..."
            className="min-w-0 flex-1 rounded-md border border-border bg-page px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-md border border-border bg-elevated px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
          >
            Apply Prompt
          </button>
        </div>
      </div>

      {/* Code Editor & Preview Card */}
      <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-text-primary">
              {template?.title || "Generated Infrastructure Code"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-border bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-status-healthy" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy Code"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-md border border-border bg-page px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-status-failed/30 bg-status-failed/10 p-3 text-sm text-status-failed">
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
