import { Bell, Search, LogOut, Menu } from "lucide-react"
import { useLocation } from "react-router-dom"
import { useAuth } from "@/features/auth/hooks/useAuth"

const routeNames: Record<string, string> = { overview: "Overview", assistant: "AI Assistant", "log-analyzer": "Log Analyzer", docker: "Docker", kubernetes: "Kubernetes", cicd: "CI/CD", infrastructure: "Infrastructure", "api-playground": "API Playground", terminal: "API Playground", settings: "Settings" }

export function Header({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const segments = pathname.split("/").filter(Boolean)
  const segment = segments[segments.length - 1] || "overview"
  const pageName = routeNames[segment] || "ForgeOps"
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-page/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onOpenSidebar} className="rounded-md p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-text-primary">{pageName}</p><p className="hidden text-xs text-text-muted sm:block">ForgeOps / {pageName}</p></div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button type="button" className="hidden h-9 w-64 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text-muted transition-colors hover:border-border-strong md:flex" aria-label="Search resources"><Search className="h-4 w-4" aria-hidden="true" /><span className="flex-1 text-left">Search resources</span><kbd className="rounded border border-border px-1.5 py-0.5 font-sans text-[10px]">⌘K</kbd></button>
        <button type="button" className="relative rounded-md p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary" aria-label="Notifications"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" /></button>
        <div className="mx-1 h-6 w-px bg-border" />
        <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-text-secondary" aria-hidden="true">{user?.email?.charAt(0).toUpperCase() ?? "?"}</div><span className="hidden max-w-36 truncate text-xs text-text-muted xl:block" title={user?.email}>{user?.email}</span><button type="button" onClick={logout} title="Sign out" aria-label="Sign out" className="rounded-md p-2 text-text-muted hover:bg-surface-hover hover:text-status-failed"><LogOut className="h-4 w-4" /></button></div>
      </div>
    </header>
  )
}
