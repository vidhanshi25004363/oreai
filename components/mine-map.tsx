'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Sensor = { id: string; zone: string; lat: number; lng: number; displacement: number; tilt: number; vibration: number; battery: number; signal: number; status: 'Online' | 'Offline'; severity: 'Normal' | 'Warning' | 'Critical'; lastSeen: string }

export default function MineMap({ sensors, selected, onSelect, theme }: { sensors: Sensor[]; selected: Sensor; onSelect: (sensor: Sensor) => void; theme: 'dark' | 'light' }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Record<string, L.CircleMarker>>({})

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false, minZoom: 12, maxZoom: 16 }).setView([51.498, -0.075], 13)
    L.tileLayer(theme === 'light' ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    instanceRef.current = map
    return () => {
      map.remove()
      instanceRef.current = null
      markersRef.current = {}
    }
  }, [theme])

  useEffect(() => {
    const map = instanceRef.current
    if (!map) return
    sensors.forEach((sensor) => {
      const color = sensor.severity === 'Critical' ? '#f36e67' : sensor.severity === 'Warning' ? '#ffbd54' : '#52d49a'
      const existing = markersRef.current[sensor.id]
      if (existing) { existing.setStyle({ color, fillColor: color }); existing.setRadius(sensor.id === selected.id ? 10 : 7); return }
      const marker = L.circleMarker([sensor.lat, sensor.lng], { radius: sensor.id === selected.id ? 10 : 7, color, fillColor: color, fillOpacity: 0.88, weight: 2 }).addTo(map)
      marker.bindTooltip(`${sensor.id} · ${sensor.zone}`, { direction: 'top', offset: [0, -8] })
      marker.on('click', () => onSelect(sensor))
      markersRef.current[sensor.id] = marker
    })
  }, [sensors, selected.id, onSelect])

  return <div ref={mapRef} className="leaflet-map" aria-label="Simulated mine sensor map" />
}
