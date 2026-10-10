'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, Clock, Users } from 'lucide-react'
import { AdminReportsTable } from '@/components/admin-reports-table'
import type { WaterReport } from '@/lib/types'

interface AdminStatsProps {
  initialTotal: number
  initialPending: number
  initialResolved: number
  initialUsers: number
  reports: WaterReport[]
}

export function AdminStats({
  initialTotal,
  initialPending,
  initialResolved,
  initialUsers,
  reports,
}: AdminStatsProps) {
  const [total, setTotal] = useState(initialTotal)
  const [pending, setPending] = useState(initialPending)
  const [resolved, setResolved] = useState(initialResolved)

  const handleReportsChanged = useCallback(async () => {
    const supabase = createClient()
    const [
      { count: newTotal },
      { count: newPending },
      { count: newResolved },
    ] = await Promise.all([
      supabase.from('water_reports').select('*', { count: 'exact', head: true }),
      supabase
        .from('water_reports')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'under_review']),
      supabase
        .from('water_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved'),
    ])
    if (newTotal !== null) setTotal(newTotal)
    if (newPending !== null) setPending(newPending)
    if (newResolved !== null) setResolved(newResolved)
  }, [])

  const stats = [
    { label: 'Total Reports', value: total, icon: AlertTriangle, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Needs Review', value: pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Resolved', value: resolved, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Registered Users', value: initialUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  ]

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground font-medium">{label}</span>
                <div className={`p-1.5 rounded-md ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports table */}
      <AdminReportsTable reports={reports} onReportsChanged={handleReportsChanged} />
    </>
  )
}
