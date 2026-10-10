'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Loader2, CheckCircle2, AlertTriangle, ImagePlus, X } from 'lucide-react'
import { LocationPicker } from '@/components/location-picker'
import type { LatLng } from '@/components/location-picker-inner'
import { toast } from 'sonner'
import {
  GHANA_REGIONS,
  ISSUE_TYPE_LABELS,
  SEVERITY_LABELS,
  type IssueType,
  type Severity,
} from '@/lib/types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB

interface ReportFormProps {
  userId: string
}

export function ReportForm({ userId }: ReportFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [issueType, setIssueType] = useState<IssueType | ''>('')
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [region, setRegion] = useState('')
  const [district, setDistrict] = useState('')
  const [community, setCommunity] = useState('')
  const [location, setLocation] = useState<LatLng | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!issueType || !severity || !region) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    let imageUrl: string | null = null

    if (imageFile) {
      const path = `${userId}/${Date.now()}-${imageFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('report-images')
        .upload(path, imageFile)

      if (uploadError) {
        setError(`Failed to upload photo: ${uploadError.message}`)
        setLoading(false)
        return
      }

      imageUrl = supabase.storage.from('report-images').getPublicUrl(path).data.publicUrl
    }

    const { error: insertError } = await supabase.from('water_reports').insert({
      user_id: userId,
      title,
      description,
      issue_type: issueType,
      severity,
      region,
      district: district || null,
      community: community || null,
      latitude: location?.lat ?? null,
      longitude: location?.lng ?? null,
      is_anonymous: isAnonymous,
      image_url: imageUrl,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      toast.success('Report submitted successfully.')
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <Card className="border-border">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-green-100">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Report Submitted!</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
            Your water issue report has been received. Authorities and NGOs will review it shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => router.push('/reports')}>
              View All Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Issue Title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              placeholder="e.g. Contaminated borehole in Tamale Central"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
            <Textarea
              id="description"
              placeholder="Describe the water issue in detail — what you see, smell, when it started, how many people are affected..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Issue Type + Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Issue Type <span className="text-destructive">*</span></Label>
              <Select value={issueType} onValueChange={v => setIssueType(v as IssueType)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ISSUE_TYPE_LABELS) as [IssueType, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Severity <span className="text-destructive">*</span></Label>
              <Select value={severity} onValueChange={v => setSeverity(v as Severity)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(SEVERITY_LABELS) as [Severity, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Region + District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Region <span className="text-destructive">*</span></Label>
              <Select value={region} onValueChange={setRegion} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {GHANA_REGIONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                placeholder="e.g. Kumasi Metro"
                value={district}
                onChange={e => setDistrict(e.target.value)}
              />
            </div>
          </div>

          {/* Community */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="community">Community / Neighbourhood</Label>
            <Input
              id="community"
              placeholder="e.g. Nima, Asafo, Vittin"
              value={community}
              onChange={e => setCommunity(e.target.value)}
            />
          </div>

          {/* Location pin */}
          <div className="flex flex-col gap-1.5">
            <Label>Exact Location <span className="text-muted-foreground text-xs font-normal">(optional — helps responders find it)</span></Label>
            <LocationPicker value={location} onChange={setLocation} region={region} />
          </div>

          {/* Photo */}
          <div className="flex flex-col gap-1.5">
            <Label>Photo <span className="text-muted-foreground text-xs font-normal">(optional, max 5MB)</span></Label>
            {imagePreview ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Selected report photo"
                  className="h-32 w-32 rounded-lg object-cover border border-border"
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
                className="flex flex-col items-center justify-center gap-1.5 h-32 w-32 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
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

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Submit anonymously</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your name will not be shown with this report
              </p>
            </div>
            <Switch
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
              aria-label="Submit anonymously"
            />
          </div>

          {/* Severity warning */}
          {severity === 'critical' && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">
                Critical severity will immediately flag this report for priority review by authorities.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !issueType || !severity || !region}
            className="w-full"
            size="lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Report
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
