import * as React from "react"
import { Server, Play, RotateCcw, Sparkles, History, CheckCircle2 } from "lucide-react"
import { analyzerApi } from "../api/analyzer.api"
import { AnalysisResponse } from "../types/analyzer.types"
import { AnalysisResultCard } from "../components/AnalysisResultCard"
import { Badge } from "@/components/ui/Badge"

const K8S_PRESETS = [
  {
    name: "CrashLoopBackOff",
    desc: "Repeated container crash & exponential backoff restart",
    log: `NAME                               READY   STATUS             RESTARTS      AGE
forgeops-backend-7d9c8b746-9k2px   0/1     CrashLoopBackOff   6 (90s ago)   14m

Events:
  Type     Reason     Age                  From               Message
  ----     ------     ----                 ----               -------
  Normal   Scheduled  14m                  default-scheduler  Successfully assigned default/forgeops-backend to node-us-east-1a
  Normal   Pulled     14m                  kubelet            Container image "forgeops-backend:latest" already present on machine
  Normal   Created    14m                  kubelet            Created container backend
  Normal   Started    14m                  kubelet            Started container backend
  Warning  BackOff    2m (x32 over 13m)    kubelet            Back-off restarting failed container backend in pod forgeops-backend-7d9c8b746-9k2px_default`
  },
  {
    name: "ImagePullBackOff",
    desc: "Private registry authentication or missing tag",
    log: `NAME                                READY   STATUS             RESTARTS   AGE
forgeops-frontend-5b4d96c88-m8k2l   0/1     ImagePullBackOff   0          4m

Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  4m                 default-scheduler  Successfully assigned default/forgeops-frontend to node-us-east-1b
  Normal   Pulling    2m (x4 over 4m)    kubelet            Pulling image "private-registry.forgeops.ai/forgeops/frontend:v2.1.0"
  Warning  Failed     2m (x4 over 4m)    kubelet            Failed to pull image "private-registry.forgeops.ai/forgeops/frontend:v2.1.0": rpc error: code = Unknown desc = Error response from daemon: unauthorized: authentication required
  Warning  Failed     2m (x4 over 4m)    kubelet            Error: ErrImagePull
  Normal   BackOff    105s (x6 over 4m)  kubelet            Back-off pulling image "private-registry.forgeops.ai/forgeops/frontend:v2.1.0"
  Warning  Failed     105s (x6 over 4m)  kubelet            Error: ImagePullBackOff`
  },
  {
    name: "Pod Scheduling Failure (0/3 Nodes)",
    desc: "Insufficient memory / resource exhaustion",
    log: `NAME                          READY   STATUS    RESTARTS   AGE
analytics-worker-674b-xv9pq   0/1     Pending   0          8m

Events:
  Type     Reason            Age   From               Message
  ----     ------            ----  ----               -------
  Warning  FailedScheduling  8m    default-scheduler  0/3 nodes are available: 3 Insufficient memory. preemption: 0/3 nodes are available: 3 No preemption victims found for incoming pod.`
  }
]

export function KubernetesTroubleshooterPage() {
  const [rawLog, setRawLog] = React.useState(K8S_PRESETS[0].log)
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
      setHistory(data.filter(d => d.targetType === "KUBERNETES"))
    } catch (e) {
      console.error("Failed to load K8s history", e)
    }
  }

  const handleAnalyze = async () => {
    if (!rawLog.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await analyzerApi.analyzeLog({
        rawLog,
        targetType: "KUBERNETES",
        title: "Kubernetes Cluster / Pod Incident"
      })
      setResult(res)
      loadHistory()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to analyze Kubernetes event log.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="bg-elevated border border-border/70 rounded-card p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between relative overflow-hidden shadow-lg">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-lg bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center shrink-0">
            <Server className="h-5 w-5 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight font-mono">
              Kubernetes Cluster Troubleshooter
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Inspect `kubectl describe`, pod event streams, CrashLoopBackOff, and scheduling anomalies.
            </p>
          </div>
        </div>
        <Badge variant="success" className="bg-status-healthy/10 text-status-healthy border-status-healthy/20">
          <span className="h-1.5 w-1.5 rounded-full bg-status-healthy mr-1.5 animate-pulse" />
          Kubelet Diagnostic Engine Online
        </Badge>
      </div>

      {/* Preset Pickers */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-semibold">
          Common Kubernetes Anomalies (1-Click Load)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {K8S_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => setRawLog(p.log)}
              className="text-left p-3.5 rounded-card bg-elevated/70 border border-border/60 hover:border-brand-blue/50 hover:bg-elevated transition-all group shadow-sm"
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
            <span className="h-2 w-2 rounded-full bg-brand-blue mr-2" />
            kubectl describe / Pod Event Stream
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
          placeholder="Paste output of `kubectl describe pod ...` or `kubectl get events`..."
          rows={9}
          className="w-full rounded-md bg-[#07090E] border border-border/80 p-4 font-mono text-xs text-text-primary focus:outline-none focus:border-brand-blue transition-colors shadow-inner resize-y"
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
                <span>Troubleshooting Kubernetes Pod Events...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Troubleshoot Pod Events</span>
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
              Recent Kubernetes Diagnoses
            </h3>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                onClick={() => setResult(item)}
                className="p-3 rounded-md bg-page/60 border border-border/40 hover:border-brand-blue/40 hover:bg-page transition-all cursor-pointer flex items-center justify-between group"
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
