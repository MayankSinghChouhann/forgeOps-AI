import * as React from "react"
import { FileText, Play, RotateCcw, Sparkles, History, CheckCircle2 } from "lucide-react"
import { analyzerApi } from "../api/analyzer.api"
import { AnalysisResponse } from "../types/analyzer.types"
import { AnalysisResultCard } from "../components/AnalysisResultCard"
import { Badge } from "@/components/ui/Badge"

const PRESETS = [
  {
    name: "Maven Compilation Failure",
    desc: "Java symbol error & compiler plugin failure",
    log: `[INFO] --- maven-compiler-plugin:3.11.0:compile (default-compile) @ forgeops-backend ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 24 source files to /app/target/classes
[ERROR] /app/src/main/java/com/forgeops/backend/auth/service/AuthService.java:[42,18] cannot find symbol
  symbol:   method generateRefreshToken(com.forgeops.backend.auth.entity.User)
  location: class com.forgeops.backend.auth.security.JwtUtils
[ERROR] /app/src/main/java/com/forgeops/backend/assistant/service/AssistantService.java:[89,31] incompatible types: java.lang.String cannot be converted to java.util.UUID
[INFO] 2 errors
[INFO] -------------------------------------------------------------
[ERROR] COMPILATION ERROR : 
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.11.0:compile on project forgeops-backend: Compilation failure`
  },
  {
    name: "NPM ERESOLVE Peer Conflict",
    desc: "Incompatible dependency resolution tree",
    log: `npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
npm ERR! 
npm ERR! While resolving: @tailwindcss/vite@4.0.0
npm ERR! Found: vite@5.4.14
npm ERR! node_modules/vite
npm ERR!   peer vite@"^5.0.0" from @vitejs/plugin-react@4.3.4
npm ERR! 
npm ERR! Could not resolve dependency:
npm ERR! peer vite@"^6.0.0" from @tailwindcss/vite@4.0.0
npm ERR! Conflicting peer dependency: vite 6.2.0
npm ERR! 
npm ERR! Fix the upstream dependency conflict, or retry
npm ERR! this command with --force or --legacy-peer-deps
npm ERR! A complete log of this run can be found in: /root/.npm/_logs/2026-08-06T18_20_11_123Z-eresolve.log`
  },
  {
    name: "Git SSH Authentication Error",
    desc: "CI/CD runner missing deploy key / credentials",
    log: `Cloning into 'forgeops-production-manifests'...
Warning: Permanently added 'github.com' (ED25519) to the list of known hosts.
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
ERROR: Job failed: exit code 128`
  }
]

export function JenkinsAnalyzerPage() {
  const [rawLog, setRawLog] = React.useState(PRESETS[0].log)
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
      setHistory(data.filter(d => d.targetType === "JENKINS"))
    } catch (e) {
      console.error("Failed to load history", e)
    }
  }

  const handleAnalyze = async () => {
    if (!rawLog.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await analyzerApi.analyzeLog({
        rawLog,
        targetType: "JENKINS",
        title: "CI/CD Pipeline Log Analysis"
      })
      setResult(res)
      loadHistory()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to analyze log. Please check backend connectivity.")
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
            <FileText className="h-5 w-5 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight font-mono">
              CI/CD & Jenkins Log Analyzer
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Automated stack trace parsing, failure stage classification, and copyable bash remediations.
            </p>
          </div>
        </div>
        <Badge variant="success" className="bg-status-healthy/10 text-status-healthy border-status-healthy/20">
          <span className="h-1.5 w-1.5 rounded-full bg-status-healthy mr-1.5 animate-pulse" />
          RCA Engine Online
        </Badge>
      </div>

      {/* Preset Pickers */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-semibold">
          Sample Incident Logs (1-Click Load)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((p, i) => (
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
            <span className="h-2 w-2 rounded-full bg-brand-cyan mr-2" />
            Raw CI/CD Console Log Output
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
          placeholder="Paste Jenkins, GitHub Actions, or GitLab CI console logs here..."
          rows={10}
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
                <span>Performing Root Cause Analysis...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Execute Diagnostic Analysis</span>
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
              Recent Log Analysis History
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
