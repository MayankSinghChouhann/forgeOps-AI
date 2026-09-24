import { NavLink } from "react-router-dom"
import { LayoutDashboard, Bot, FileText, Box, Server, GitMerge, Hexagon, Code2, Settings, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusIndicator } from "@/components/ui/StatusIndicator"

const navItems = [
  { name: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { name: "AI Assistant", href: "/dashboard/assistant", icon: Bot },
  { name: "Log Analyzer", href: "/dashboard/log-analyzer", icon: FileText },
  { name: "Docker", href: "/dashboard/docker", icon: Box },
  { name: "Kubernetes", href: "/dashboard/kubernetes", icon: Server },
  { name: "CI/CD", href: "/dashboard/cicd", icon: GitMerge },
  { name: "Infrastructure", href: "/dashboard/infrastructure", icon: Hexagon },
  { name: "API Playground", href: "/dashboard/api-playground", icon: Code2 },
]

interface SidebarProps { open: boolean; onClose: () => void }

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}
      <aside aria-label="Primary navigation" className={cn("fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-150 lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-bold text-white" aria-hidden="true">F</div>
          <button type="button" className="flex min-w-0 flex-1 items-center justify-between rounded-md text-left" aria-label="Select workspace">
            <span className="min-w-0"><span className="block truncate text-sm font-semibold">ForgeOps</span><span className="block truncate text-xs text-text-muted">forgeops-ai-core</span></span>
            <ChevronsUpDown className="h-4 w-4 text-text-muted" aria-hidden="true" />
          </button>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary lg:hidden" aria-label="Close navigation"><X className="h-4 w-4" /></button>
        </div>
        <div className="border-b border-border px-4 py-3"><div className="flex items-center justify-between"><span className="text-xs text-text-muted">Environment</span><StatusIndicator status="healthy" label="Production" /></div></div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-xs font-medium text-text-muted">Workspace</p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.name} to={item.href} onClick={onClose} className={({ isActive }) => cn("flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors", isActive ? "bg-surface-hover text-text-primary" : "text-text-muted hover:bg-surface-hover/70 hover:text-text-primary")}>
                {({ isActive }) => <><item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-accent" : "text-text-muted")} aria-hidden="true" /><span>{item.name}</span></>}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="border-t border-border p-3">
          <NavLink to="/dashboard/settings" onClick={onClose} className={({ isActive }) => cn("flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors", isActive ? "bg-surface-hover text-text-primary" : "text-text-muted hover:bg-surface-hover/70 hover:text-text-primary")}><Settings className="h-4 w-4" aria-hidden="true" />Settings</NavLink>
          <p className="px-3 pt-3 text-xs text-text-muted">ForgeOps v0.1.0-beta</p>
        </div>
      </aside>
    </>
  )
}
