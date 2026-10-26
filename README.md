# EZO HR Jobs

Candidate-facing public job portal. Candidates can browse open roles, apply into the EZO HR recruitment pipeline, and complete pre-onboarding / offer actions via secure links.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 + shadcn/ui
- React Router
- Axios

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:3000`.

Set `VITE_API_BASE_URL` to your HRMS API (default `http://localhost:8181/api`).

## Routes

| Path | Purpose |
|------|---------|
| `/` | Browse / search active job postings |
| `/jobs/:jobId` | Job detail |
| `/jobs/:jobId/apply` | Apply (creates candidate with source `EzoHrJobs`) |
| `/portal/:token` | Candidate onboarding portal (secure link) |
| `/onboarding/:token` | Alias for portal |

## Backend APIs used

- `GET /api/job-postings/active`
- `GET /api/job-postings/search?q=`
- `GET /api/job-postings/job/:jobId`
- `POST /api/job-postings/job/:jobId/apply` (multipart, optional resume)
- `GET|PATCH /api/candidate-portal/:token`
- `POST /api/candidate-portal/:token/documents`
- `POST /api/candidate-portal/:token/submit`
- `POST /api/candidate-portal/:token/offer-response`

## Pipeline note

Applications attach to an **open** `JobRequisition` whose `externalJobID` matches the posting `jobID`. Publish/link jobs from the employer portal before candidates can apply.
