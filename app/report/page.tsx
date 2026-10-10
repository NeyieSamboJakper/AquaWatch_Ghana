import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar'
import { ReportForm } from '@/components/report-form'

export default async function ReportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/report')

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Report a Water Issue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Help your community by reporting water contamination, shortage, or infrastructure problems.
          </p>
        </div>
        <ReportForm userId={user.id} />
      </main>
    </div>
  )
}
