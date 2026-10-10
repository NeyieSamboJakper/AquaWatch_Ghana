import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/navbar'
import { ReportCard } from '@/components/report-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertTriangle, FileSearch } from 'lucide-react'
import type { WaterReport, IssueType, Severity, ReportStatus } from '@/lib/types'
import { GHANA_REGIONS, ISSUE_TYPE_LABELS, SEVERITY_LABELS, STATUS_LABELS } from '@/lib/types'
import { ReportsFilters } from '@/components/reports-filters'

interface SearchParams {
  region?: string
  severity?: string
  status?: string
  issue_type?: string
  page?: string
}

const PAGE_SIZE = 12

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const page = parseInt(params.page ?? '1', 10)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('water_reports')
    .select('*, reporter:profiles(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.region) query = query.eq('region', params.region)
  if (params.severity) query = query.eq('severity', params.severity)
  if (params.status) query = query.eq('status', params.status)
  if (params.issue_type) query = query.eq('issue_type', params.issue_type)

  const { data: reports, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Water Issue Reports</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {count ?? 0} report{count !== 1 ? 's' : ''} across Ghana
            </p>
          </div>
          {user && (
            <Button asChild size="sm">
              <Link href="/report">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Report Issue
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <ReportsFilters
          regions={GHANA_REGIONS}
          issueTypeLabels={ISSUE_TYPE_LABELS as Record<string, string>}
          severityLabels={SEVERITY_LABELS as Record<string, string>}
          statusLabels={STATUS_LABELS as Record<string, string>}
          current={{
            region: params.region,
            severity: params.severity,
            status: params.status,
            issue_type: params.issue_type,
          }}
        />

        {/* Results */}
        {reports && reports.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {(reports as WaterReport[]).map(r => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/reports?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>
                      Previous
                    </Link>
                  </Button>
                )}
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/reports?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <FileSearch className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No reports found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or be the first to report an issue.
            </p>
            {user && (
              <Button asChild size="sm">
                <Link href="/report">Report an Issue</Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
