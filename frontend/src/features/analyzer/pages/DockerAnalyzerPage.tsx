import * as React from "react"
import { Box, Play, RotateCcw, Sparkles, History, CheckCircle2 } from "lucide-react"
import { analyzerApi } from "../api/analyzer.api"
import { AnalysisResponse } from "../types/analyzer.types"
import { AnalysisResultCard } from "../components/AnalysisResultCard"
import { Badge } from "@/components/ui/Badge"

const DOCKER_PRESETS = [
  {
    name: "Exit Code 137 (OOMKilled)",
    desc: "Linux cgroup memory limit exceeded",
    log: `forgeops-backend-1 exited with code 137
[2026-08-06 18:22:04] [kernel] Out of memory: Killed process 4129 (java) total-vm:2048564kB, anon-rss:1048576kB, file-rss:0kB, shmem-rss:0kB
[2026-08-06 18:22:04] [containerd] task /docker/4129: exit status 137: SIGKILL received from kernel OOM killer
Container forgeops-backend died unexpectedly.`
  },
  {
    name: "Port 5432 Host Conflict",
    desc: "bind: address already in use",
    log: `Error response from daemon: driver failed programming external connectivity on endpoint forgeops-postgres (3a2b1c4d):
Error starting userland proxy: listen tcp 0.0.0.0:5432: bind: address already in use
[ERROR] docker-compose up failed for service 'postgres'.`
  },
  {
    name: "Docker Socket Permission Denied",
    desc: "Non-root user missing docker group",
    log: `permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock:
Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json": dial unix /var/run/docker.sock: connect: permission denied
fatal: unable to inspect running containers.`
  }
]

export function DockerAnalyzerPage() {
  const [rawLog, setRawLog] = React.useState(DOCKER_PRESETS[0].log)
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<AnalysisResponse | null>(null)
  const [history, setHistory] = React.useState<AnalysisResponse[]>([])
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await analyzerApi.getHistory()
      setHistory(data.filter(d => d.targetType === "DOCKER"))
    } catch (e) {
      console.error("Failed to load docker history", e)
    }
  }

  const handleAnalyze = async () => {
    if (!rawLog.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await analyzerApi.analyzeLog({
        rawLog,
        targetType: "DOCKER",
        title: "Docker Container Runtime Fault"
      })
      setResult(res)
      loadHistory()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to analyze Docker log.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="bg-elevated border border-border/70 rounded-card p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between relative overflow-hidden shadow-lg">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center shrink-0">
            <Box className="h-5 w-5 text-brand-cyan" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight font-mono">
              Docker Container & Daemon Error Analyzer
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Deep diagnosis of OOMKilled 137, port collisions, socket permissions, and container lifecycle panics.
            </p>
          </div>
        </div>
        <Badge variant="success" className="bg-status-healthy/10 text-status-healthy border-status-healthy/20">
          <span className="h-1.5 w-1.5 rounded-full bg-status-healthy mr-1.5 animate-pulse" />
          Docker Diagnostic Engine Online
        </Badge>
      </div>

      {/* Preset Pickers */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-semibold">
          Common Container Incidents (1-Click Load)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DOCKER_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => setRawLog(p.log)}
              className="text-left p-3.5 rounded-card bg-elevated/70 border border-border/60 hover:border-brand-cyan/50 hover:bg-elevated transition-all group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary group-hover:text-brand-cyan transition-colors font-mono">
                  {p.name}
                </span>
                <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary">Load →</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Log Input Editor */}
      <div className="bg-elevated border border-border/80 rounded-card p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-text-primary flex items-center">
            <span className="h-2 w-2 rounded-full bg-brand-cyan mr-2" />
            Docker Daemon / Container STDERR Log
          </span>
          <button
            onClick={() => setRawLog("")}
            className="text-xs font-mono text-text-muted hover:text-text-primary flex items-center space-x-1 transition-colors"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear
          </button>
        </div>

        <textarea
          value={rawLog}
          onChange={(e) => setRawLog(e.target.value)}
          placeholder="Paste Docker compose logs, daemon errors, or exit stack traces..."
          rows={8}
          className="w-full rounded-md bg-[#07090E] border border-border/80 p-4 font-mono text-xs text-text-primary focus:outline-none focus:border-brand-cyan transition-colors shadow-inner resize-y"
        />

        {error && (
          <div className="p-3 rounded bg-status-failed/10 border border-status-failed/30 text-xs text-status-failed font-mono">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={loading || !rawLog.trim()}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-md bg-brand-blue hover:bg-brand-blue/90 text-white font-mono text-xs font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin text-brand-cyan" />
                <span>Diagnosing Container Fault...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Run Container Diagnosis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && <AnalysisResultCard result={result} />}

      {/* History Log */}
      {history.length > 0 && (
        <div className="bg-elevated border border-border/70 rounded-card p-6 shadow-md space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-border/50">
            <History className="h-4 w-4 text-text-muted" />
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-primary">
              Recent Docker Incidents
            </h3>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                onClick={() => setResult(item)}
                className="p-3 rounded-md bg-page/60 border border-border/40 hover:border-brand-cyan/40 hover:bg-page transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-4 w-4 text-status-healthy" />
                  <div>
                    <span className="text-xs font-mono font-medium text-text-primary group-hover:text-brand-cyan transition-colors">
                      {item.title}
                    </span>
                    <p className="text-[10px] font-mono text-text-muted">
                      Stage: {item.failureStage} • Severity: {item.severity}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-text-muted">
                  {new Date(item.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
