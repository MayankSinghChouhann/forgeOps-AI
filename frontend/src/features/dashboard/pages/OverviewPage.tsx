import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Activity, ShieldAlert, GitMerge, Server, Cpu, Database, Network } from "lucide-react"

export function OverviewPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Hero / AI Summary */}
      <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden shadow-[0_0_40px_rgba(35,103,214,0.03)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="h-12 w-12 rounded-full bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(35,103,214,0.2)]">
          <Activity className="h-6 w-6 text-brand-blue" />
        </div>
        <div className="flex-1 z-10">
          <h2 className="text-xl font-medium text-text-primary tracking-tight">Environment: Production</h2>
          <p className="text-text-muted mt-1 text-sm">
            Everything looks healthy. <span className="text-text-primary font-medium">AI detected one optimization opportunity</span> in the `auth-service` database indexing.
          </p>
        </div>
        <div className="z-10">
          <button className="px-4 py-2 bg-brand-gradient text-page font-medium rounded-md text-sm hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(35,103,214,0.4)] cursor-pointer">
            Review Recommendations
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (AI & CI/CD) - 3/12 */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50 mb-3">
              <CardTitle className="text-[11px] uppercase tracking-wider text-text-muted font-mono font-semibold flex items-center">
                <ShieldAlert className="h-3 w-3 mr-2 text-brand-cyan" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-primary">High CPU Threshold</span>
                  <Badge variant="warning">WARN</Badge>
                </div>
                <p className="text-xs text-text-muted font-mono leading-relaxed">
                  Pod <span className="text-text-primary">api-worker-7b9c</span> is hitting 85% utilization. Scaling recommended.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-primary">Memory Leak</span>
                  <Badge variant="danger">CRIT</Badge>
                </div>
                <p className="text-xs text-text-muted font-mono leading-relaxed">
                  Detected in <span className="text-text-primary">payment-gateway</span> over last 24h.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-border/50 mb-3">
              <CardTitle className="text-[11px] uppercase tracking-wider text-text-muted font-mono font-semibold flex items-center">
                <GitMerge className="h-3 w-3 mr-2" />
                Pipeline Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative pt-1">
              <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border/50" />
              {[
                { time: "10:42", hash: "a9f3b1c", name: "Deploy to Production", status: "success" },
                { time: "10:35", hash: "a9f3b1c", name: "Integration Tests", status: "success" },
                { time: "10:30", hash: "8b2d4ef", name: "Build & Push Image", status: "success" },
                { time: "09:15", hash: "7c1a9bc", name: "Deploy to Staging", status: "failed" },
              ].map((step, i) => (
                <div key={i} className="flex relative z-10 group">
                  <div className={`h-2 w-2 rounded-full border-2 mt-1.5 shrink-0 bg-page transition-all group-hover:scale-125 ${step.status === 'success' ? 'border-status-healthy' : 'border-status-failed'}`} />
                  <div className="ml-4 space-y-0.5">
                    <p className="text-sm font-medium text-text-primary">{step.name}</p>
                    <div className="flex space-x-2 text-[11px] font-mono text-text-muted">
                      <span>{step.time}</span>
                      <span>•</span>
                      <span className="hover:text-brand-cyan cursor-pointer transition-colors">{step.hash}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* CENTER COLUMN (Infrastructure & Clusters) - 6/12 */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="h-full min-h-[500px] flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50 mb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[11px] uppercase tracking-wider text-text-muted font-mono font-semibold flex items-center">
                <Server className="h-3 w-3 mr-2" />
                Cluster Status
              </CardTitle>
              <Badge variant="success">Nominal</Badge>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 rounded-md border border-border/30 bg-page/30 shadow-inner">
                  <div className="text-[11px] font-mono text-text-muted mb-1">Total Nodes</div>
                  <div className="text-2xl font-mono text-text-primary">124</div>
                </div>
                <div className="p-3 rounded-md border border-border/30 bg-page/30 shadow-inner">
                  <div className="text-[11px] font-mono text-text-muted mb-1">Active Pods</div>
                  <div className="text-2xl font-mono text-text-primary">8,294</div>
                </div>
                <div className="p-3 rounded-md border border-border/30 bg-page/30 shadow-inner">
                  <div className="text-[11px] font-mono text-text-muted mb-1">Deployments</div>
                  <div className="text-2xl font-mono text-text-primary">312</div>
                </div>
              </div>
              
              <div className="flex-1 rounded-md border border-border/50 bg-[#0A0C10] p-4 flex flex-col relative overflow-hidden shadow-inner">
                <div className="flex justify-between items-center mb-4 z-10">
                  <div className="text-xs font-mono text-text-muted">Live Topology (us-east-1)</div>
                  <div className="flex space-x-1.5 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-healthy animate-pulse" />
                    <span className="text-[10px] font-mono text-status-healthy tracking-wider">SYNCED</span>
                  </div>
                </div>
                {/* Simulated complex engineering topology map */}
                <div className="flex-1 flex items-center justify-center relative">
                  <div className="absolute w-full h-full border border-dashed border-border/20 rounded-full scale-[0.8] opacity-50" />
                  <div className="absolute w-full h-full border border-dashed border-border/20 rounded-full scale-[0.5] opacity-50" />
                  
                  {/* Center Node */}
                  <div className="z-10 flex flex-col items-center">
                    <div className="h-12 w-12 bg-brand-blue/20 border border-brand-blue text-brand-cyan rounded-lg flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(35,103,214,0.3)] animate-[pulse_4s_ease-in-out_infinite]">
                      <Network className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono text-text-primary bg-[#141824] px-2 py-0.5 rounded border border-border/50 shadow-sm">ingress-nginx</span>
                  </div>
                  
                  {/* Surrounding nodes */}
                  <div className="absolute top-10 left-20 flex flex-col items-center group cursor-pointer">
                    <div className="h-8 w-8 bg-status-healthy/10 border border-status-healthy/50 text-status-healthy rounded-md flex items-center justify-center mb-1 group-hover:bg-status-healthy/20 transition-colors"><Server className="h-4 w-4" /></div>
                    <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary transition-colors">auth-svc</span>
                  </div>
                  <div className="absolute bottom-12 right-24 flex flex-col items-center group cursor-pointer">
                    <div className="h-8 w-8 bg-status-healthy/10 border border-status-healthy/50 text-status-healthy rounded-md flex items-center justify-center mb-1 group-hover:bg-status-healthy/20 transition-colors"><Database className="h-4 w-4" /></div>
                    <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary transition-colors">user-db-cluster</span>
                  </div>
                  <div className="absolute top-20 right-16 flex flex-col items-center group cursor-pointer">
                    <div className="h-8 w-8 bg-status-warning/10 border border-status-warning/50 text-status-warning rounded-md flex items-center justify-center mb-1 group-hover:bg-status-warning/20 transition-colors"><Server className="h-4 w-4" /></div>
                    <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary transition-colors">payment-worker</span>
                  </div>
                  <div className="absolute bottom-16 left-24 flex flex-col items-center group cursor-pointer">
                    <div className="h-8 w-8 bg-status-healthy/10 border border-status-healthy/50 text-status-healthy rounded-md flex items-center justify-center mb-1 group-hover:bg-status-healthy/20 transition-colors"><Server className="h-4 w-4" /></div>
                    <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary transition-colors">ui-frontend</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (Telemetry & Alerts) - 3/12 */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50 mb-3 flex flex-row justify-between items-center">
              <CardTitle className="text-[11px] uppercase tracking-wider text-text-muted font-mono font-semibold flex items-center">
                <Cpu className="h-3 w-3 mr-2" />
                Telemetry
              </CardTitle>
              <span className="flex h-2 w-2 rounded-full bg-status-healthy animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-text-muted">Global CPU</span>
                  <span className="text-text-primary font-medium">42%</span>
                </div>
                <div className="w-full h-1.5 bg-page rounded-full overflow-hidden border border-border/30">
                  <div className="h-full bg-brand-cyan w-[42%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-text-muted">Global RAM</span>
                  <span className="text-status-warning font-medium">78%</span>
                </div>
                <div className="w-full h-1.5 bg-page rounded-full overflow-hidden border border-border/30">
                  <div className="h-full bg-status-warning w-[78%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-text-muted">API Latency (p99)</span>
                  <span className="text-status-healthy font-medium">124ms</span>
                </div>
                <div className="w-full h-10 flex items-end space-x-[2px] opacity-80 mt-2">
                  {/* Mock bar chart for latency */}
                  {[30, 40, 25, 60, 45, 80, 50, 40, 35, 20, 30, 40, 25, 45, 60, 50, 40, 35, 45, 30].map((h, i) => (
                    <div key={i} className="flex-1 bg-brand-blue/60 hover:bg-brand-cyan transition-colors rounded-t-[1px]" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-border/50 mb-0 flex flex-row items-center justify-between bg-page/30 rounded-t-card">
              <CardTitle className="text-[11px] uppercase tracking-wider text-text-muted font-mono font-semibold">
                Network Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 font-mono text-[10px] leading-tight">
              <div className="flex flex-col border-b border-border/30 p-3 hover:bg-page/50 transition-colors cursor-crosshair group">
                <div className="flex justify-between mb-1.5">
                  <span className="text-brand-cyan group-hover:text-brand-cyan/80">GET /api/v1/users</span>
                  <span className="text-status-healthy font-medium">200 OK</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>10.24.1.92</span>
                  <span>12ms</span>
                </div>
              </div>
              <div className="flex flex-col border-b border-border/30 p-3 hover:bg-page/50 transition-colors cursor-crosshair group">
                <div className="flex justify-between mb-1.5">
                  <span className="text-status-warning">POST /api/v1/auth</span>
                  <span className="text-status-warning font-medium">401 UNAUTH</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>192.168.1.5</span>
                  <span>45ms</span>
                </div>
              </div>
              <div className="flex flex-col p-3 hover:bg-page/50 transition-colors cursor-crosshair group">
                <div className="flex justify-between mb-1.5">
                  <span className="text-status-failed">GET /metrics</span>
                  <span className="text-status-failed font-medium">503 ERR</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>10.24.2.14</span>
                  <span>1,204ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  )
}
