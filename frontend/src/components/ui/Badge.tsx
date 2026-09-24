import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-elevated text-text-secondary border border-border",
    success: "bg-status-healthy/10 text-status-healthy border border-status-healthy/25",
    warning: "bg-status-warning/10 text-status-warning border border-status-warning/25",
    danger: "bg-status-failed/10 text-status-failed border border-status-failed/25",
    outline: "border border-text-muted/30 text-text-muted",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
