'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ThumbsUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpvoteButtonProps {
  reportId: string
  initialUpvotes: number
  hasUpvoted: boolean
}

export function UpvoteButton({ reportId, initialUpvotes, hasUpvoted: initialHasUpvoted }: UpvoteButtonProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (hasUpvoted) {
      const { error } = await supabase
        .from('report_upvotes')
        .delete()
        .match({ report_id: reportId, user_id: user.id })
      if (!error) {
        await supabase.rpc('decrement_report_upvotes', { p_report_id: reportId })
        setUpvotes(u => Math.max(u - 1, 0))
        setHasUpvoted(false)
      }
    } else {
      const { error } = await supabase
        .from('report_upvotes')
        .insert({ report_id: reportId, user_id: user.id })
      if (!error) {
        await supabase.rpc('increment_report_upvotes', { p_report_id: reportId })
        setUpvotes(u => u + 1)
        setHasUpvoted(true)
      }
    }
    setLoading(false)
  }

  return (
    <Button
      variant={hasUpvoted ? 'default' : 'outline'}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={cn('gap-1.5', hasUpvoted && 'bg-primary')}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <ThumbsUp className="w-3.5 h-3.5" />
      )}
      {hasUpvoted ? 'Upvoted' : 'Upvote'} · {upvotes}
    </Button>
  )
}
