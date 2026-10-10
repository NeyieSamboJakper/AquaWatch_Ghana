'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle2, ImagePlus, Loader2, ThumbsDown, X } from 'lucide-react'

const MAX_NOTE_LENGTH = 500
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB

interface ResolutionConfirmationProps {
  reportId: string
  userId: string
}

// Shown to the reporter once an admin marks their report resolved — the
// "confirm received" step: confirm the fix, or say it's still a problem.
export function ResolutionConfirmation({ reportId, userId }: ResolutionConfirmationProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'confirm' | 'dispute' | null>(null)
  const [note, setNote] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDispute = mode === 'dispute'
  const noteRequiredMissing = isDispute && !note.trim()

  function openDialog(next: 'confirm' | 'dispute') {
    setMode(next)
    setNote('')
    clearImage()
    setError(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be smaller than 5MB.')
      return
    }
    setError(null)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit() {
    if (!mode || noteRequiredMissing) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    let imageUrl: string | null = null

    if (imageFile) {
      const path = `${userId}/confirmation-${Date.now()}-${imageFile.name}`
      const { error: uploadError } = await supabase.storage.from('report-images').upload(path, imageFile)
      if (uploadError) {
        setError(`Failed to upload photo: ${uploadError.message}`)
        setSubmitting(false)
        return
      }
      imageUrl = supabase.storage.from('report-images').getPublicUrl(path).data.publicUrl
    }

    const { error: rpcError } = await supabase.rpc('confirm_report_resolution', {
      p_report_id: reportId,
      p_confirmed: !isDispute,
      p_note: note.trim() || null,
      p_image_url: imageUrl,
    })

    if (rpcError) {
      setError(rpcError.message)
      setSubmitting(false)
      return
    }

    toast.success(
      isDispute
        ? 'Thanks — the report has been reopened for review.'
        : 'Thanks for confirming the issue is resolved.',
    )
    setSubmitting(false)
    setMode(null)
    router.refresh()
  }

  return (
    <>
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-900">This report has been marked as resolved</p>
        <p className="text-sm text-green-800 mt-0.5">
          Is the water issue actually fixed? Your confirmation helps authorities close the loop.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white" onClick={() => openDialog('confirm')}>
            <CheckCircle2 className="w-4 h-4" />
            Yes, it&apos;s fixed
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openDialog('dispute')}>
            <ThumbsDown className="w-4 h-4" />
            No, still a problem
          </Button>
        </div>
      </div>

      <Dialog open={mode !== null} onOpenChange={open => !open && !submitting && setMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isDispute ? 'Report still a problem' : 'Confirm resolution'}</DialogTitle>
            <DialogDescription>
              {isDispute
                ? 'Tell the team what is still wrong. The report will be reopened for review.'
                : 'Optionally add a note or a photo showing the issue has been fixed.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmation-note">
                {isDispute ? (
                  <>What&apos;s still wrong? <span className="text-destructive">*</span></>
                ) : (
                  <>Note <span className="text-muted-foreground text-xs font-normal">(optional)</span></>
                )}
              </Label>
              <Textarea
                id="confirmation-note"
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={MAX_NOTE_LENGTH}
                rows={3}
                placeholder={
                  isDispute
                    ? 'e.g. The borehole was repaired but the water is still brown.'
                    : 'e.g. Water supply restored on Monday, flowing normally.'
                }
                className="resize-none text-sm max-h-40 overflow-y-auto wrap-break-word"
              />
              <p className="text-xs text-right text-muted-foreground">
                {note.length} / {MAX_NOTE_LENGTH}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Photo <span className="text-muted-foreground text-xs font-normal">(optional, max 5MB)</span>
              </Label>
              {imagePreview ? (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Selected confirmation photo"
                    className="h-28 w-28 rounded-lg object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm"
                    aria-label="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-1.5 h-28 w-28 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-xs">Add photo</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMode(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || noteRequiredMissing}
                className={isDispute ? undefined : 'bg-green-600 hover:bg-green-700 text-white'}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isDispute ? 'Reopen report' : 'Confirm resolved'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
