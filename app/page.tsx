import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReportCard } from '@/components/report-card'
import {
  Droplets,
  AlertTriangle,
  MapPin,
  BarChart3,
  Shield,
  Users,
  ArrowRight,
  CheckCircle2,
  Waves,
} from 'lucide-react'
import type { WaterReport } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: recentReports } = await supabase
    .from('water_reports')
    .select('*, reporter:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(3)

  const { count: totalReports } = await supabase
    .from('water_reports')
    .select('*', { count: 'exact', head: true })

  const { count: resolvedReports } = await supabase
    .from('water_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'resolved')

  const { count: criticalReports } = await supabase
    .from('water_reports')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'critical')

  const stats = [
    { label: 'Reports Submitted', value: totalReports ?? 0, icon: AlertTriangle },
    { label: 'Issues Resolved', value: resolvedReports ?? 0, icon: CheckCircle2 },
    { label: 'Critical Alerts', value: criticalReports ?? 0, icon: Shield },
    { label: 'Regions Covered', value: 16, icon: MapPin },
  ]

  const features = [
    {
      icon: AlertTriangle,
      title: 'Report Water Issues',
      description:
        'Submit contamination, shortage, or infrastructure reports from your community with photos and precise location data.',
    },
    {
      icon: MapPin,
      title: 'Interactive Map',
      description:
        'Visualise water quality incidents across all 16 regions of Ghana on a live, filterable map.',
    },
    {
      icon: BarChart3,
      title: 'Quality Analytics',
      description:
        'Track water quality scores, access rates, and trends across regions with detailed data dashboards.',
    },
    {
      icon: Shield,
      title: 'Government & NGO Tools',
      description:
        'Admin workflows to review, prioritise and resolve community-reported water issues efficiently.',
    },
    {
      icon: Users,
      title: 'Community Upvoting',
      description:
        'Residents can upvote critical issues, helping authorities focus on the most-impacted communities first.',
    },
    {
      icon: Waves,
      title: 'Real-time Monitoring',
      description:
        'Water quality metrics updated continuously from monitoring stations across the country.',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-white" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-primary-foreground text-sm px-4 py-1.5 rounded-full mb-6 font-medium">
            <Droplets className="w-4 h-4" />
            Ghana&apos;s Water Quality Monitoring Platform
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground text-balance mb-6 leading-tight">
            Clean Water for Every<br className="hidden sm:block" /> Ghanaian Community
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8 leading-relaxed text-pretty">
            AquaWatch Ghana empowers citizens, NGOs, and government agencies to report water
            quality issues, track contamination, and coordinate rapid responses across all 16 regions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="secondary" asChild className="font-semibold">
              <Link href="/report">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report an Issue
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="bg-white/15 hover:bg-white/25 text-primary-foreground border border-white/30 font-semibold"
            >
              <Link href="/map">
                <MapPin className="w-4 h-4 mr-2" />
                View Water Map
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance">
            Everything you need to protect water access
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-pretty leading-relaxed">
            A unified platform connecting communities, government agencies, and NGOs around Ghana&apos;s water security challenge.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Reports */}
      {recentReports && recentReports.length > 0 && (
        <section className="bg-muted/50 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Recent Reports</h2>
                <p className="text-muted-foreground text-sm mt-1">Latest water issues reported by communities</p>
              </div>
              <Button variant="outline" asChild size="sm">
                <Link href="/reports">
                  View all
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(recentReports as WaterReport[]).map(report => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-primary rounded-2xl p-10 md:p-14">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3 text-balance">
            Help protect Ghana&apos;s water for everyone
          </h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto mb-7 text-pretty leading-relaxed">
            Join thousands of Ghanaians reporting water issues, tracking quality, and holding utilities accountable.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="secondary" asChild className="font-semibold">
              <Link href="/auth/sign-up">
                Create free account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" asChild className="bg-white/15 hover:bg-white/25 text-primary-foreground border border-white/30 font-semibold">
              <Link href="/dashboard">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary">
              <Droplets className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">AquaWatch Ghana</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Monitoring water quality across all 16 regions of Ghana
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/map" className="hover:text-foreground transition-colors">Map</Link>
            <Link href="/reports" className="hover:text-foreground transition-colors">Reports</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
