import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar'
import { ReportCard } from '@/components/report-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Droplets,
} from 'lucide-react'
import type { WaterReport, WaterQualityMetric } from '@/lib/types'
import { DashboardCharts } from '@/components/dashboard-charts'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/dashboard')

  // Fetch stats in parallel
  const [
    { count: totalReports },
    { count: pendingReports },
    { count: resolvedReports },
    { count: criticalReports },
    { data: recentReports },
    { data: metrics },
    { data: myReports },
  ] = await Promise.all([
    supabase.from('water_reports').select('*', { count: 'exact', head: true }),
    supabase
      .from('water_reports')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'under_review']),
    supabase
      .from('water_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved'),
    supabase
      .from('water_reports')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'critical'),
    supabase
      .from('water_reports')
      .select('*, reporter:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('water_quality_metrics')
      .select('*')
      .eq('metric_type', 'quality_score')
      .order('value', { ascending: false }),
    supabase
      .from('water_reports')
      .select('*, reporter:profiles(full_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const statCards = [
    {
      label: 'Total Reports',
      value: totalReports ?? 0,
      icon: BarChart3,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Pending Review',
      value: pendingReports ?? 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      label: 'Resolved',
      value: resolvedReports ?? 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Critical Alerts',
      value: criticalReports ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Water quality overview across Ghana
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/report">
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              Report Issue
            </Link>
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground font-medium">{label}</span>
                  <div className={`p-1.5 rounded-md ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts + Top Quality Regions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <DashboardCharts />
          </div>

          {/* Top regions by quality */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Quality by Region
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {(metrics as WaterQualityMetric[] | null)?.slice(0, 8).map(m => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-foreground font-medium truncate max-w-[120px]">
                        {m.region}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${m.value}%`,
                            backgroundColor:
                              m.value >= 65
                                ? 'oklch(0.55 0.15 155)'
                                : m.value >= 50
                                  ? 'oklch(0.72 0.18 80)'
                                  : 'oklch(0.68 0.2 40)',
                          }}
                        />
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          m.value >= 65
                            ? 'text-green-600'
                            : m.value >= 50
                              ? 'text-yellow-600'
                              : 'text-orange-600'
                        }`}
                      >
                        {m.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border">
                <Button variant="ghost" size="sm" asChild className="w-full justify-between text-muted-foreground">
                  <Link href="/map">
                    View full map
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Reports */}
        {myReports && myReports.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                My Reports
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/reports?mine=true">View all</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(myReports as WaterReport[]).map(r => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Reports */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Community Reports
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reports">
                View all
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(recentReports as WaterReport[] | null)?.map(r => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
