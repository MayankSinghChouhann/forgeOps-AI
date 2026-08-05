import * as React from "react"
import { Bell, Search, LogOut } from "lucide-react"
import { useAuth } from "@/features/auth/hooks/useAuth"

/**
 * Header component — top navigation bar for the dashboard.
 *
 * Reads the logged-in user's email from AuthContext via useAuth()
 * and renders it alongside the logout button. The logout action
 * clears localStorage and redirects to /login.
 */
export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-page border-b border-border z-10 sticky top-0">
      <div className="flex items-center flex-1 space-x-6">
        <div className="flex items-center space-x-2 text-sm text-text-muted font-mono">
          <span className="hover:text-text-primary cursor-pointer transition-colors">forgeops-ai-core</span>
          <span>/</span>
          <span className="text-text-primary font-semibold">overview</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Global Search hint */}
        <div className="relative group cursor-pointer hidden md:block">
          <Search className="absolute left-3 top-2 h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors" />
          <div className="flex items-center justify-between h-8 w-64 rounded-md border border-border bg-terminal pl-9 pr-2 text-sm text-text-muted group-hover:border-white/20 transition-all">
            <span>Search resources...</span>
            <span className="flex items-center space-x-0.5 text-[10px] font-mono border border-border rounded px-1.5 py-0.5 bg-page text-text-muted">
              <span>⌘</span><span>K</span>
            </span>
          </div>
        </div>

        <div className="w-px h-6 bg-border mx-2 hidden md:block"></div>

        {/* Notification bell */}
        <button className="relative p-2 text-text-muted hover:text-text-primary transition-colors rounded-full hover:bg-elevated border border-transparent hover:border-border">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-cyan border-2 border-page"></span>
        </button>

        {/* User info + Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          {/* User avatar with email initial */}
          <div className="h-8 w-8 rounded-full bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-blue text-xs font-bold font-mono uppercase select-none">
            {user?.email?.charAt(0) ?? "?"}
          </div>

          {/* User email — hidden on small screens */}
          <span className="hidden lg:block text-xs text-text-muted font-mono max-w-[140px] truncate" title={user?.email}>
            {user?.email}
          </span>

          {/* Logout button */}
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 text-text-muted hover:text-status-failed transition-colors rounded-md hover:bg-status-failed/10 border border-transparent hover:border-status-failed/30"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
