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

function isDayworkerJob(job: JobPosting) {
  return String(job.jobType || "").toLowerCase() === "dayworker"
}

function matchesQuery(job: JobPosting, q: string) {
  if (!q) return true
  const haystack = [
    job.jobPosition,
    job.jobLocation,
    job.companyName,
    job.designation,
    job.department,
    job.jobDescription,
    job.salaryDetails,
    job.workLocation,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return haystack.includes(q)
}

/**
 * Public dayworker openings — same job-postings APIs as Browse, filtered to
 * engagement type Dayworker. Employer dayworker register/engage stays in the HR portal.
 */
export function DayworkerJobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await jobsApi.listActive()
        if (!cancelled) setJobs(list.filter(isDayworkerJob))
      } catch (error) {
        if (!cancelled) toast.error(apiErrorMessage(error, "Could not load dayworker jobs"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return jobs
    return jobs.filter((job) => matchesQuery(job, q))
  }, [jobs, query])

  const countLabel = useMemo(() => {
    if (loading) return "Loading…"
    return `${filtered.length} dayworker role${filtered.length === 1 ? "" : "s"}`
  }, [filtered.length, loading])

  return (
    <div className={cn(pageColumn, "flex h-full min-h-0 flex-col gap-6 pt-4")}>
      <div className="shrink-0 space-y-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Dayworker jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Short-term and daily wage openings. Apply here; employers engage verified dayworkers
            from the EZO HR portal.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by title, location, skill…"
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
        ) : filtered.length === 0 ? (
          <Empty className="border border-dashed py-16">
            <EmptyHeader>
              <EmptyTitle>No dayworker jobs</EmptyTitle>
              <EmptyDescription>
                {query.trim()
                  ? "Try a different search term."
                  : "No dayworker openings are live right now. Check back soon."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <JobCard key={job.jobID} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
