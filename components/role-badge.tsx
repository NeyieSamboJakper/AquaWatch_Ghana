import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'

const roleStyles: Record<UserRole, string> = {
  community: 'bg-slate-100 text-slate-700 border-slate-200',
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        roleStyles[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
