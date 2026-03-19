'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapProperty {
  id: string
  name: string
  city: string
  state: string
  latitude: number | null
  longitude: number | null
  google_rating: number | null
  review_count: number
  score: number | null
  tier: string | null
  estimated_units: number | null
  parking_score: number | null
  has_vacation_rentals: boolean | null
}

const tierColors: Record<string, string> = {
  immediate: '#dc2626',
  nurture: '#f59e0b',
  monitor: '#6b7280',
  disqualified: '#d1d5db',
}

export default function MarketMap({ properties }: { properties: MapProperty[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    mapboxgl.accessToken = token

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-86.8, 30.3], // Gulf Coast center
      zoom: 8,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add markers for each property with coordinates
    const validProperties = properties.filter(p => p.latitude && p.longitude)

    for (const prop of validProperties) {
      const color = tierColors[prop.tier || 'disqualified'] || '#d1d5db'
      const size = prop.score && prop.score >= 80 ? 16 : prop.score && prop.score >= 60 ? 13 : 10

      // Create marker element
      const el = document.createElement('div')
      el.style.width = `${size}px`
      el.style.height = `${size}px`
      el.style.borderRadius = '50%'
      el.style.backgroundColor = color
      el.style.border = '2px solid white'
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'

      const marker = new mapboxgl.Marker(el)
        .setLngLat([prop.longitude!, prop.latitude!])
        .addTo(map.current!)

      marker.getElement().addEventListener('click', () => {
        setSelectedProperty(prop)
        map.current?.flyTo({
          center: [prop.longitude!, prop.latitude!],
          zoom: 12,
          duration: 1000,
        })
      })
    }

    // Fit bounds to show all markers
    if (validProperties.length > 1) {
      const bounds = new mapboxgl.LngLatBounds()
      validProperties.forEach(p => bounds.extend([p.longitude!, p.latitude!]))
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 })
    }

    return () => {
      map.current?.remove()
    }
  }, [properties])

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-[600px] rounded-xl overflow-hidden border border-gray-200" />

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-lg p-3 text-xs space-y-1.5">
        <p className="font-semibold text-gray-700">Lead Score</p>
        {[
          { tier: 'immediate', label: 'Immediate (80+)', color: '#dc2626' },
          { tier: 'nurture', label: 'Nurture (60-79)', color: '#f59e0b' },
          { tier: 'monitor', label: 'Monitor (40-59)', color: '#6b7280' },
          { tier: 'disqualified', label: 'Unscored / Low', color: '#d1d5db' },
        ].map(item => (
          <div key={item.tier} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Property detail popup */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
          <button
            onClick={() => setSelectedProperty(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            &times;
          </button>
          <h3 className="font-bold text-sm">{selectedProperty.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{selectedProperty.city}, {selectedProperty.state}</p>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-400">Score</p>
              <p className="text-lg font-bold" style={{ color: tierColors[selectedProperty.tier || 'disqualified'] }}>
                {selectedProperty.score ?? '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-400">Rating</p>
              <p className="text-lg font-bold text-amber-500">
                {selectedProperty.google_rating ? `${selectedProperty.google_rating} ★` : '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-400">Est. Units</p>
              <p className="text-sm font-bold">{selectedProperty.estimated_units ?? '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-400">Parking</p>
              <p className={`text-sm font-bold ${
                (selectedProperty.parking_score ?? 0) >= 7 ? 'text-red-600' :
                (selectedProperty.parking_score ?? 0) >= 4 ? 'text-amber-600' : 'text-green-600'
              }`}>
                {selectedProperty.parking_score !== null ? `${selectedProperty.parking_score}/10` : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            <span>{selectedProperty.review_count} reviews</span>
            <span>{selectedProperty.has_vacation_rentals ? 'Vacation rentals: Yes' : ''}</span>
          </div>

          <a
            href={`/dashboard/leads/${selectedProperty.id}`}
            className="block mt-3 text-center text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg py-1.5"
          >
            View Lead Details →
          </a>
        </div>
      )}
    </div>
  )
}
