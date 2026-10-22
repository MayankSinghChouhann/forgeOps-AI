interface BrandMarkProps {
  className?: string
}

export function BrandMark({ className = "h-8 w-8" }: BrandMarkProps) {
  return <img src="/forgeops-mark-v2.svg" alt="" aria-hidden="true" className={`shrink-0 ${className}`} />
}
