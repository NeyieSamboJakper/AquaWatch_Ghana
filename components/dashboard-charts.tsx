'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { BarChart3, PieChartIcon } from 'lucide-react'

interface SeverityCount { severity: string; count: number }
interface TypeCount { type: string; count: number }

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

const TYPE_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#64748b']

export function DashboardCharts() {
  const [severityData, setSeverityData] = useState<SeverityCount[]>([])
  const [typeData, setTypeData] = useState<TypeCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('water_reports')
        .select('severity, issue_type')

      if (data) {
        // Severity counts
        const severityMap: Record<string, number> = {}
        const typeMap: Record<string, number> = {}
        for (const row of data) {
          severityMap[row.severity] = (severityMap[row.severity] ?? 0) + 1
          typeMap[row.issue_type] = (typeMap[row.issue_type] ?? 0) + 1
        }
        setSeverityData(
          Object.entries(severityMap).map(([severity, count]) => ({ severity, count })),
        )
        setTypeData(
          Object.entries(typeMap)
            .map(([type, count]) => ({ type: type.charAt(0).toUpperCase() + type.slice(1), count }))
            .sort((a, b) => b.count - a.count),
        )
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
        {[0, 1].map(i => (
          <Card key={i} className="border-border animate-pulse">
            <CardContent className="h-64" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Severity bar chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Reports by Severity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={severityData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="severity"
                tick={{ fontSize: 12 }}
                tickFormatter={s => s.charAt(0).toUpperCase() + s.slice(1)}
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                formatter={(val) => [val, 'Reports']}
                labelFormatter={l => l.charAt(0).toUpperCase() + l.slice(1)}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {severityData.map(entry => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Type pie chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            Reports by Issue Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={typeData}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={70}
                paddingAngle={2}
              >
                {typeData.map((entry, index) => (
                  <Cell key={entry.type} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [val, 'Reports']} />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
