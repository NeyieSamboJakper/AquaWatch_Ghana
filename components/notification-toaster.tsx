'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export function NotificationToaster() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function checkNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: notifications } = await supabase
        .from('report_notifications')
        .select('id, report_id, message')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: true })

      if (!notifications || notifications.length === 0 || cancelled) return

      for (const n of notifications) {
        toast.info(n.message, {
          action: {
            label: 'View',
            onClick: () => router.push(`/reports/${n.report_id}`),
          },
        })
      }

      await supabase
        .from('report_notifications')
        .update({ is_read: true })
        .in(
          'id',
          notifications.map(n => n.id),
        )
    }

    checkNotifications()

    // The root layout doesn't remount on client-side sign-out/sign-in, so a
    // mount-only check would miss any login that happens without a full page
    // reload — re-check whenever auth state actually changes to a signed-in user.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN') checkNotifications()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
