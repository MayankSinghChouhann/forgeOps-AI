import * as React from "react"
import { NavLink } from "react-router-dom"
import { LayoutDashboard, FileText, Box, Server, GitMerge, Hexagon, Code2, Settings, ChevronsUpDown, Keyboard } from "lucide-react"
import logoImage from "@/assets/logo.png"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"

const navItems = [
  { name: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { name: "Log Analyzer", href: "/dashboard/log-analyzer", icon: FileText },
  { name: "Docker", href: "/dashboard/docker", icon: Box },
  { name: "Kubernetes", href: "/dashboard/kubernetes", icon: Server },
  { name: "CI/CD", href: "/dashboard/cicd", icon: GitMerge },
  { name: "Infrastructure", href: "/dashboard/infrastructure", icon: Hexagon },
  { name: "API Playground", href: "/dashboard/api-playground", icon: Code2 },
]

export function Sidebar() {
  return (
    <div className="flex flex-col w-64 h-screen bg-elevated border-r border-border text-text-primary transition-all">
      {/* Workspace Switcher */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border hover:bg-[rgba(255,255,255,0.02)] cursor-pointer transition-colors">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-page border border-border">
            <img src={logoImage} alt="ForgeOps Logo" className="h-5 w-5 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-sm font-semibold tracking-tight text-text-primary truncate w-32">forgeops-ai-core</span>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Workspace</span>
          </div>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-text-muted" />
      </div>
      
      {/* Environment Badge */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
        <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider">Environment</span>
        <Badge variant="success" className="bg-status-healthy/10 text-status-healthy border-status-healthy/20">
          <span className="h-1.5 w-1.5 rounded-full bg-status-healthy mr-1.5 animate-pulse"></span>
          Production
        </Badge>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-0.5 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group",
                  isActive
                    ? "bg-[rgba(255,255,255,0.05)] text-text-primary relative before:absolute before:-left-3 before:top-1 before:bottom-1 before:w-[3px] before:bg-brand-blue before:rounded-r-md"
                    : "text-text-muted hover:bg-[rgba(255,255,255,0.02)] hover:text-text-primary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("h-4 w-4 mr-3 transition-colors", isActive ? "text-brand-blue" : "group-hover:text-text-primary")} />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border space-y-2">
        <div className="flex justify-between items-center px-3 py-2 text-text-muted hover:text-text-primary cursor-pointer transition-colors rounded-md hover:bg-[rgba(255,255,255,0.02)]">
          <div className="flex items-center text-sm font-medium">
            <Keyboard className="h-4 w-4 mr-3" />
            Shortcuts
          </div>
          <span className="text-[10px] font-mono border border-border px-1.5 py-0.5 rounded text-text-muted">⌘K</span>
        </div>
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group",
              isActive
                ? "bg-[rgba(255,255,255,0.05)] text-text-primary relative before:absolute before:-left-4 before:top-1 before:bottom-1 before:w-[3px] before:bg-brand-blue before:rounded-r-md"
                : "text-text-muted hover:bg-[rgba(255,255,255,0.02)] hover:text-text-primary"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings className={cn("h-4 w-4 mr-3 transition-colors", isActive ? "text-brand-blue" : "group-hover:text-text-primary")} />
              Settings
            </>
          )}
        </NavLink>
        <div className="px-3 pt-2">
          <p className="text-[10px] font-mono text-text-muted uppercase">Version 0.1.0-beta</p>
        </div>
      </div>
    </div>
  )
}
