import { Link } from "react-router-dom"
import { MapPin, Clock3, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import type { JobPosting } from "@/lib/api"
import { formatDate, isExpired } from "@/lib/format"
import { cn } from "@/lib/utils"

export function JobCard({ job }: { job: JobPosting }) {
  const expired = isExpired(job.expiresAt)

  return (
    <Link
      to={`/jobs/${job.jobID}`}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="transition-colors hover:bg-muted/30">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base leading-snug">{job.jobPosition}</CardTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {(job.companyName || job.designation) && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {job.companyName || job.designation}
                </span>
              )}
              {job.jobLocation && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {job.jobLocation}
                </span>
              )}
              {job.expiresAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3.5" />
                  Apply by {formatDate(job.expiresAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Badge variant="secondary">{job.jobType}</Badge>
            <Badge variant="outline">{job.workLocation}</Badge>
            {expired && <Badge variant="destructive">Expired</Badge>}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {job.salaryDetails || job.jobDescription || "No description provided."}
          </p>
          <span className={cn(buttonVariants({ size: "sm" }), "shrink-0")}>View role</span>
        </CardContent>
      </Card>
    </Link>
  )
}
