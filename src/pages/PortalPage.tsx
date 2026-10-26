import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  apiErrorMessage,
  portalApi,
  type PortalContext,
  type PortalRequirement,
} from "@/lib/api"
import { pageColumn } from "@/components/layout/pageColumn"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

function isFieldRequirement(req: PortalRequirement) {
  return req.kind === "Field" || req.kind === "Text" || !req.kind || req.kind === "Data"
}

function isDocumentRequirement(req: PortalRequirement) {
  return req.kind === "Document" || req.kind === "File" || req.kind === "Upload"
}

export function PortalPage() {
  const { token = "" } = useParams()
  const [context, setContext] = useState<PortalContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [offerBusy, setOfferBusy] = useState(false)
  const [declineReason, setDeclineReason] = useState("")
  const [values, setValues] = useState<Record<string, string>>({})

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await portalApi.getContext(token)
      setContext(data)
      const next: Record<string, string> = {}
      for (const row of data.savedValues || []) {
        if (row.value != null) next[row.itemKey] = String(row.value)
      }
      setValues(next)
    } catch (error) {
      toast.error(apiErrorMessage(error, "This link is not valid"))
      setContext(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const fieldReqs = useMemo(
    () =>
      (context?.requirements || [])
        .filter((r) => isFieldRequirement(r) && r.itemKey !== "education.records")
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [context]
  )

  const documentReqs = useMemo(
    () =>
      (context?.requirements || [])
        .filter(isDocumentRequirement)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [context]
  )

  const saveDraft = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!token) return
    setSaving(true)
    try {
      await portalApi.saveDraft(token, {
        fields: Object.entries(values).map(([itemKey, value]) => ({
          itemKey,
          value: value || null,
        })),
      })
      toast.success("Progress saved")
      await load()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save"))
    } finally {
      setSaving(false)
    }
  }

  const uploadDocument = async (itemKey: string, file: File | null) => {
    if (!token || !file) return
    const form = new FormData()
    form.append("document", file)
    form.append("itemKey", itemKey)
    try {
      await portalApi.uploadDocument(token, form)
      toast.success("Document uploaded")
      await load()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Upload failed"))
    }
  }

  const submit = async () => {
    if (!token) return
    setSubmitting(true)
    try {
      await saveDraft()
      await portalApi.submit(token)
      toast.success("Submitted to HR")
      await load()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not submit"))
    } finally {
      setSubmitting(false)
    }
  }

  const respondToOffer = async (action: "Accept" | "Decline") => {
    if (!token) return
    setOfferBusy(true)
    try {
      await portalApi.respondToOffer(
        token,
        action,
        action === "Decline" ? declineReason || undefined : undefined
      )
      toast.success(action === "Accept" ? "Offer accepted" : "Offer declined")
      await load()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not record your response"))
    } finally {
      setOfferBusy(false)
    }
  }

  if (loading) {
    return (
      <div className={cn(pageColumn, "h-full space-y-4 overflow-y-auto py-8")}>
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!context) {
    return (
      <div className={cn(pageColumn, "h-full overflow-y-auto py-16 text-center")}>
        <h1 className="text-xl font-semibold">Link unavailable</h1>
        <p className="mt-2 text-muted-foreground">
          This onboarding or offer link is invalid, expired, or revoked. Please contact HR.
        </p>
      </div>
    )
  }

  const submitted = Boolean(context.submittedAt)

  return (
    <div className={cn(pageColumn, "h-full space-y-5 overflow-y-auto py-8")}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{context.status}</Badge>
          {submitted && <Badge variant="outline">Submitted</Badge>}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {context.company || "Company"} — candidate portal
        </h1>
        <p className="text-sm text-muted-foreground">
          {context.candidateName || "Candidate"}
          {context.designation ? ` · ${context.designation}` : ""}
          {context.referenceNo ? ` · ${context.referenceNo}` : ""}
          {context.expectedJoiningDate
            ? ` · Join ${formatDate(context.expectedJoiningDate)}`
            : ""}
        </p>
      </div>

      <Alert>
        <AlertTitle>Secure link</AlertTitle>
        <AlertDescription>
          Fill in the requested details, upload documents, then submit when you are ready.
          You can save progress and return using the same link.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Offer response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If this link was sent for an offer decision, choose accept or decline below.
          </p>
          <Textarea
            placeholder="Optional reason if declining…"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={offerBusy} onClick={() => respondToOffer("Accept")}>
              Accept offer
            </Button>
            <Button
              variant="outline"
              disabled={offerBusy}
              onClick={() => respondToOffer("Decline")}
            >
              Decline offer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveDraft}>
            {fieldReqs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No text fields are required.</p>
            ) : (
              fieldReqs.map((req) => (
                <div key={req.itemKey} className="space-y-1.5">
                  <Label htmlFor={req.itemKey}>
                    {req.label}
                    {req.level === "Required" ? " *" : ""}
                  </Label>
                  {req.helpText && (
                    <p className="text-xs text-muted-foreground">{req.helpText}</p>
                  )}
                  <Input
                    id={req.itemKey}
                    value={values[req.itemKey] || ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [req.itemKey]: e.target.value }))
                    }
                    disabled={submitted}
                    required={req.level === "Required"}
                  />
                </div>
              ))
            )}

            {!submitted && (
              <Button type="submit" variant="outline" disabled={saving}>
                {saving ? "Saving…" : "Save progress"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {documentReqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents requested.</p>
          ) : (
            documentReqs.map((req) => {
              const uploaded = context.documents?.find((d) => d.itemKey === req.itemKey)
              return (
                <div key={req.itemKey} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {req.label}
                        {req.level === "Required" ? " *" : ""}
                      </p>
                      {req.helpText && (
                        <p className="text-xs text-muted-foreground">{req.helpText}</p>
                      )}
                    </div>
                    {uploaded && (
                      <Badge variant="outline">{uploaded.verificationStatus || "Uploaded"}</Badge>
                    )}
                  </div>
                  {uploaded?.fileName && (
                    <p className="text-xs text-muted-foreground">{uploaded.fileName}</p>
                  )}
                  {uploaded?.rejectionReason && (
                    <p className="text-xs text-destructive">{uploaded.rejectionReason}</p>
                  )}
                  {!submitted && (
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) =>
                        uploadDocument(req.itemKey, e.target.files?.[0] ?? null)
                      }
                    />
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Separator />

      {!submitted ? (
        <Button className="w-full" size="lg" disabled={submitting} onClick={submit}>
          {submitting ? "Submitting…" : "Submit to HR"}
        </Button>
      ) : (
        <Alert>
          <AlertTitle>Already submitted</AlertTitle>
          <AlertDescription>
            Thank you. HR has received your details
            {context.submittedAt ? ` on ${formatDate(context.submittedAt)}` : ""}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
