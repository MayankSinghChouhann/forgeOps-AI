import * as React from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { operationsApi } from '../api/operations.api'
import type { EvaluationMetrics, Operation, OperationStatus } from '../types/operation.types'

const statusVariant = (status: OperationStatus) => {
  if (status === 'SUCCEEDED' || status === 'APPROVED') return 'success' as const
  if (status === 'FAILED' || status === 'REJECTED' || status === 'EXPIRED') return 'danger' as const
  return 'warning' as const
}

const formatDuration = (ms: number | null) => ms == null ? 'No data' : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`

export function OperationsPage() {
  const { hasPermission } = useAuth()
  const [operations, setOperations] = React.useState<Operation[]>([])
  const [metrics, setMetrics] = React.useState<EvaluationMetrics | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    try {
      const [page, evaluation] = await Promise.all([
        operationsApi.list(),
        hasPermission('EVALUATION_READ') ? operationsApi.metrics() : Promise.resolve(null),
      ])
      setOperations(page.content)
      setMetrics(evaluation)
      setError(null)
    } catch {
      setError('Could not load operation records.')
    }
  }, [hasPermission])

  React.useEffect(() => { void refresh() }, [refresh])

  const decide = async (operation: Operation, approved: boolean) => {
    const reason = window.prompt(approved ? 'Approval note (optional)' : 'Rejection reason')
    if (!approved && !reason) return
    setBusy(operation.id)
    try { await operationsApi.decide(operation.id, approved, reason ?? undefined); await refresh() }
    catch { setError('The decision was rejected. It may be stale, already decided, or self-approved.') }
    finally { setBusy(null) }
  }

  const start = async (operation: Operation) => {
    const key = `forgeops-${crypto.randomUUID()}`
    setBusy(operation.id)
    try {
      const handoff = await operationsApi.start(operation.id, key)
      sessionStorage.setItem(`forgeops-execution-${operation.id}`, key)
      window.alert(handoff.instruction)
      await refresh()
    } catch { setError('Execution handoff could not start. Verify approval, ownership, and expiry.') }
    finally { setBusy(null) }
  }

  const complete = async (operation: Operation, succeeded: boolean) => {
    const key = sessionStorage.getItem(`forgeops-execution-${operation.id}`)
    if (!key) { setError('This browser does not hold the execution idempotency key.'); return }
    const summary = window.prompt(succeeded ? 'Verified success summary' : 'Verified failure summary')
    if (!summary) return
    setBusy(operation.id)
    try { await operationsApi.complete(operation.id, key, succeeded, summary); await refresh() }
    catch { setError('The result was rejected. Check the idempotency key and current state.') }
    finally { setBusy(null) }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <PageHeader title="Operations & approvals" description="Real recommendation, approval, external execution, and outcome records." actions={<Button variant="secondary" size="sm" onClick={() => void refresh()}>Refresh</Button>} />
      {error && <div role="alert" className="rounded-lg border border-status-failed/30 bg-status-failed/10 px-4 py-3 text-sm text-status-failed">{error}</div>}

      {metrics && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-text-muted">Recommendations</p><p className="mt-2 text-2xl font-semibold">{metrics.totalRecommendations}</p></div>
        <div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-text-muted">Acceptance rate</p><p className="mt-2 text-2xl font-semibold">{metrics.recommendationAcceptanceRate == null ? 'No data' : `${(metrics.recommendationAcceptanceRate * 100).toFixed(1)}%`}</p></div>
        <div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-text-muted">Approval turnaround</p><p className="mt-2 text-2xl font-semibold">{formatDuration(metrics.averageApprovalTurnaroundMs)}</p></div>
        <div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-text-muted">Execution success</p><p className="mt-2 text-2xl font-semibold">{metrics.executionSuccessRate == null ? 'No data' : `${(metrics.executionSuccessRate * 100).toFixed(1)}%`}</p></div>
      </div>}

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-elevated text-xs text-text-muted"><tr><th className="px-4 py-3">Created</th><th className="px-4 py-3">Requester</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Recommendation</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-border">
              {operations.map((operation) => <tr key={operation.id}>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted">{new Date(operation.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{operation.requester}</td>
                <td className="px-4 py-3"><Badge variant={operation.riskLevel === 'HIGH' ? 'danger' : operation.riskLevel === 'MEDIUM' ? 'warning' : 'outline'}>{operation.riskLevel}</Badge></td>
                <td className="px-4 py-3"><Badge variant={statusVariant(operation.status)}>{operation.status.replace(/_/g, ' ')}</Badge></td>
                <td className="max-w-md px-4 py-3"><pre className="max-h-24 overflow-auto whitespace-pre-wrap text-xs text-text-secondary">{operation.recommendation}</pre><p className="mt-1 font-mono text-[10px] text-text-muted">{operation.correlationId}</p></td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-2">
                  {operation.status === 'PENDING_APPROVAL' && hasPermission('APPROVAL_DECIDE') && <><Button size="sm" onClick={() => void decide(operation, true)} disabled={busy === operation.id}>Approve</Button><Button size="sm" variant="danger" onClick={() => void decide(operation, false)} disabled={busy === operation.id}>Reject</Button></>}
                  {operation.status === 'APPROVED' && hasPermission('OPERATION_EXECUTE') && <Button size="sm" onClick={() => void start(operation)} disabled={busy === operation.id}>Start external execution</Button>}
                  {operation.status === 'EXECUTING' && hasPermission('OPERATION_EXECUTE') && <><Button size="sm" onClick={() => void complete(operation, true)} disabled={busy === operation.id}>Record success</Button><Button size="sm" variant="danger" onClick={() => void complete(operation, false)} disabled={busy === operation.id}>Record failure</Button></>}
                </div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {!operations.length && <p className="px-5 py-12 text-center text-sm text-text-muted">No operation recommendations are visible to this role.</p>}
      </section>
    </div>
  )
}
