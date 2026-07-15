import * as React from "react"
import { Outlet } from "react-router-dom"
import logoImage from "@/assets/logo.png"
import { ShieldAlert, Server, GitMerge } from "lucide-react"

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-page flex">
      {/* Left Panel: Infrastructure Tracker (40%) */}
      <div className="hidden lg:flex w-2/5 bg-elevated border-r border-border relative overflow-hidden flex-col justify-between p-12">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-blue blur-[120px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-16">
            <img src={logoImage} alt="ForgeOps Logo" className="h-10 w-10 object-contain" />
            <span className="font-mono text-xl font-medium tracking-tight text-text-primary">
              ForgeOps AI
            </span>
          </div>
          
          <h1 className="text-4xl font-medium tracking-tight text-text-primary mb-4">
            AI-Powered DevOps Intelligence
          </h1>
          <p className="text-text-muted text-lg max-w-sm">
            Automate deployments, resolve incidents, and optimize your infrastructure with production-grade AI.
          </p>
        </div>

        {/* Animated Terminal / Insights Mock */}
        <div className="relative z-10 space-y-4">
          <h3 className="font-mono text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
            Recent Intelligence
          </h3>
          
          <div className="flex items-start space-x-3 text-sm p-3 rounded-md bg-page/50 border border-border/50 hover:bg-page transition-colors">
            <ShieldAlert className="h-4 w-4 text-status-warning mt-0.5" />
            <div>
              <p className="text-text-primary font-medium">Docker image vulnerability detected</p>
              <p className="text-text-muted text-xs font-mono mt-1">CVE-2026-1049 • ubuntu:latest</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 text-sm p-3 rounded-md bg-page/50 border border-border/50 hover:bg-page transition-colors">
            <Server className="h-4 w-4 text-status-healthy mt-0.5" />
            <div>
              <p className="text-text-primary font-medium">Kubernetes deployment healthy</p>
              <p className="text-text-muted text-xs font-mono mt-1">namespace: production • 12/12 pods</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 text-sm p-3 rounded-md bg-page/50 border border-border/50 hover:bg-page transition-colors">
            <GitMerge className="h-4 w-4 text-brand-cyan mt-0.5" />
            <div>
              <p className="text-text-primary font-medium">AI generated Terraform config</p>
              <p className="text-text-muted text-xs font-mono mt-1">Applied via PR #492 • AWS EKS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Auth Form (60%) */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-32 bg-page relative">
        {/* Responsive Logo for Mobile */}
        <div className="flex items-center justify-center lg:hidden mb-8">
          <img src={logoImage} alt="ForgeOps Logo" className="h-12 w-12 object-contain" />
        </div>
        
        <div className="w-full max-w-md mx-auto">
          <Outlet />
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-xs font-mono text-text-muted">
            &copy; {new Date().getFullYear()} ForgeOps Engineering.
          </p>
        </div>
      </div>
    </div>
  )
}
