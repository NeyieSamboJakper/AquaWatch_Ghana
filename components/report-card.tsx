import Link from 'next/link'
import { MapPin, ThumbsUp, Clock, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SeverityBadge, StatusBadge, IssueTypeBadge, StaffReportBadge } from '@/components/severity-badge'
import type { WaterReport } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface ReportCardProps {
  report: WaterReport
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <Link href={`/reports/${report.id}`} className="block h-full">
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-border group h-full flex flex-col">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-foreground text-sm leading-5 h-10 line-clamp-2 group-hover:text-primary transition-colors">
              {report.title}
            </h3>
            <SeverityBadge severity={report.severity} />
          </div>

          <p className="text-sm text-muted-foreground leading-5 h-15 line-clamp-3 mb-3">
            {report.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3 min-h-6">
            <IssueTypeBadge issueType={report.issue_type} />
            <StatusBadge status={report.status} />
            {!report.is_anonymous && report.is_admin_report && <StaffReportBadge />}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground mt-auto pt-1">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center gap-1 min-w-0 shrink">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {report.region}{report.district ? `, ${report.district}` : ''}
                </span>
              </span>
              <span className="flex items-center gap-1 min-w-0 shrink">
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-27.5">
                  {report.is_anonymous
                    ? 'Anonymous'
                    : report.reporter?.full_name || 'Community member'}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {report.upvotes}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
