'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ReportsFiltersProps {
  regions: string[]
  issueTypeLabels: Record<string, string>
  severityLabels: Record<string, string>
  statusLabels: Record<string, string>
  current: {
    region?: string
    severity?: string
    status?: string
    issue_type?: string
  }
}

export function ReportsFilters({
  regions,
  issueTypeLabels,
  severityLabels,
  statusLabels,
  current,
}: ReportsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const hasFilters = current.region || current.severity || current.status || current.issue_type

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={current.region ?? 'all'}
        onValueChange={v => updateFilter('region', v)}
      >
        <SelectTrigger className="w-44 text-sm">
          <SelectValue placeholder="All regions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All regions</SelectItem>
          {regions.map(r => (
            <SelectItem key={r} value={r}>{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={current.issue_type ?? 'all'}
        onValueChange={v => updateFilter('issue_type', v)}
      >
        <SelectTrigger className="w-44 text-sm">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {Object.entries(issueTypeLabels).map(([val, label]) => (
            <SelectItem key={val} value={val}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={current.severity ?? 'all'}
        onValueChange={v => updateFilter('severity', v)}
      >
        <SelectTrigger className="w-36 text-sm">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All severity</SelectItem>
          {Object.entries(severityLabels).map(([val, label]) => (
            <SelectItem key={val} value={val}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={current.status ?? 'all'}
        onValueChange={v => updateFilter('status', v)}
      >
        <SelectTrigger className="w-40 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.entries(statusLabels).map(([val, label]) => (
            <SelectItem key={val} value={val}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname)}
          className="text-muted-foreground hover:text-foreground gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
