'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SeverityBadge, StatusBadge, IssueTypeBadge } from '@/components/severity-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, MapPin, Clock, CheckCircle2, CheckCheck, MessageSquarePlus, Trash2, Shield, BadgeCheck } from 'lucide-react'
import type { WaterReport, ReportStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { AdminResponseDialog } from '@/components/admin-response-dialog'

interface AdminReportsTableProps {
  reports: WaterReport[]
  onReportsChanged?: () => void
}

export function AdminReportsTable({ reports: initialReports, onReportsChanged }: AdminReportsTableProps) {
  const [reports, setReports] = useState<WaterReport[]>(initialReports)
  const [resolveTarget, setResolveTarget] = useState<WaterReport | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WaterReport | null>(null)
  const [responseTarget, setResponseTarget] = useState<WaterReport | null>(null)
  const [saving, setSaving] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function handleConfirmResolve() {
    if (!resolveTarget) return
    setSaving(true)
    const supabase = createClient()
    const now = new Date().toISOString()
    const updates = {
      status: 'resolved' as ReportStatus,
      resolved_at: now,
      updated_at: now,
    }

    const { error } = await supabase
      .from('water_reports')
      .update(updates)
      .eq('id', resolveTarget.id)

    if (!error) {
      // Ask the reporter to confirm the fix (they can also dispute it)
      if (resolveTarget.user_id) {
        await supabase.from('report_notifications').insert({
          user_id: resolveTarget.user_id,
          report_id: resolveTarget.id,
          message: `Your report "${resolveTarget.title}" was marked as resolved. Please confirm whether it's fixed.`,
        })
      }
      setReports(prev =>
        prev.map(r => (r.id === resolveTarget.id ? { ...r, ...updates, confirmed_at: null } : r)),
      )
      setSuccessId(resolveTarget.id)
      setTimeout(() => setSuccessId(null), 3000)
      startTransition(() => { onReportsChanged?.() })
    }
    setSaving(false)
    setResolveTarget(null)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('water_reports')
      .delete()
      .eq('id', deleteTarget.id)

    if (!error) {
      setReports(prev => prev.filter(r => r.id !== deleteTarget.id))
      startTransition(() => { onReportsChanged?.() })
    }
    setSaving(false)
    setDeleteTarget(null)
  }

  return (
    <>
      {/* Success banner */}
      {successId && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCheck className="w-4 h-4 shrink-0" />
          Report successfully resolved.
        </div>
      )}

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Severity</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Region</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Submitted</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map(r => (
                  <tr
                    key={r.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      r.status === 'resolved' ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/reports/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:underline"
                      >
                        {r.is_admin_report && (
                          <Shield className="w-3 h-3 text-purple-600 shrink-0" aria-label="Submitted by an admin" />
                        )}
                        <p className="font-medium text-foreground line-clamp-1 max-w-[200px]">{r.title}</p>
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{r.description}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <IssueTypeBadge issueType={r.issue_type} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <SeverityBadge severity={r.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={r.status} />
                        {r.status === 'resolved' && r.confirmed_at && (
                          <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-label="Confirmed by reporter" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <MapPin className="w-3 h-3" />
                        {r.region}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                          onClick={() => setResponseTarget(r)}
                          title="Send response"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                          <span className="sr-only">Respond</span>
                        </Button>
                        {r.status !== 'resolved' && r.status !== 'closed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-green-700 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-800"
                            onClick={() => setResolveTarget(r)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Resolve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(r)}
                          title="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resolve confirmation dialog */}
      <AlertDialog open={!!resolveTarget} onOpenChange={open => !open && setResolveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Resolve this report?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to mark &ldquo;
              <span className="font-medium text-foreground">{resolveTarget?.title}</span>
              &rdquo; as resolved? This will update the database and increase the resolved count.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmResolve}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yes, mark as resolved
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete this report?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete &ldquo;
              <span className="font-medium text-foreground">{deleteTarget?.title}</span>
              &rdquo;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={saving}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yes, delete report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Response dialog */}
      {responseTarget && (
        <AdminResponseDialog
          report={responseTarget}
          open={!!responseTarget}
          onOpenChange={open => !open && setResponseTarget(null)}
        />
      )}
    </>
  )
}
