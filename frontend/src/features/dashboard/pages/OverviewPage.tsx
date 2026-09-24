import * as React from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { MetricCard } from "@/components/ui/MetricCard"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatusIndicator, StatusTone } from "@/components/ui/StatusIndicator"
import { dashboardApi } from "../api/dashboard.api"
import { DashboardMetricsResponse } from "../types/dashboard.types"

export function OverviewPage() {
  const [metrics, setMetrics] = React.useState<DashboardMetricsResponse | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  const fetchMetrics = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setMetrics(await dashboardApi.getMetrics())
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Failed to fetch live dashboard telemetry", err)
      setError("Live telemetry is temporarily unavailable.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 10000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  const serviceTone = (status: string): StatusTone => {
    if (["ONLINE", "CONNECTED"].includes(status)) return "healthy"
    if (status === "FALLBACK") return "warning"
    if (status === "DEGRADED") return "warning"
    return "failed"
  }

  const totalDiagnostics = metrics
    ? metrics.counters.totalAnalyses + metrics.counters.totalTemplates + metrics.counters.totalChatSessions
    : null

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <PageHeader
        title="Overview"
        description="Live infrastructure and application telemetry."
        actions={
          <>
            <span className="hidden text-xs text-text-muted sm:inline">
              {lastUpdated ? `Last refreshed ${lastUpdated.toLocaleTimeString()}` : "Waiting for telemetry"}
            </span>
            <Button variant="secondary" size="sm" onClick={fetchMetrics} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </>
        }
      />

      {error && (
        <div role="alert" className="rounded-lg border border-status-warning/30 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">
          {error} Existing data remains visible while ForgeOps retries.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Memory"
          value={metrics ? `${metrics.memory.usedMB} MB` : "—"}
          detail={metrics ? `/ ${metrics.memory.maxMB} MB` : undefined}
          progress={metrics?.memory.percentUsed}
          footer={metrics ? `${metrics.memory.percentUsed}% utilized` : "Loading live usage"}
        />
        <MetricCard
          label="CPU"
          value={metrics ? `${metrics.cpu.availableCores} cores` : "—"}
          detail={metrics ? `${metrics.cpu.estimatedLoadPercent}% load` : undefined}
          progress={metrics?.cpu.estimatedLoadPercent}
          footer={<StatusIndicator status="healthy" label="Normal" />}
        />
        <MetricCard
          label="Database connections"
          value={metrics ? `${metrics.database.activeConnections} active` : "—"}
          detail={metrics ? `${metrics.database.idleConnections} idle` : undefined}
          footer={metrics ? `${metrics.database.totalPoolSize} total · ${metrics.database.poolName}` : "Loading pool status"}
        />
        <MetricCard
          label="Diagnostics"
          value={totalDiagnostics ?? "—"}
          detail={metrics ? `${metrics.counters.totalUsers} user${metrics.counters.totalUsers === 1 ? "" : "s"}` : undefined}
          footer={metrics ? `${metrics.counters.totalAnalyses} RCA · ${metrics.counters.totalTemplates} IaC · ${metrics.counters.totalChatSessions} sessions` : "Loading counters"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <section className="overflow-hidden rounded-lg border border-border bg-surface" aria-labelledby="activity-title">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div><h2 id="activity-title" className="text-base font-semibold">Recent activity</h2><p className="mt-0.5 text-xs text-text-muted">Diagnostics and infrastructure actions from the live database.</p></div>
            <span className="text-xs text-text-muted">{metrics?.recentActivities.length ?? 0} events</span>
          </div>
          {metrics?.recentActivities?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-elevated/70 text-xs text-text-muted"><tr><th className="px-5 py-3 font-medium">Time</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Summary</th><th className="px-5 py-3 font-medium">Status</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {metrics.recentActivities.map((activity, index) => (
                    <tr key={`${activity.timestamp}-${index}`} className="hover:bg-surface-hover/50">
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-text-muted">{activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : "Now"}</td>
                      <td className="px-4 py-3 text-text-secondary">{activity.type}</td>
                      <td className="px-4 py-3"><p className="font-medium text-text-primary">{activity.title}</p><p className="mt-0.5 text-xs text-text-muted">{activity.description}</p></td>
                      <td className="px-5 py-3"><StatusIndicator status={activity.status === "SUCCESS" ? "healthy" : activity.status === "WARNING" ? "warning" : "failed"} label={activity.status.toLowerCase()} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center"><p className="font-medium text-text-secondary">No recent activity</p><p className="mt-1 text-sm text-text-muted">Diagnostics and infrastructure actions will appear here.</p></div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface" aria-labelledby="health-title">
          <div className="border-b border-border px-5 py-4"><h2 id="health-title" className="text-base font-semibold">Service health</h2><p className="mt-0.5 text-xs text-text-muted">Connected platform dependencies.</p></div>
          <div className="divide-y divide-border">
            {metrics?.services?.length ? metrics.services.map((service) => (
              <div key={`${service.name}-${service.type}`} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-text-primary">{service.name}</p><p className="mt-0.5 text-xs text-text-muted">{service.type} · {service.detail}</p></div>
                <StatusIndicator status={serviceTone(service.status)} label={service.status === "FALLBACK" ? "Fallback" : service.status.charAt(0) + service.status.slice(1).toLowerCase()} />
              </div>
            )) : <div className="px-5 py-10 text-center text-sm text-text-muted">Waiting for service telemetry…</div>}
          </div>
        </section>
      </div>
    </div>
  )
}
