import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import { AdminStats } from '@/components/admin-stats'
import { AdminUsersTable } from '@/components/admin-users-table'
import { AdminReportSearch } from '@/components/admin-report-search'
import { ReportsFilters } from '@/components/reports-filters'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GHANA_REGIONS, ISSUE_TYPE_LABELS, SEVERITY_LABELS, STATUS_LABELS } from '@/lib/types'
import type { Profile, WaterReport } from '@/lib/types'

const PAGE_SIZE = 20

interface SearchParams {
  region?: string
  severity?: string
  status?: string
  issue_type?: string
  q?: string
  page?: string
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/admin')

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const page = parseInt(params.page ?? '1', 10)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let reportsQuery = supabase
    .from('water_reports')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.region) reportsQuery = reportsQuery.eq('region', params.region)
  if (params.severity) reportsQuery = reportsQuery.eq('severity', params.severity)
  if (params.status) reportsQuery = reportsQuery.eq('status', params.status)
  if (params.issue_type) reportsQuery = reportsQuery.eq('issue_type', params.issue_type)
  if (params.q) reportsQuery = reportsQuery.ilike('title', `%${params.q}%`)

  const [
    { data: reports, count: filteredCount },
    { count: total },
    { count: pending },
    { count: resolved },
    { count: users },
    { data: profiles },
  ] = await Promise.all([
    reportsQuery,
    supabase.from('water_reports').select('*', { count: 'exact', head: true }),
    supabase
      .from('water_reports')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'under_review']),
    supabase
      .from('water_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id, full_name, role, region, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const totalPages = Math.ceil((filteredCount ?? 0) / PAGE_SIZE)

  // Forces AdminStats/AdminReportSearch to remount (and drop stale client
  // state) whenever the filters, search, or page change.
  const filterKey = JSON.stringify(params)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Review and manage community water issue reports
          </p>
        </div>

        <Tabs defaultValue="reports">
          <TabsList className="mb-6">
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
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
              <AdminReportSearch key={filterKey} current={params.q} />
            </div>

            <AdminStats
              key={filterKey}
              initialTotal={total ?? 0}
              initialPending={pending ?? 0}
              initialResolved={resolved ?? 0}
              initialUsers={users ?? 0}
              reports={(reports ?? []) as WaterReport[]}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/admin?${new URLSearchParams(
                        Object.entries({ ...params, page: String(page - 1) }).filter(
                          ([, v]) => v !== undefined,
                        ) as [string, string][],
                      )}`}
                    >
                      Previous
                    </Link>
                  </Button>
                )}
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/admin?${new URLSearchParams(
                        Object.entries({ ...params, page: String(page + 1) }).filter(
                          ([, v]) => v !== undefined,
                        ) as [string, string][],
                      )}`}
                    >
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTable users={(profiles ?? []) as Profile[]} currentUserId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
