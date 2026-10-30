import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { SiteFooter } from "@/components/layout/SiteFooter"
import { JobsPage } from "@/pages/JobsPage"
import { DayworkerJobsPage } from "@/pages/DayworkerJobsPage"
import { JobDetailPage } from "@/pages/JobDetailPage"
import { ApplyPage } from "@/pages/ApplyPage"
import { PortalPage } from "@/pages/PortalPage"
import { NotFoundPage } from "@/pages/NotFoundPage"

export function App() {
  return (
    <BrowserRouter>
      <div className="flex h-svh flex-col overflow-hidden dark:bg-black bg-sky-50 text-foreground">
        <SiteHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<JobsPage />} />
            <Route path="/jobs" element={<Navigate to="/" replace />} />
            <Route path="/dayworkers" element={<DayworkerJobsPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
            <Route path="/jobs/:jobId/apply" element={<ApplyPage />} />
            <Route path="/portal/:token" element={<PortalPage />} />
            <Route path="/onboarding/:token" element={<PortalPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <SiteFooter />
        <Toaster richColors position="top-center" />
      </div>
    </BrowserRouter>
  )
}

export default App
