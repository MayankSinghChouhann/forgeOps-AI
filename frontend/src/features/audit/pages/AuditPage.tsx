import * as React from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { auditApi } from '../api/audit.api'
import type { AuditEvent } from '../types/audit.types'

export function AuditPage() {
  const [events, setEvents] = React.useState<AuditEvent[]>([])
  const [correlationId, setCorrelationId] = React.useState('')
  const [actor, setActor] = React.useState('')
  const [action, setAction] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const search = React.useCallback(async () => {
    try {
      const page = await auditApi.search(correlationId.trim(), actor.trim(), action.trim())
      setEvents(page.content)
      setError(null)
    } catch { setError('Could not load the protected audit trail.') }
  }, [correlationId, actor, action])

  React.useEffect(() => { void auditApi.search().then((page) => setEvents(page.content)).catch(() => setError('Could not load the protected audit trail.')) }, [])

  return <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
    <PageHeader title="Audit trail" description="Append-only security and operational events. Sensitive metadata is redacted before storage." />
    <form className="grid gap-3 rounded-lg border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); void search() }}>
      <Input aria-label="Correlation ID" placeholder="Correlation ID" value={correlationId} onChange={(event) => setCorrelationId(event.target.value)} />
      <Input aria-label="Actor email" placeholder="Actor email" value={actor} onChange={(event) => setActor(event.target.value)} />
      <Input aria-label="Action" placeholder="Exact action" value={action} onChange={(event) => setAction(event.target.value)} />
      <Button type="submit">Search</Button>
    </form>
    {error && <div role="alert" className="rounded-lg border border-status-failed/30 bg-status-failed/10 px-4 py-3 text-sm text-status-failed">{error}</div>}
    <section className="overflow-hidden rounded-lg border border-border bg-surface"><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm">
      <thead className="bg-elevated text-xs text-text-muted"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Resource</th><th className="px-4 py-3">Correlation</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Metadata</th></tr></thead>
      <tbody className="divide-y divide-border">{events.map((event) => <tr key={event.id}>
        <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted">{new Date(event.createdAt).toLocaleString()}</td>
        <td className="px-4 py-3"><p>{event.actorEmail ?? 'anonymous'}</p><p className="text-xs text-text-muted">{event.actorRole ?? '—'}</p></td>
        <td className="px-4 py-3 font-medium">{event.action}</td>
        <td className="px-4 py-3">{event.resourceType}<span className="block font-mono text-xs text-text-muted">{event.resourceId ?? '—'}</span></td>
        <td className="max-w-48 break-all px-4 py-3 font-mono text-xs">{event.correlationId}</td>
        <td className="px-4 py-3"><Badge variant={event.success ? 'success' : 'danger'}>{event.success ? 'Success' : 'Failed'}</Badge></td>
        <td className="max-w-sm break-all px-4 py-3 font-mono text-xs text-text-muted">{event.metadata}</td>
      </tr>)}</tbody>
    </table></div>{!events.length && <p className="px-5 py-12 text-center text-sm text-text-muted">No matching audit events.</p>}</section>
  </div>
}
