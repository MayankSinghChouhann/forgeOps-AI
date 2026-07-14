import { TerminalPanel } from "@/components/ui/TerminalPanel"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const terminalLines = [
    "Starting ForgeOps AI instance...",
    "Initializing auth modules...",
    "Connecting to backend cluster...",
    "Status: OK",
    "Awaiting authentication..."
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left side - Auth Form */}
      <div className="w-full md:w-[480px] p-8 md:p-12 flex flex-col justify-center border-r border-border bg-background z-10">
        <div className="mb-10">
          <div className="text-accent mb-6">
            <svg xmlns="http://www.w3.org/2001/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-mono font-medium text-primary mb-2">{title}</h1>
          {subtitle && <p className="text-sm text-secondary">{subtitle}</p>}
        </div>
        
        {children}
      </div>

      {/* Right side - Visual Anchor */}
      <div className="hidden md:flex flex-1 items-center justify-center p-12 bg-background relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#232838_1px,transparent_1px),linear-gradient(to_bottom,#232838_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
        
        <div className="w-full max-w-2xl relative z-10">
          <TerminalPanel lines={terminalLines} className="h-[400px]" />
        </div>
      </div>
    </div>
  )
}
