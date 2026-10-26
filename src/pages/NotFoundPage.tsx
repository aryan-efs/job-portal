import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { pageColumn } from "@/components/layout/pageColumn"
import { cn } from "@/lib/utils"

export function NotFoundPage() {
  return (
    <div className={cn(pageColumn, "flex h-full flex-col items-center gap-4 overflow-y-auto py-24 text-center")}>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you are looking for does not exist or the job may have been removed.
      </p>
      <Link to="/">
        <Button>Browse jobs</Button>
      </Link>
    </div>
  )
}
