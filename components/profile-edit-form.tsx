'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RoleBadge } from '@/components/role-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCheck, Loader2 } from 'lucide-react'
import { GHANA_REGIONS } from '@/lib/types'
import type { Profile } from '@/lib/types'

interface ProfileEditFormProps {
  profile: Profile
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [region, setRegion] = useState(profile.region ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, region })
      .eq('id', profile.id)

    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">My Profile</CardTitle>
        <RoleBadge role={profile.role} />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-md">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="region">Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region">
                <SelectValue placeholder="Select your region" />
              </SelectTrigger>
              <SelectContent>
                {GHANA_REGIONS.map(r => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {success && (
            <p className="flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-md">
              <CheckCheck className="w-4 h-4 shrink-0" />
              Profile updated.
            </p>
          )}

          <Button type="submit" disabled={saving} className="w-fit">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
