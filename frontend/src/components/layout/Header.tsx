import * as React from "react"
import { Bell, Search, User, Activity } from "lucide-react"

export function Header() {
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
        {/* Global Search / Command Palette Hint */}
        <div className="relative group cursor-pointer hidden md:block">
          <Search className="absolute left-3 top-2 h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors" />
          <div className="flex items-center justify-between h-8 w-64 rounded-md border border-border bg-terminal pl-9 pr-2 text-sm text-text-muted group-hover:border-white/20 transition-all">
            <span>Search resources...</span>
            <span className="flex items-center space-x-0.5 text-[10px] font-mono border border-border rounded px-1.5 py-0.5 bg-page text-text-muted">
              <span>⌘</span><span>K</span>
            </span>
          </div>
        </div>
        
        {/* API Status Indicator */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-border bg-elevated text-xs font-mono cursor-help">
          <Activity className="h-3 w-3 text-status-healthy" />
          <span className="text-text-muted">API: </span>
          <span className="text-status-healthy font-semibold">24ms</span>
        </div>

        <div className="w-px h-6 bg-border mx-2 hidden md:block"></div>
        
        <button className="relative p-2 text-text-muted hover:text-text-primary transition-colors rounded-full hover:bg-elevated border border-transparent hover:border-border">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-cyan border-2 border-page"></span>
        </button>
        
        <button className="h-8 w-8 rounded-full bg-elevated border border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-blue/50 transition-colors">
          <User className="h-4 w-4 text-text-muted" />
        </button>
      </div>
    </header>
  )
}
