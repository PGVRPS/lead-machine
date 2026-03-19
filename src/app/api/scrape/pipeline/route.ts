import { NextRequest } from 'next/server'
import { searchGoogleMaps, getGoogleReviews } from '@/lib/scraper/outscraper'
import { analyzeParkingComplaints } from '@/lib/ai/prompts/parking-detection'
import { estimateUnitCount } from '@/lib/ai/prompts/unit-estimation'
import { detectVacationRentals } from '@/lib/ai/prompts/rental-detection'
import { calculateLeadScore } from '@/lib/scoring/calculator'
import { upsertProperty, insertReviews, insertAnalysis, upsertLeadScore, addPipelineStage } from '@/lib/supabase/db'
import { setStatus } from '@/lib/store'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const {
    regions = ['Orange Beach, AL'],
    searchTerms = ['condominium complex', 'condo resort', 'beach condo'],
    buildingLimit = 10,
    reviewsLimit = 100,
    analyzeTop = 5,
  } = body as {
    regions?: string[]
    searchTerms?: string[]
    buildingLimit?: number
    reviewsLimit?: number
    analyzeTop?: number
  }

  try {
    // ── Step 1: Scrape Buildings ──
    setStatus('scraping_buildings', `Searching ${regions.length} regions with ${searchTerms.length} terms...`)

    const queries = regions.flatMap(region =>
      searchTerms.map(term => `${term}, ${region}`)
    )

    const places = await searchGoogleMaps(queries, buildingLimit)

    // Deduplicate and save to Supabase
    const uniquePlaces = new Map<string, typeof places[0]>()
    const dbProperties: Array<{ id: string; outscraper_id: string; place: typeof places[0] }> = []

    for (const place of places) {
      if (place.name && place.place_id && !uniquePlaces.has(place.place_id)) {
        uniquePlaces.set(place.place_id, place)
        try {
          const dbProp = await upsertProperty({
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
          })
          dbProperties.push({ id: dbProp.id, outscraper_id: place.place_id, place })
          await addPipelineStage(dbProp.id, 'scraped')
        } catch (err) {
          console.error(`Failed to save property ${place.name}:`, err)
        }
      }
    }

    setStatus('scraping_reviews', `Found ${dbProperties.length} properties. Fetching reviews...`)

    // ── Step 2: Scrape Reviews (top N by review count) ──
    const sortedByReviews = dbProperties
      .sort((a, b) => (b.place.reviews || 0) - (a.place.reviews || 0))
      .slice(0, analyzeTop)

    const reviewData = new Map<string, { dbId: string; name: string; place: typeof places[0]; reviews: Array<{ text: string; reviewer: string; rating: number; date: string }> }>()

    for (let i = 0; i < sortedByReviews.length; i += 2) {
      const batch = sortedByReviews.slice(i, i + 2)
      setStatus('scraping_reviews', `Fetching reviews ${i + 1}-${Math.min(i + 2, sortedByReviews.length)} of ${sortedByReviews.length}...`)

      const placeIds = batch.map(b => b.outscraper_id)
      const reviewResults = await getGoogleReviews(placeIds, reviewsLimit)

      for (const result of reviewResults) {
        if (!result.place_id) continue
        const dbProp = dbProperties.find(p => p.outscraper_id === result.place_id)
        if (!dbProp) continue

        const reviews = (result.reviews_data || [])
          .map(r => ({ text: r.review_text || '', reviewer: r.reviewer_name || 'Anonymous', rating: r.review_rating || 0, date: r.review_datetime_utc || '' }))
          .filter(r => r.text.length > 0)

        await insertReviews(dbProp.id, reviews)
        reviewData.set(dbProp.id, { dbId: dbProp.id, name: dbProp.place.name, place: dbProp.place, reviews })
      }
    }

    // ── Step 3: AI Analysis ──
    setStatus('analyzing', `Running AI analysis on ${reviewData.size} properties...`)

    let analyzedCount = 0
    let immediateCount = 0
    let nurtureCount = 0

    const entries = Array.from(reviewData.entries())
    for (let i = 0; i < entries.length; i++) {
      const [dbId, data] = entries[i]
      if (data.reviews.length === 0) continue

      setStatus('analyzing', `Analyzing ${data.name} (${i + 1}/${entries.length})...`)
      const reviewTexts = data.reviews.map(r => r.text)

      try {
        const [parkingResult, unitsResult, rentalsResult] = await Promise.all([
          analyzeParkingComplaints(data.name, reviewTexts),
          estimateUnitCount(data.name, data.place.full_address || '', data.place.city || '', data.place.state || '', data.place.reviews || 0, reviewTexts.slice(0, 10)),
          detectVacationRentals(data.name, data.place.city || '', data.place.state || '', reviewTexts.slice(0, 30)),
        ])

        await Promise.all([
          insertAnalysis(dbId, 'parking', parkingResult.result as unknown as Record<string, unknown>, parkingResult.model),
          insertAnalysis(dbId, 'units', unitsResult.result as unknown as Record<string, unknown>, unitsResult.model),
          insertAnalysis(dbId, 'rentals', rentalsResult.result as unknown as Record<string, unknown>, rentalsResult.model),
        ])
        await addPipelineStage(dbId, 'analyzed')
        analyzedCount++

        // ── Score this property immediately ──
        const parking = parkingResult.result as { severity_score?: number; total_parking_mentions?: number }
        const units = unitsResult.result as { estimated_units?: number }
        const rentals = rentalsResult.result as { has_vacation_rentals?: boolean }

        const scoreResult = calculateLeadScore({
          estimatedUnits: units?.estimated_units ?? null,
          hasVacationRentals: rentals?.has_vacation_rentals ?? false,
          parkingScore: parking?.severity_score ?? 0,
          securityPatrolMentioned: false,
          passPriceMentioned: null,
          googleParkingMentions: parking?.total_parking_mentions ?? 0,
        })

        await upsertLeadScore(dbId, scoreResult.score, scoreResult.tier, scoreResult.breakdown)
        await addPipelineStage(dbId, 'scored')

        if (scoreResult.tier === 'immediate') immediateCount++
        if (scoreResult.tier === 'nurture') nurtureCount++
      } catch (err) {
        console.error(`Analysis failed for ${data.name}:`, err)
      }
    }

    setStatus('complete', `Pipeline complete! ${dbProperties.length} properties scraped, ${analyzedCount} analyzed.`)

    return Response.json({
      success: true,
      summary: {
        total_properties: dbProperties.length,
        reviews_fetched: reviewData.size,
        analyzed: analyzedCount,
        immediate: immediateCount,
        nurture: nurtureCount,
      },
    })
  } catch (error) {
    console.error('Pipeline failed:', error)
    setStatus('error', '', (error as Error).message)
    return Response.json({ error: 'Pipeline failed', details: (error as Error).message }, { status: 500 })
  }
}

export async function GET() {
  const { status, progress, error, lastScrapeAt } = await import('@/lib/store').then(m => m.getStatus())
  return Response.json({ status, progress, error, lastScrapeAt })
}
