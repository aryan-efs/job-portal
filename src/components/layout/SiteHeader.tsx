import { Link, NavLink } from "react-router-dom"
import { BriefcaseBusiness } from "lucide-react"
import { pageColumn } from "@/components/layout/pageColumn"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  return (
    <header className="z-40 shrink-0 bg-background/85 backdrop-blur-md w-2xl mx-auto mt-2 rounded-lg">
      <div className={cn(pageColumn, "flex h-12 items-center justify-between gap-3")}>
        <Link to="/" className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BriefcaseBusiness className="size-3.5" />
          </span>
          <span className="truncate">
            EZO HR
            <span className="ml-1.5 font-normal text-muted-foreground">Jobs</span>
          </span>
        </Link>

        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground",
              isActive && "font-medium text-foreground"
            )
          }
        >
          Browse
        </NavLink>
      </div>
    </header>
  )
}
