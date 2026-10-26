import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, MapPin, Building2, Clock3 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { pageColumn } from "@/components/layout/pageColumn"
import { apiErrorMessage, jobsApi, type JobPosting } from "@/lib/api"
import { formatDate, isExpired } from "@/lib/format"
import { cn } from "@/lib/utils"

export function JobDetailPage() {
  const { jobId = "" } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!jobId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await jobsApi.getByJobId(jobId)
        if (!cancelled) setJob(data)
      } catch (error) {
        if (!cancelled) {
          toast.error(apiErrorMessage(error, "Could not load this job"))
          navigate("/")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [jobId, navigate])

  if (loading || !job) {
    return (
      <div className={cn(pageColumn, "h-full space-y-4 overflow-y-auto py-8")}>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const expired = isExpired(job.expiresAt)

  return (
    <div className={cn(pageColumn, "h-full space-y-6 overflow-y-auto py-8")}>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to jobs
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{job.jobType}</Badge>
          <Badge variant="outline">{job.workLocation}</Badge>
          {expired && <Badge variant="destructive">Expired</Badge>}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{job.jobPosition}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {(job.companyName || job.designation) && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              {job.companyName || job.designation}
            </span>
          )}
          {job.jobLocation && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {job.jobLocation}
            </span>
          )}
          {job.expiresAt && (
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              Apply by {formatDate(job.expiresAt)}
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About this role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {job.salaryDetails && (
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Compensation
              </p>
              <p className="mt-1 text-sm">{job.salaryDetails}</p>
            </div>
          )}
          <Separator />
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Description
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {job.jobDescription || "No detailed description was provided for this role."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Link to={`/jobs/${job.jobID}/apply`}>
          <Button size="lg" disabled={expired} className="w-full sm:w-auto">
            {expired ? "Applications closed" : "Apply for this job"}
          </Button>
        </Link>
      </div>
    </div>
  )
}
