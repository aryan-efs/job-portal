import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { pageColumn } from "@/components/layout/pageColumn"
import { apiErrorMessage, jobsApi, type JobPosting } from "@/lib/api"
import { isExpired } from "@/lib/format"
import { cn } from "@/lib/utils"

const APPLY_FORM_STORAGE_KEY = "ezohr-jobs-apply-form"

type ApplyFormState = {
  fullName: string
  mobile: string
  email: string
  currentLocation: string
  totalExperienceMonths: string
  currentCtc: string
  expectedCtc: string
  noticePeriodDays: string
}

const emptyForm: ApplyFormState = {
  fullName: "",
  mobile: "",
  email: "",
  currentLocation: "",
  totalExperienceMonths: "",
  currentCtc: "",
  expectedCtc: "",
  noticePeriodDays: "",
}

function loadSavedApplyForm(): ApplyFormState {
  try {
    const raw = localStorage.getItem(APPLY_FORM_STORAGE_KEY)
    if (!raw) return emptyForm
    const parsed = JSON.parse(raw) as Partial<ApplyFormState>
    return {
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      mobile: typeof parsed.mobile === "string" ? parsed.mobile : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      currentLocation:
        typeof parsed.currentLocation === "string" ? parsed.currentLocation : "",
      totalExperienceMonths:
        typeof parsed.totalExperienceMonths === "string"
          ? parsed.totalExperienceMonths
          : "",
      currentCtc: typeof parsed.currentCtc === "string" ? parsed.currentCtc : "",
      expectedCtc: typeof parsed.expectedCtc === "string" ? parsed.expectedCtc : "",
      noticePeriodDays:
        typeof parsed.noticePeriodDays === "string" ? parsed.noticePeriodDays : "",
    }
  } catch {
    return emptyForm
  }
}

function saveApplyForm(form: ApplyFormState) {
  try {
    localStorage.setItem(APPLY_FORM_STORAGE_KEY, JSON.stringify(form))
  } catch {
    /* ignore quota / private mode */
  }
}

export function ApplyPage() {
  const { jobId = "" } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [resume, setResume] = useState<File | null>(null)
  const [form, setForm] = useState<ApplyFormState>(loadSavedApplyForm)

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

  const onSubmit = async (event: FormEvent, confirmDuplicate = false) => {
    event.preventDefault()
    if (!jobId || !job) return

    const isDayworker = String(job.jobType || "").toLowerCase() === "dayworker"
    const mobile = form.mobile.replace(/\D/g, "").slice(-10)

    if (!form.fullName.trim() || mobile.length !== 10) {
      toast.error("Name and a valid 10-digit mobile are required")
      return
    }

    saveApplyForm(form)

    const body = new FormData()
    body.append("fullName", form.fullName.trim())
    body.append("mobile", mobile)
    if (form.email.trim()) body.append("email", form.email.trim())
    if (form.currentLocation.trim()) body.append("currentLocation", form.currentLocation.trim())
    if (!isDayworker) {
      if (form.totalExperienceMonths) {
        body.append("totalExperienceMonths", form.totalExperienceMonths)
      }
      if (form.currentCtc) body.append("currentCtc", form.currentCtc)
      if (form.expectedCtc) body.append("expectedCtc", form.expectedCtc)
      if (form.noticePeriodDays) body.append("noticePeriodDays", form.noticePeriodDays)
      if (resume) body.append("resume", resume)
    }
    if (confirmDuplicate) body.append("confirmDuplicate", "true")

    setSubmitting(true)
    try {
      const res = await jobsApi.apply(jobId, body)
      if (res.data?.requiresConfirmation) {
        setNeedsConfirm(true)
        toast.message("A similar profile may already exist", {
          description: "Confirm below if you still want to apply.",
        })
        return
      }
      toast.success(res.message || "Application submitted")
      navigate(`/jobs/${jobId}`, { replace: true })
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not submit application"))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !job) {
    return (
      <div className={cn(pageColumn, "scrollbar-hide h-full space-y-4 overflow-y-auto py-6")}>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  const expired = isExpired(job.expiresAt)
  const isDayworker = String(job.jobType || "").toLowerCase() === "dayworker"

  return (
    <div className={cn(pageColumn, "scrollbar-hide h-full overflow-y-auto py-6")}>
      <Link
        to={isDayworker ? "/dayworkers" : `/jobs/${job.jobID}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-xl font-semibold tracking-tight">{job.jobPosition}</h1>
        {(job.companyName || job.designation) && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {job.companyName || job.designation}
          </p>
        )}
        {isDayworker ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Dayworker application — only basic details are needed.
          </p>
        ) : null}
      </div>

      {expired ? (
        <Alert variant="destructive">
          <AlertTitle>Applications closed</AlertTitle>
          <AlertDescription>This posting has expired.</AlertDescription>
        </Alert>
      ) : (
        <form className="space-y-4 pb-6" onSubmit={(e) => onSubmit(e, needsConfirm)}>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name *</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mobile">Mobile *</Label>
              <Input
                id="mobile"
                value={form.mobile}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                inputMode="numeric"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="currentLocation">
              {isDayworker ? "Preferred work location" : "Current location"}
            </Label>
            <Input
              id="currentLocation"
              value={form.currentLocation}
              onChange={(e) => setForm((f) => ({ ...f, currentLocation: e.target.value }))}
              placeholder={isDayworker ? "City / site" : undefined}
            />
          </div>

          {!isDayworker ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="exp">Experience (months)</Label>
                  <Input
                    id="exp"
                    type="number"
                    min={0}
                    value={form.totalExperienceMonths}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, totalExperienceMonths: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notice">Notice period (days)</Label>
                  <Input
                    id="notice"
                    type="number"
                    min={0}
                    value={form.noticePeriodDays}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, noticePeriodDays: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="currentCtc">Current CTC</Label>
                  <Input
                    id="currentCtc"
                    type="number"
                    min={0}
                    value={form.currentCtc}
                    onChange={(e) => setForm((f) => ({ ...f, currentCtc: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expectedCtc">Expected CTC</Label>
                  <Input
                    id="expectedCtc"
                    type="number"
                    min={0}
                    value={form.expectedCtc}
                    onChange={(e) => setForm((f) => ({ ...f, expectedCtc: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="resume">Resume</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf"
                  onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                />
              </div>
            </>
          ) : null}

          {needsConfirm && (
            <Alert>
              <AlertTitle>Possible duplicate profile</AlertTitle>
              <AlertDescription>
                Submit again to confirm you still want to apply with these details.
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? "Submitting…"
              : needsConfirm
                ? "Confirm and apply"
                : "Submit application"}
          </Button>
        </form>
      )}
    </div>
  )
}
