import { NextRequest } from 'next/server'
import { searchGoogleMaps } from '@/lib/scraper/outscraper'
import { GULF_COAST_REGIONS, SEARCH_TERMS } from '@/lib/scoring/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      regions = [...GULF_COAST_REGIONS],
      searchTerms = [...SEARCH_TERMS],
      limit = 20,
    } = body as {
      regions?: string[]
      searchTerms?: string[]
      limit?: number
    }

    if (!process.env.OUTSCRAPER_API_KEY) {
      return Response.json({ error: 'OUTSCRAPER_API_KEY not configured' }, { status: 500 })
    }

    // Build query strings: "search term, region"
    const queries = regions.flatMap(region =>
      searchTerms.map(term => `${term}, ${region}`)
    )

    console.log(`Scraping ${queries.length} queries (${regions.length} regions × ${searchTerms.length} terms)...`)

    // Process in batches of 5 to avoid rate limits
    const allPlaces: Record<string, {
      name: string
      address: string
      city: string
      state: string
      zip: string
      latitude: number
      longitude: number
      google_rating: number
      review_count: number
      website: string | null
      phone: string | null
      google_place_id: string
    }> = {}

    const batchSize = 5
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(queries.length / batchSize)}: ${batch.join(' | ')}`)

      const places = await searchGoogleMaps(batch, limit)

      for (const place of places) {
        if (!place.name || !place.place_id) continue

        // Deduplicate by place_id
        if (!allPlaces[place.place_id]) {
          allPlaces[place.place_id] = {
            name: place.name,
            address: place.full_address || '',
            city: place.city || '',
            state: place.state || '',
            zip: place.postal_code || '',
            latitude: place.latitude,
            longitude: place.longitude,
            google_rating: place.rating,
            review_count: place.reviews || 0,
            website: place.site || null,
            phone: place.phone || null,
            google_place_id: place.place_id,
          }
        }
      }
    }

    const properties = Object.values(allPlaces)

    return Response.json({
      success: true,
      properties,
      count: properties.length,
      queries_run: queries.length,
    })
  } catch (error) {
    console.error('Building scrape failed:', error)
    return Response.json(
      { error: 'Scrape failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
