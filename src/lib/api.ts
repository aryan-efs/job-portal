import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 60000,
})

export type JobPosting = {
  jobID: string
  requisitionID?: string
  businessID?: string
  branchID?: string | null
  jobPosition: string
  designation?: string | null
  salaryDetails?: string | null
  jobLocation?: string | null
  jobType: string
  workLocation: string
  jobDescription?: string | null
  expiresAt?: string | null
  createdDate?: string
  modifiedDate?: string
  companyName?: string | null
  companyLogo?: string | null
  department?: string | null
  openings?: number
  mustHaveSkills?: string[] | null
  goodToHaveSkills?: string[] | null
}

export type DayworkerIdentity = {
  dayworkerID: string
  publicCode?: string
  fullName?: string
  mobile?: string
}

export type ApiSuccess<T> = {
  success: boolean
  message: string
  data: T
}

function unwrap<T>(payload: ApiSuccess<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiSuccess<T>).data
  }
  return payload as T
}

export function apiErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    return data?.message || error.message || fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}

export const jobsApi = {
  async listActive() {
    const res = await api.get<ApiSuccess<{ jobPostings: JobPosting[]; count: number }>>(
      "/job-postings/active"
    )
    const data = unwrap(res.data)
    return data?.jobPostings ?? (Array.isArray(data) ? data : [])
  },

  async search(q: string) {
    const res = await api.get<
      ApiSuccess<JobPosting[] | { jobPostings?: JobPosting[]; count?: number }>
    >("/job-postings/search", { params: { q } })
    const data = unwrap(res.data)
    if (Array.isArray(data)) return data
    if (data && typeof data === "object" && "jobPostings" in data) {
      return data.jobPostings ?? []
    }
    return []
  },

  async getByJobId(jobId: string) {
    const res = await api.get<ApiSuccess<JobPosting>>(`/job-postings/job/${jobId}`)
    return unwrap(res.data)
  },

  async getStats() {
    const res = await api.get<ApiSuccess<{ total: number; active: number; expired: number }>>(
      "/job-postings/stats"
    )
    return unwrap(res.data)
  },

  async apply(jobId: string, form: FormData) {
    const res = await api.post(`/job-postings/job/${jobId}/apply`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      validateStatus: (status) => (status >= 200 && status < 300) || status === 409,
    })
    return res.data as ApiSuccess<unknown> & {
      data?: {
        created?: boolean
        requiresConfirmation?: boolean
        candidate?: unknown
        duplicates?: unknown
      }
    }
  },
}

/** Public dayworker register + engage (auth removed on these onboarding routes). */
export const dayworkerApi = {
  async register(
    businessID: string,
    body: {
      fullName: string
      mobile: string
      email?: string
      preferredLocations?: string[]
    }
  ) {
    const res = await api.post<
      ApiSuccess<{ created: boolean; dayworker: DayworkerIdentity }>
    >(`/onboarding/${businessID}/dayworkers`, body)
    return unwrap(res.data)
  },

  async engage(
    businessID: string,
    body: {
      dayworkerIdentifier: string
      startDate: string
      jobSkill?: string
      requisitionID?: string
      branchID?: string | null
      proceedWithPendingVerification?: boolean
      allowOverlap?: boolean
    }
  ) {
    const res = await api.post<
      ApiSuccess<{
        engaged?: boolean
        requiresVerification?: boolean
        engagement?: unknown
        dayworker?: DayworkerIdentity
      }>
    >(`/onboarding/${businessID}/dayworker-engagements`, body)
    return unwrap(res.data)
  },
}

export type PortalRequirement = {
  kind: string
  itemKey: string
  label: string
  level: string
  category?: string | null
  allowMultiple?: boolean
  helpText?: string | null
  sortOrder?: number
}

export type PortalContext = {
  referenceNo: string
  candidateName?: string | null
  mobile?: string | null
  email?: string | null
  expectedJoiningDate?: string | null
  engagementType?: string | null
  status: string
  submittedAt?: string | null
  company?: string | null
  companyLogo?: string | null
  designation?: string | null
  department?: string | null
  branch?: string | null
  requirements: PortalRequirement[]
  savedValues: Array<{ itemKey: string; value?: string | null; valueJson?: unknown }>
  documents: Array<{
    documentID: string
    itemKey: string
    label?: string | null
    fileName?: string | null
    verificationStatus?: string | null
    rejectionReason?: string | null
  }>
  educations: unknown[]
  previousEmployments: unknown[]
}

export const portalApi = {
  async getContext(token: string) {
    const res = await api.get<ApiSuccess<PortalContext>>(`/candidate-portal/${token}`)
    return unwrap(res.data)
  },

  async saveDraft(
    token: string,
    body: {
      fields?: Array<{ itemKey: string; value: string | Record<string, unknown> | null }>
      educations?: unknown[]
      previousEmployments?: unknown[]
    }
  ) {
    const res = await api.patch(`/candidate-portal/${token}`, body)
    return unwrap(res.data)
  },

  async uploadDocument(token: string, form: FormData) {
    const res = await api.post(`/candidate-portal/${token}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return unwrap(res.data)
  },

  async submit(token: string) {
    const res = await api.post(`/candidate-portal/${token}/submit`)
    return unwrap(res.data)
  },

  async respondToOffer(token: string, action: "Accept" | "Decline", reason?: string) {
    const res = await api.post(`/candidate-portal/${token}/offer-response`, {
      action,
      reason,
    })
    return unwrap(res.data)
  },
}

export default api
