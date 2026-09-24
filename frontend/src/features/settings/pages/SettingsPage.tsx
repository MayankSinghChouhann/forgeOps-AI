import { useAuth } from "@/features/auth/hooks/useAuth"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatusIndicator } from "@/components/ui/StatusIndicator"

const sections = ["General", "Environment", "Integrations", "Security", "Appearance"]

export function SettingsPage() {
  const { user } = useAuth()
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <PageHeader title="Settings" description="Review workspace, environment, integration, and account configuration." />
      <div className="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="space-y-1" aria-label="Settings sections">
          {sections.map((section, index) => <a key={section} href={`#${section.toLowerCase()}`} className={`block rounded-md px-3 py-2 text-sm transition-colors ${index === 0 ? "bg-surface-hover font-medium text-text-primary" : "text-text-muted hover:bg-surface hover:text-text-primary"}`}>{section}</a>)}
        </nav>
        <div className="space-y-6">
          <section id="general" className="rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-5 py-4"><h2 className="text-base font-semibold">General</h2><p className="mt-1 text-sm text-text-muted">Workspace identity and account details.</p></div>
            <dl className="divide-y divide-border text-sm"><div className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr]"><dt className="text-text-muted">Workspace</dt><dd className="font-medium text-text-primary">forgeops-ai-core</dd></div><div className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr]"><dt className="text-text-muted">Signed-in account</dt><dd className="text-text-secondary">{user?.email || "Unavailable"}</dd></div></dl>
          </section>
          <section id="environment" className="rounded-lg border border-border bg-surface"><div className="border-b border-border px-5 py-4"><h2 className="text-base font-semibold">Environment</h2><p className="mt-1 text-sm text-text-muted">Runtime context used by the current workspace.</p></div><div className="flex items-center justify-between px-5 py-4"><div><p className="text-sm font-medium text-text-primary">Production</p><p className="mt-1 text-xs text-text-muted">Environment values are managed through deployment configuration.</p></div><StatusIndicator status="healthy" label="Active" /></div></section>
          <section id="integrations" className="rounded-lg border border-border bg-surface"><div className="border-b border-border px-5 py-4"><h2 className="text-base font-semibold">Integrations</h2><p className="mt-1 text-sm text-text-muted">AI provider and infrastructure connections.</p></div><p className="px-5 py-4 text-sm text-text-secondary">Integration credentials are managed securely through server-side environment variables and are never displayed in the browser.</p></section>
          <section id="security" className="rounded-lg border border-border bg-surface"><div className="border-b border-border px-5 py-4"><h2 className="text-base font-semibold">Security</h2></div><p className="px-5 py-4 text-sm text-text-secondary">Authentication and token lifecycle are managed by the ForgeOps API. Sign out from the account menu when using a shared device.</p></section>
          <section id="appearance" className="rounded-lg border border-border bg-surface"><div className="border-b border-border px-5 py-4"><h2 className="text-base font-semibold">Appearance</h2></div><div className="px-5 py-4"><p className="text-sm font-medium text-text-primary">Dark interface</p><p className="mt-1 text-xs text-text-muted">Optimized for long-running operational workflows and technical data.</p></div></section>
        </div>
      </div>
    </div>
  )
}
