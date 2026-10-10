'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { WaterReport, WaterQualityMetric } from '@/lib/types'
import { ISSUE_TYPE_LABELS, SEVERITY_LABELS } from '@/lib/types'

// Dynamically import the actual map to prevent SSR issues with leaflet
const MapInner = dynamic(() => import('@/components/water-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] rounded-xl border border-border bg-muted flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading map...</span>
    </div>
  ),
})

interface WaterMapProps {
  reports: WaterReport[]
  metrics: WaterQualityMetric[]
}

export function WaterMap({ reports, metrics }: WaterMapProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const filtered = reports.filter(r => {
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false
    if (filterType !== 'all' && r.issue_type !== filterType) return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Map filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-40 text-sm">
            <SelectValue placeholder="All severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severity</SelectItem>
            {(Object.entries(SEVERITY_LABELS) as [string, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44 text-sm">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.entries(ISSUE_TYPE_LABELS) as [string, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground ml-auto">
          Showing {filtered.length} incident{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[
          { label: 'Low', color: '#22c55e' },
          { label: 'Medium', color: '#eab308' },
          { label: 'High', color: '#f97316' },
          { label: 'Critical', color: '#ef4444' },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block border-2 border-dashed border-slate-600 bg-slate-300" />
          Approximate (no GPS)
        </span>
      </div>

      <MapInner reports={filtered} metrics={metrics} />
    </div>
  )
}
