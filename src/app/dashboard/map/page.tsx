import { getLeadsWithDetails } from '@/lib/supabase/db'
import MarketMap from '@/components/map/MarketMap'
import { MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  let leads: Awaited<ReturnType<typeof getLeadsWithDetails>> = []
  try {
    leads = await getLeadsWithDetails()
  } catch {
    // Supabase not connected yet — use empty
  }

  const mapProperties = leads.map(l => ({
    id: l.id,
    name: l.name,
    city: l.city || '',
    state: l.state || '',
    latitude: l.latitude,
    longitude: l.longitude,
    google_rating: l.google_rating,
    review_count: l.review_count,
    score: l.lead_score?.score ?? null,
    tier: l.lead_score?.tier ?? null,
    estimated_units: l.latest_units_analysis?.estimated_units ?? null,
    parking_score: l.latest_parking_analysis?.parking_score ?? null,
    has_vacation_rentals: l.latest_rentals_analysis?.has_vacation_rentals ?? null,
  }))

  const withCoords = mapProperties.filter(p => p.latitude && p.longitude)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market Map</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gulf Coast condo database — {leads.length} properties tracked, {withCoords.length} with coordinates
        </p>
      </div>

      {withCoords.length > 0 ? (
        <MarketMap properties={mapProperties} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No properties with coordinates yet</h3>
          <p className="text-sm text-gray-400 mt-2">
            Run a scrape from the Scrape page to populate the map with Gulf Coast condos.
          </p>
        </div>
      )}

      {/* Stats bar */}
      {leads.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Properties', value: leads.length, color: 'text-blue-600' },
            { label: 'With Coordinates', value: withCoords.length, color: 'text-blue-600' },
            { label: 'Scored', value: leads.filter(l => l.lead_score).length, color: 'text-green-600' },
            { label: 'Hot Leads', value: leads.filter(l => l.lead_score?.tier === 'immediate').length, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
