import { useEffect, useState } from "react"
import { pageColumn } from "@/components/layout/pageColumn"
import { cn } from "@/lib/utils"

const THEME_HINT = "Press D to toggle theme"
const DEFAULT_COPY = "Careers board for companies on EZO HR"

export function SiteFooter() {
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHint(false), 3000)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <footer className="shrink-0">
      <div className={cn(pageColumn, "pt-4 pb-2 text-center text-xs text-muted-foreground")}>
        {showHint ? THEME_HINT : DEFAULT_COPY}
      </div>
    </footer>
  )
}
