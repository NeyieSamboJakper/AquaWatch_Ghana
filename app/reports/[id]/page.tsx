import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/navbar'
import { SeverityBadge, StatusBadge, IssueTypeBadge, StaffReportBadge, ConfirmedBadge } from '@/components/severity-badge'
import { ResolutionConfirmation } from '@/components/resolution-confirmation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MapPin, Calendar, User, ThumbsUp, ArrowLeft, Shield, Bell, CheckCircle2, BadgeCheck, RotateCcw } from 'lucide-react'
import type { WaterReport, AdminResponse, ReportConfirmation } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'
import { UpvoteButton } from '@/components/upvote-button'
import { STATUS_LABELS } from '@/lib/types'

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: report } = await supabase
    .from('water_reports')
    .select('*, reporter:profiles(full_name)')
    .eq('id', id)
    .single()

  if (!report) notFound()

  const r = report as WaterReport

  // Fetch admin responses
  const { data: responses } = await supabase
    .from('admin_responses')
    .select('id, report_id, admin_id, message, status_update, created_at, admin:profiles(full_name)')
    .eq('report_id', id)
    .order('created_at', { ascending: true })

  const adminResponses = (responses || []) as AdminResponse[]

  // Reporter's confirm/dispute history for this report's resolutions
  const { data: confirmationRows } = await supabase
    .from('report_confirmations')
    .select('*')
    .eq('report_id', id)
    .order('created_at', { ascending: true })

  const confirmations = (confirmationRows || []) as ReportConfirmation[]
  const isReporter = !!user && user.id === r.user_id
  const awaitingConfirmation = isReporter && r.status === 'resolved' && !r.confirmed_at

  // Fetch user notifications for this report
  let userNotifications = null
  if (user) {
    const { data: notifs } = await supabase
      .from('report_notifications')
      .select('*')
      .eq('report_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    userNotifications = notifs
  }

  // Check if user has upvoted
  let hasUpvoted = false
  if (user) {
    const { data: upvote } = await supabase
      .from('report_upvotes')
      .select('id')
      .eq('report_id', id)
      .eq('user_id', user.id)
      .single()
    hasUpvoted = !!upvote
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 text-muted-foreground">
          <Link href="/reports">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to reports
          </Link>
        </Button>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start gap-2 mb-2">
              <IssueTypeBadge issueType={r.issue_type} />
              <SeverityBadge severity={r.severity} />
              <StatusBadge status={r.status} />
              {r.status === 'resolved' && r.confirmed_at && <ConfirmedBadge />}
              {!r.is_anonymous && r.is_admin_report && <StaffReportBadge />}
            </div>
            <CardTitle className="text-xl font-bold text-foreground leading-snug">
              {r.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {r.region}
                {r.district && `, ${r.district}`}
                {r.community && ` — ${r.community}`}
              </span>
              <span className="flex items-center gap-1.5 min-w-0">
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-50">
                  {r.is_anonymous ? 'Anonymous reporter' : r.reporter?.full_name || 'Community member'}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(r.created_at), 'dd MMM yyyy')}
                {' '}({formatDistanceToNow(new Date(r.created_at), { addSuffix: true })})
              </span>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-semibold text-foreground mb-2">Description</h2>
              <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
                {r.description}
              </p>
            </div>

            {/* Photo */}
            {r.image_url && (
              <div>
                <h2 className="font-semibold text-foreground mb-2">Photo</h2>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.image_url}
                  alt={r.title}
                  className="w-full max-h-96 object-cover rounded-lg border border-border"
                />
              </div>
            )}

            {/* Coordinates */}
            {r.latitude && r.longitude && (
              <div>
                <h2 className="font-semibold text-foreground mb-2">Location</h2>
                <p className="text-sm text-muted-foreground">
                  GPS: {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                </p>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}&zoom=15`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-1 inline-block"
                >
                  View on OpenStreetMap
                </a>
              </div>
            )}

            {/* Notification banner */}
            {userNotifications && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 mt-0.5 shrink-0">
                  <Bell className="w-3 h-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">{userNotifications.message}</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {format(new Date(userNotifications.created_at), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              </div>
            )}

            {/* Admin responses thread */}
            {adminResponses.length > 0 && (
              <div>
                <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Official Responses ({adminResponses.length})
                </h2>
                <div className="space-y-3">
                  {adminResponses.map(response => (
                    <div key={response.id} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-primary flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" />
                          {response.admin?.full_name || 'AquaWatch Admin'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(response.created_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line wrap-break-word mb-2">
                        {response.message}
                      </p>
                      {response.status_update && (
                        <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                          <span className="text-xs text-muted-foreground">Status updated to:</span>
                          <StatusBadge status={response.status_update} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reporter confirmation history */}
            {confirmations.length > 0 && (
              <div>
                <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" />
                  Reporter Feedback
                </h2>
                <div className="space-y-3">
                  {confirmations.map(c => (
                    <div
                      key={c.id}
                      className={`rounded-lg border p-4 ${
                        c.confirmed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-sm font-semibold flex items-center gap-1.5 ${
                            c.confirmed ? 'text-emerald-800' : 'text-amber-800'
                          }`}
                        >
                          {c.confirmed ? (
                            <>
                              <BadgeCheck className="w-4 h-4" />
                              Reporter confirmed the issue is resolved
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4" />
                              Reporter says it&apos;s still a problem — reopened
                            </>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(c.created_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                      </div>
                      {c.note && (
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line wrap-break-word mt-1">
                          {c.note}
                        </p>
                      )}
                      {c.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.image_url}
                          alt={c.confirmed ? 'Photo confirming the fix' : 'Photo showing the remaining problem'}
                          className="mt-3 w-full max-h-72 object-cover rounded-lg border border-border"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reporter's confirm/dispute prompt */}
            {awaitingConfirmation && user && <ResolutionConfirmation reportId={r.id} userId={user.id} />}

            {/* Upvote */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ThumbsUp className="w-4 h-4" />
                <span>{r.upvotes} {r.upvotes === 1 ? 'person' : 'people'} found this important</span>
              </div>
              {user ? (
                <UpvoteButton reportId={r.id} initialUpvotes={r.upvotes} hasUpvoted={hasUpvoted} />
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/auth/login">Sign in to upvote</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
