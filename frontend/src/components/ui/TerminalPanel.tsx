import * as React from "react"
import { cn } from "@/lib/utils"

export interface TerminalPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  lines: string[]
}

export function TerminalPanel({ lines, className, ...props }: TerminalPanelProps) {
  const [visibleLines, setVisibleLines] = React.useState<string[]>([])
  
  React.useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < lines.length) {
        setVisibleLines(lines.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
      }
    }, 400)
    
    return () => clearInterval(interval)
  }, [lines])

  return (
    <div 
      className={cn(
        "font-mono text-sm bg-panel border border-border rounded-md p-4 shadow-lg overflow-hidden relative",
        className
      )}
      {...props}
    >
      <div className="absolute top-0 left-0 w-full h-8 bg-background border-b border-border flex items-center px-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-border" />
          <div className="w-3 h-3 rounded-full bg-border" />
          <div className="w-3 h-3 rounded-full bg-border" />
        </div>
        <div className="ml-4 text-xs text-secondary">forgeops@system:~</div>
      </div>
      <div className="mt-8 space-y-1">
        {visibleLines.map((line, idx) => {
          const isError = line.toLowerCase().includes("error") || line.toLowerCase().includes("failed")
          const isSuccess = line.toLowerCase().includes("success") || line.toLowerCase().includes("ok")
          return (
            <div 
              key={idx} 
              className={cn("whitespace-pre-wrap", {
                "text-error": isError,
                "text-success": isSuccess,
                "text-primary": !isError && !isSuccess
              })}
            >
              <span className="text-secondary mr-2">$</span>
              {line}
            </div>
          )
        })}
        <div className="flex items-center text-primary mt-1">
          <span className="text-secondary mr-2">$</span>
          <span className="inline-block w-2 h-4 bg-accent animate-pulse" />
        </div>
      </div>
    </div>
  )
}
