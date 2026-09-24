import { cn } from "@/lib/utils"

export type StatusTone = "healthy" | "warning" | "failed" | "info" | "neutral"
const tones: Record<StatusTone, string> = { healthy: "bg-status-healthy", warning: "bg-status-warning", failed: "bg-status-failed", info: "bg-status-info", neutral: "bg-text-muted" }
export function StatusIndicator({ status, label, className }: { status: StatusTone; label: string; className?: string }) {
  return <span className={cn("inline-flex items-center gap-2 text-xs font-medium text-text-secondary", className)}><span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tones[status])} aria-hidden="true" />{label}</span>
}
