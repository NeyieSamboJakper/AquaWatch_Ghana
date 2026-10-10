'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react'
import { REGION_CENTERS } from '@/lib/types'
import type { LatLng, MapFocus } from '@/components/location-picker-inner'

// Leaflet touches `window`, so the map itself must not render on the server
const PickerMap = dynamic(() => import('@/components/location-picker-inner'), {
  ssr: false,
  loading: () => (
    <div className="h-70 rounded-lg border border-border bg-muted flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading map...</span>
    </div>
  ),
})

interface SearchResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

// Accuracy thresholds (metres) for a device location fix
const GOOD_ACCURACY_M = 50 // stop waiting once we have a fix this precise
const ROUGH_ACCURACY_M = 500 // above this, warn the user it's only an estimate
const LOCATE_TIMEOUT_MS = 12000

function zoomForAccuracy(acc: number) {
  if (acc <= 100) return 17
  if (acc <= 500) return 15
  if (acc <= 2000) return 13
  if (acc <= 10000) return 11
  return 9
}

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km` : `${Math.round(m)} m`
}

interface LocationPickerProps {
  value: LatLng | null
  onChange: (value: LatLng | null) => void
  // Selected region, used to centre the map before a pin is placed
  region?: string
}

export function LocationPicker({ value, onChange, region }: LocationPickerProps) {
  const [focus, setFocus] = useState<MapFocus | null>(null)
  const [locating, setLocating] = useState(false)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  // Jump to the chosen region so the user doesn't have to pan across Ghana
  useEffect(() => {
    if (value || !region) return
    const center = REGION_CENTERS[region]
    if (center) setFocus({ center, zoom: 9 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region])

  function placePin(lat: number, lng: number, zoom = 16) {
    onChange({ lat, lng })
    setAccuracy(null)
    setWarning(null)
    setFocus({ center: [lat, lng], zoom })
  }

  // Manual taps/drags are exact, so drop any GPS accuracy circle and warning
  function handleMapChange(v: LatLng) {
    onChange(v)
    setAccuracy(null)
    setWarning(null)
  }

  // Watches the position briefly and keeps the most accurate fix. Laptops
  // without GPS often return a coarse network/IP-based fix first (or only),
  // so we report the accuracy and ask the user to adjust when it's rough.
  function locateMe() {
    if (!('geolocation' in navigator)) {
      setMessage('Location is not supported on this device — tap the map instead.')
      return
    }
    setLocating(true)
    setMessage(null)
    setWarning(null)

    let best: GeolocationPosition | null = null
    let watchId: number | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let done = false

    function finish() {
      if (done) return
      done = true
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      if (timer) clearTimeout(timer)
      setLocating(false)
      if (!best) {
        setMessage('Could not get your location. Allow location access, or search / tap the map instead.')
        return
      }
      const { latitude, longitude, accuracy: acc } = best.coords
      onChange({ lat: latitude, lng: longitude })
      setAccuracy(acc)
      setFocus({ center: [latitude, longitude], zoom: zoomForAccuracy(acc) })
      if (acc > ROUGH_ACCURACY_M) {
        setWarning(
          `Your device could only estimate your location (within about ${formatDistance(acc)}) — ` +
            'this usually means it is using your internet connection, not GPS. ' +
            'Please drag the pin or search to mark the exact spot.',
        )
      }
    }

    watchId = navigator.geolocation.watchPosition(
      pos => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos
        if (pos.coords.accuracy <= GOOD_ACCURACY_M) finish()
      },
      () => finish(),
      { enableHighAccuracy: true, maximumAge: 0, timeout: LOCATE_TIMEOUT_MS },
    )
    timer = setTimeout(finish, LOCATE_TIMEOUT_MS)
  }

  // Search runs on Enter/button only (not per keystroke) to stay within
  // Nominatim's usage policy of max 1 request per second
  async function handleSearch() {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setMessage(null)
    try {
      const params = new URLSearchParams({ format: 'json', q, countrycodes: 'gh', limit: '5' })
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as SearchResult[]
      setResults(data)
      if (data.length === 0) setMessage('No places found — try a nearby town, or tap the map.')
    } catch {
      setMessage('Search is unavailable right now — tap the map instead.')
    } finally {
      setSearching(false)
    }
  }

  function pickResult(r: SearchResult) {
    placePin(parseFloat(r.lat), parseFloat(r.lon), 15)
    setResults(null)
    setQuery('')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              // Enter here must search, not submit the surrounding report form
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
            placeholder="Search a place, e.g. Nima, Accra"
            className="pl-8 text-sm"
          />
          {results && results.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-56 overflow-y-auto">
              {results.map(r => (
                <li key={r.place_id}>
                  <button
                    type="button"
                    onClick={() => pickResult(r)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted"
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="button" variant="outline" onClick={handleSearch} disabled={searching || !query.trim()}>
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      <PickerMap value={value} onChange={handleMapChange} focus={focus} accuracy={accuracy} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={locateMe}
          disabled={locating}
          className="gap-1.5"
        >
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
          Use my location
        </Button>
        {value ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            {accuracy !== null && <span>(±{formatDistance(accuracy)})</span>}
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setAccuracy(null)
                setWarning(null)
              }}
              className="ml-1 p-0.5 rounded hover:bg-muted hover:text-foreground"
              aria-label="Remove pin"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Tap the map to drop a pin, then drag to adjust</span>
        )}
      </div>

      {warning && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          {warning}
        </p>
      )}
      {message && <p className="text-xs text-destructive">{message}</p>}
    </div>
  )
}
