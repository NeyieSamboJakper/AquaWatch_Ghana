'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import Link from 'next/link'
import type { WaterReport, WaterQualityMetric } from '@/lib/types'
import { ISSUE_TYPE_LABELS, SEVERITY_LABELS, STATUS_LABELS, REGION_CENTERS } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import 'leaflet/dist/leaflet.css'

interface MapInnerProps {
  reports: WaterReport[]
  metrics: WaterQualityMetric[]
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

// Reports without GPS fall back to their region's centre, nudged by a small
// offset derived from the report id so several such reports don't stack on
// exactly the same point.
function getReportPosition(
  report: WaterReport,
): { center: [number, number]; approximate: boolean } | null {
  if (report.latitude != null && report.longitude != null) {
    return { center: [report.latitude, report.longitude], approximate: false }
  }
  const regionCenter = REGION_CENTERS[report.region]
  if (!regionCenter) return null

  let hash = 0
  for (const ch of report.id) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  const angle = ((hash >>> 0) % 360) * (Math.PI / 180)
  const distance = 0.05 + (((hash >>> 8) % 100) / 100) * 0.15
  return {
    center: [regionCenter[0] + Math.sin(angle) * distance, regionCenter[1] + Math.cos(angle) * distance],
    approximate: true,
  }
}

export default function MapInner({ reports, metrics }: MapInnerProps) {
  useEffect(() => {
    // Fix leaflet default icon issue with webpack
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet')
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })
  }, [])

  return (
    <MapContainer
      center={[7.9465, -1.0232]}
      zoom={7}
      style={{ height: '520px', width: '100%', borderRadius: '0.75rem' }}
      className="border border-border shadow-sm z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {reports.map(report => {
        const position = getReportPosition(report)
        if (!position) return null
        const { center, approximate } = position
        const color = SEVERITY_COLORS[report.severity] ?? '#94a3b8'
        const radius = report.severity === 'critical' ? 14 : report.severity === 'high' ? 11 : 8

        return (
          <CircleMarker
            key={report.id}
            center={center}
            radius={radius}
            pathOptions={{
              fillColor: color,
              fillOpacity: approximate ? 0.6 : 0.85,
              color: approximate ? '#475569' : '#fff',
              weight: 2,
              dashArray: approximate ? '3 3' : undefined,
            }}
          >
            <Popup maxWidth={280}>
              <div className="text-sm">
                <p className="font-semibold text-gray-900 mb-1 leading-snug">{report.title}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: color }}
                  >
                    {SEVERITY_LABELS[report.severity]}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {ISSUE_TYPE_LABELS[report.issue_type]}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {STATUS_LABELS[report.status]}
                  </span>
                </div>
                <p className="text-gray-600 text-xs mb-2 line-clamp-3">{report.description}</p>
                <p className="text-gray-400 text-xs mb-2">
                  {report.region}{report.community ? ` · ${report.community}` : ''} ·{' '}
                  {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                </p>
                {approximate && (
                  <p className="text-gray-500 text-xs italic mb-2">
                    Approximate location — no GPS provided, shown near the region centre
                  </p>
                )}
                <a
                  href={`/reports/${report.id}`}
                  className="text-blue-600 text-xs font-medium hover:underline"
                >
                  View full report →
                </a>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
