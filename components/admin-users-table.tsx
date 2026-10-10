'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RoleBadge } from '@/components/role-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { Loader2, CheckCheck, MapPin, Clock } from 'lucide-react'
import type { Profile, UserRole } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface AdminUsersTableProps {
  users: Profile[]
  currentUserId: string
}

const roleOrder: UserRole[] = ['community', 'admin']

export function AdminUsersTable({ users: initialUsers, currentUserId }: AdminUsersTableProps) {
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [pendingChange, setPendingChange] = useState<{ profile: Profile; newRole: UserRole } | null>(null)
  const [saving, setSaving] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)

  async function handleConfirmChange() {
    if (!pendingChange) return
    setSaving(true)
    const supabase = createClient()
    const { profile, newRole } = pendingChange

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profile.id)

    if (!error) {
      setUsers(prev => prev.map(u => (u.id === profile.id ? { ...u, role: newRole } : u)))
      setSuccessId(profile.id)
      setTimeout(() => setSuccessId(null), 3000)
    }
    setSaving(false)
    setPendingChange(null)
  }

  return (
    <>
      {successId && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCheck className="w-4 h-4 shrink-0" />
          Role updated successfully.
        </div>
      )}

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Region</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{u.full_name ?? 'Unnamed user'}</p>
                      {u.id === currentUserId && (
                        <p className="text-xs text-muted-foreground">This is you</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <MapPin className="w-3 h-3" />
                        {u.region ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.id === currentUserId ? (
                        <RoleBadge role={u.role} />
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={v => setPendingChange({ profile: u, newRole: v as UserRole })}
                        >
                          <SelectTrigger className="h-8 w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOrder.map(r => (
                              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingChange} onOpenChange={open => !open && setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change this user&apos;s role?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Set <span className="font-medium text-foreground">{pendingChange?.profile.full_name ?? 'this user'}</span>&apos;s
              role to <span className="font-medium text-foreground">{pendingChange && ROLE_LABELS[pendingChange.newRole]}</span>?
              This changes what they can access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yes, change role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
