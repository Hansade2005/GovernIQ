import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card } from './Card'

// Fix Leaflet default icons
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export function MapComponent() {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Create map
    const map = L.map(mapRef.current).setView([5.963, 9.767], 8) // NW Region of Cameroon

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Add markers for divisions
    const divisions = [
      { name: 'Mezam Division', lat: 6.0, lng: 9.73, projects: 5 },
      { name: 'Menchum Division', lat: 6.2, lng: 9.4, projects: 4 },
      { name: 'Momo Division', lat: 5.9, lng: 10.0, projects: 6 },
      { name: 'Kweneng Division', lat: 5.8, lng: 10.15, projects: 4 },
      { name: 'Boyo Division', lat: 6.4, lng: 9.85, projects: 3 },
      { name: 'Manyu Division', lat: 5.6, lng: 9.3, projects: 4 },
    ]

    divisions.forEach((div) => {
      const popupContent = `
        <div class="p-3 rounded-lg">
          <h4 class="font-semibold text-sm">${div.name}</h4>
          <p class="text-xs text-muted-foreground">${div.projects} Active Projects</p>
        </div>
      `

      L.circleMarker([div.lat, div.lng], {
        radius: 8 + div.projects,
        fillColor: '#3b82f6',
        color: '#1e40af',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.7,
      })
        .bindPopup(popupContent)
        .addTo(map)
    })

    // Cleanup on unmount
    return () => {
      map.remove()
    }
  }, [])

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold font-display text-foreground">Regional Divisions Map</h2>
        <p className="text-sm text-muted-foreground mt-1">Interactive map of North West Region divisions</p>
      </div>
      <div ref={mapRef} className="w-full h-96 rounded-lg border border-border overflow-hidden" />
    </Card>
  )
}
