import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar'
import { ProfileEditForm } from '@/components/profile-edit-form'
import { ReportCard } from '@/components/report-card'
import { Droplets } from 'lucide-react'
import type { Profile, WaterReport } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/profile')

  const [{ data: profile }, { data: myReports }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('water_reports')
      .select('*, reporter:profiles(full_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (!profile) redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your account details and view your report history
          </p>
        </div>

        <div className="mb-8">
          <ProfileEditForm profile={profile as Profile} />
        </div>

        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Droplets className="w-4 h-4 text-primary" />
            My Reports
          </h2>
          {myReports && myReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(myReports as WaterReport[]).map(r => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t submitted any reports yet.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
