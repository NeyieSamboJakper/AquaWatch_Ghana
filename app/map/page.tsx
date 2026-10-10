import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/navbar'
import { WaterMap } from '@/components/water-map'
import type { WaterReport, WaterQualityMetric } from '@/lib/types'

export default async function MapPage() {
  const supabase = await createClient()

  const [{ data: reports }, { data: metrics }] = await Promise.all([
    supabase
      .from('water_reports')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('water_quality_metrics')
      .select('*')
      .eq('metric_type', 'quality_score'),
  ])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-3">
          <h1 className="text-2xl font-bold text-foreground">Water Quality Map</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Live incidents and quality scores across Ghana — click markers for details
          </p>
        </div>
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-8">
          <WaterMap
            reports={(reports ?? []) as WaterReport[]}
            metrics={(metrics ?? []) as WaterQualityMetric[]}
          />
        </div>
      </main>
    </div>
  )
}
