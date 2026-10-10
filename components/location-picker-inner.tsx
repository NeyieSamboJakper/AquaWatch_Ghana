'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface LatLng {
  lat: number
  lng: number
}

// A target the parent asks the map to move to (search result, GPS fix,
// region change). A new object each time, so the same spot can be re-focused.
export interface MapFocus {
  center: [number, number]
  zoom: number
}

interface LocationPickerInnerProps {
  value: LatLng | null
  onChange: (value: LatLng) => void
  focus: MapFocus | null
  // Radius in metres of the device location fix, shown as a circle
  accuracy?: number | null
}

const GHANA_CENTER: [number, number] = [7.9465, -1.0232]

// divIcon avoids leaflet's default marker images, which break under bundlers
const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#2563eb;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
})

function ClickToPlace({ onChange }: { onChange: (value: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function FlyToFocus({ focus }: { focus: MapFocus | null }) {
  const map = useMap()
  useEffect(() => {
    if (focus) map.flyTo(focus.center, focus.zoom, { duration: 0.8 })
  }, [focus, map])
  return null
}

export default function LocationPickerInner({ value, onChange, focus, accuracy }: LocationPickerInnerProps) {
  const markerHandlers = useMemo(
    () => ({
      dragend(e: L.LeafletEvent) {
        const { lat, lng } = (e.target as L.Marker).getLatLng()
        onChange({ lat, lng })
      },
    }),
    [onChange],
  )

  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : GHANA_CENTER}
      zoom={value ? 14 : 6}
      style={{ height: '280px', width: '100%', borderRadius: '0.5rem' }}
      className="border border-border z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPlace onChange={onChange} />
      <FlyToFocus focus={focus} />
      {value && accuracy != null && (
        <Circle
          center={[value.lat, value.lng]}
          radius={accuracy}
          pathOptions={{ color: '#2563eb', weight: 1, fillOpacity: 0.12 }}
          interactive={false}
        />
      )}
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pinIcon}
          draggable
          eventHandlers={markerHandlers}
        />
      )}
    </MapContainer>
  )
}
