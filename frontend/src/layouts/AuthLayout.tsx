import { Outlet } from "react-router-dom"
import { Activity, Blocks, ShieldCheck } from "lucide-react"

const capabilities = [
  { icon: Activity, title: "Diagnose incidents", detail: "Analyze deployment, container, and cluster failures." },
  { icon: Blocks, title: "Generate infrastructure", detail: "Create reviewable CI/CD and infrastructure templates." },
  { icon: ShieldCheck, title: "Operate safely", detail: "Understand command risk before making a change." },
]

export function AuthLayout() {
  return (
    <div className="grid min-h-dvh bg-page lg:grid-cols-[minmax(360px,0.85fr)_1.15fr]">
      <aside className="hidden border-r border-border bg-surface p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div>
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-sm font-bold text-white" aria-hidden="true">F</div><span className="text-lg font-semibold">ForgeOps</span></div>
          <div className="mt-20 max-w-md"><p className="text-sm font-medium text-accent">Infrastructure operations</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary xl:text-4xl">A calmer way to investigate and automate DevOps work.</h1><p className="mt-4 text-base leading-7 text-text-muted">One workspace for diagnostics, operational guidance, and production-ready infrastructure templates.</p></div>
        </div>
        <div className="max-w-md space-y-6">
          {capabilities.map(({ icon: Icon, title, detail }) => <div key={title} className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" /><div><p className="text-sm font-medium text-text-primary">{title}</p><p className="mt-1 text-sm text-text-muted">{detail}</p></div></div>)}
        </div>
      </aside>
      <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:px-14">
        <div className="flex items-center gap-2 lg:hidden"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-xs font-bold text-white" aria-hidden="true">F</div><span className="font-semibold">ForgeOps</span></div>
        <div className="flex flex-1 items-center justify-center py-10"><div className="w-full max-w-md"><Outlet /></div></div>
        <p className="text-center text-xs text-text-muted">© {new Date().getFullYear()} ForgeOps Engineering</p>
      </main>
    </div>
  )
}
