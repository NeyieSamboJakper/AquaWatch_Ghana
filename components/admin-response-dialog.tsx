'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge, SeverityBadge } from '@/components/severity-badge'
import { Loader2, Shield, SendHorizonal, MapPin } from 'lucide-react'
import type { WaterReport, AdminResponse, ReportStatus } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'
import { format } from 'date-fns'

// Keeps official replies concise; also enforced in the DB (013_admin_response_length.sql)
const MAX_RESPONSE_LENGTH = 1000

interface AdminResponseDialogProps {
  report: WaterReport | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChanged?: (reportId: string, newStatus: ReportStatus) => void
}

export function AdminResponseDialog({
  report,
  open,
  onOpenChange,
  onStatusChanged,
}: AdminResponseDialogProps) {
  const [responses, setResponses] = useState<AdminResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [statusUpdate, setStatusUpdate] = useState<ReportStatus | 'no_change'>('no_change')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  // Fetch existing responses when dialog opens
  useEffect(() => {
    if (!open || !report) return
    setLoading(true)
    setError(null)
    const supabase = createClient()

    supabase
      .from('admin_responses')
      .select('*, admin:profiles(full_name)')
      .eq('report_id', report.id)
      .order('created_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) setError('Failed to load responses.')
        else setResponses((data as AdminResponse[]) ?? [])
        setLoading(false)
      })
  }, [open, report])

  // Scroll to bottom of thread when responses load
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [responses])

  async function handleSend() {
    if (!report || !message.trim()) return
    setSending(true)
    setError(null)
    setSuccessMsg(null)

    const supabase = createClient()

    // 1. Get current admin user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in as an admin.')
      setSending(false)
      return
    }

    // 2. Insert the admin response
    const { data: newResponse, error: insertErr } = await supabase
      .from('admin_responses')
      .insert({
        report_id: report.id,
        admin_id: user.id,
        message: message.trim(),
        status_update: statusUpdate === 'no_change' ? null : statusUpdate,
      })
      .select('*, admin:profiles(full_name)')
      .single()

    if (insertErr || !newResponse) {
      setError('Failed to send response. Make sure you have admin privileges.')
      setSending(false)
      return
    }

    // 3. Update the report status if changed
    if (statusUpdate !== 'no_change') {
      const updates: Record<string, unknown> = {
        status: statusUpdate,
        updated_at: new Date().toISOString(),
      }
      if (statusUpdate === 'resolved') {
        updates.resolved_at = new Date().toISOString()
      }
      await supabase.from('water_reports').update(updates).eq('id', report.id)
      onStatusChanged?.(report.id, statusUpdate)
    }

    // 4. Create a notification for the report owner (if not anonymous)
    if (report.user_id) {
      await supabase.from('report_notifications').insert({
        user_id: report.user_id,
        report_id: report.id,
        response_id: newResponse.id,
        message:
          statusUpdate === 'resolved'
            ? `Your report "${report.title}" was marked as resolved. Please confirm whether it's fixed.`
            : 'An admin has responded to your water report.',
      })
    }

    // 5. Update local state
    setResponses(prev => [...prev, newResponse as AdminResponse])
    setMessage('')
    setStatusUpdate('no_change')
    setSuccessMsg('Response sent successfully.')
    setTimeout(() => setSuccessMsg(null), 3000)
    setSending(false)
  }

  const statusOptions: ReportStatus[] = ['pending', 'under_review', 'in_progress', 'resolved', 'closed']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-primary" />
            Official Response
          </DialogTitle>
          {report && (
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                {report.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {report.region}
                  {report.district ? `, ${report.district}` : ''}
                </span>
                <SeverityBadge severity={report.severity} />
                <StatusBadge status={report.status} />
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Thread */}
        <div
          ref={threadRef}
          className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 min-h-24 max-h-80"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading responses...
            </div>
          ) : responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm text-center">
              <Shield className="w-8 h-8 mb-2 opacity-30" />
              <p>No official responses yet.</p>
              <p className="text-xs mt-0.5">Send the first response below.</p>
            </div>
          ) : (
            responses.map(resp => (
              <div
                key={resp.id}
                className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Shield className="w-3 h-3" />
                    {resp.admin?.full_name ?? 'AquaWatch Admin'}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(resp.created_at), 'dd MMM yyyy, HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line wrap-break-word">
                  {resp.message}
                </p>
                {resp.status_update && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground">Status updated to</span>
                    <StatusBadge status={resp.status_update} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Compose area */}
        <div className="px-6 pb-6 pt-4 border-t border-border shrink-0 flex flex-col gap-3">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {successMsg && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {successMsg}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="response-message" className="text-sm font-medium">
              Message <span className="text-red-500">*</span>
            </Label>
            {/* Capped height — the textarea auto-grows, so long replies scroll inside it instead of stretching the dialog */}
            <Textarea
              id="response-message"
              placeholder="Write your official response to this report..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={MAX_RESPONSE_LENGTH}
              rows={3}
              className="resize-none text-sm max-h-40 overflow-y-auto wrap-break-word"
              aria-describedby="response-message-count"
            />
            <p
              id="response-message-count"
              className={`text-xs text-right ${
                message.length >= MAX_RESPONSE_LENGTH
                  ? 'text-red-600'
                  : message.length >= MAX_RESPONSE_LENGTH * 0.9
                    ? 'text-amber-600'
                    : 'text-muted-foreground'
              }`}
            >
              {message.length} / {MAX_RESPONSE_LENGTH}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Update status (optional)</Label>
            <Select
              value={statusUpdate}
              onValueChange={v => setStatusUpdate(v as ReportStatus | 'no_change')}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Keep current status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">Keep current status</SelectItem>
                {statusOptions.map(s => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleSend}
            disabled={sending || !message.trim()}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SendHorizonal className="w-4 h-4" />
            )}
            {sending ? 'Sending...' : 'Send Response'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
