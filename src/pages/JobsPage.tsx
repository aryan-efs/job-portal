import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { JobCard } from "@/components/jobs/JobCard"
import { pageColumn } from "@/components/layout/pageColumn"
import { apiErrorMessage, jobsApi, type JobPosting } from "@/lib/api"
import { cn } from "@/lib/utils"

export function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await jobsApi.listActive()
        if (!cancelled) setJobs(list)
      } catch (error) {
        if (!cancelled) toast.error(apiErrorMessage(error, "Could not load jobs"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) return

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await jobsApi.search(q)
        setJobs(results)
      } catch (error) {
        toast.error(apiErrorMessage(error, "Search failed"))
      } finally {
        setSearching(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (query.trim()) return
    let cancelled = false
    ;(async () => {
      try {
        const list = await jobsApi.listActive()
        if (!cancelled) setJobs(list)
      } catch {
        /* ignore — initial load already toasts */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [query])

  const countLabel = useMemo(() => {
    if (loading || searching) return "Loading…"
    return `${jobs.length} open role${jobs.length === 1 ? "" : "s"}`
  }, [jobs.length, loading, searching])

  return (
    <div className={cn(pageColumn, "flex h-full min-h-0 flex-col gap-6 pt-4")}>
      <div className="shrink-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by title, location, type…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">{countLabel}</p>
        </div>
      </div>

      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto pb-5 px-1 pt-1">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Empty className="border border-dashed py-16">
            <EmptyHeader>
              <EmptyTitle>No open jobs</EmptyTitle>
              <EmptyDescription>
                {query.trim()
                  ? "Try a different search term."
                  : "Check back soon — new roles are posted regularly."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className={cn("space-y-3", searching && "opacity-60")}>
            {jobs.map((job) => (
              <JobCard key={job.jobID} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
