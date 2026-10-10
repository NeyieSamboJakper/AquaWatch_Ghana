import { BadgeCheck, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Severity, ReportStatus, IssueType } from '@/lib/types'
import { SEVERITY_LABELS, STATUS_LABELS, ISSUE_TYPE_LABELS } from '@/lib/types'

const severityStyles: Record<Severity, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
}

const statusStyles: Record<ReportStatus, string> = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  under_review: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
}

const issueTypeStyles: Record<IssueType, string> = {
  contamination: 'bg-red-100 text-red-700 border-red-200',
  shortage: 'bg-orange-100 text-orange-700 border-orange-200',
  infrastructure: 'bg-blue-100 text-blue-700 border-blue-200',
  flooding: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  pollution: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  other: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        severityStyles[severity],
      )}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  )
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function IssueTypeBadge({ issueType }: { issueType: IssueType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        issueTypeStyles[issueType],
      )}
    >
      {ISSUE_TYPE_LABELS[issueType]}
    </span>
  )
}

export function ConfirmedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-200">
      <BadgeCheck className="w-3 h-3" />
      Confirmed by reporter
    </span>
  )
}

export function StaffReportBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-purple-100 text-purple-700 border-purple-200">
      <Shield className="w-3 h-3" />
      AquaWatch Staff
    </span>
  )
}
