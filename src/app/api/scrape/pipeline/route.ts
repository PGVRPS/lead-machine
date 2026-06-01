import { NextRequest } from 'next/server'
import { searchGoogleMaps, getGoogleReviews } from '@/lib/scraper/outscraper'
import { analyzeParkingComplaints } from '@/lib/ai/prompts/parking-detection'
import { estimateUnitCount } from '@/lib/ai/prompts/unit-estimation'
import { detectVacationRentals } from '@/lib/ai/prompts/rental-detection'
import { calculateLeadScore } from '@/lib/scoring/calculator'
import { upsertProperty, insertReviews, insertAnalysis, upsertLeadScore, addPipelineStage } from '@/lib/supabase/db'
import { enrichPropertyContacts } from '@/lib/enrichment/enrich-contacts'
import {
  createPipelineRun,
  updatePipelineRun,
  getLatestPipelineRun,
  getRunningPipelineRun,
} from '@/lib/supabase/pipeline-runs'

export const maxDuration = 300

interface PipelineParams {
  regions: string[]
  searchTerms: string[]
  buildingLimit: number
  reviewsLimit: number
  analyzeTop: number
}

async function runPipeline(runId: string, params: PipelineParams) {
  const { regions, searchTerms, buildingLimit, reviewsLimit, analyzeTop } = params
  try {
    // ── Step 1: Scrape Buildings ──
    await updatePipelineRun(runId, {
      status: 'scraping_buildings',
      progress: `Searching ${regions.length} regions with ${searchTerms.length} terms...`,
    })

    const queries = regions.flatMap(region =>
      searchTerms.map(term => `${term}, ${region}`),
    )

    const rawPlaces = await searchGoogleMaps(queries, buildingLimit)

    // Filter to actual condo buildings / apartment complexes. Outscraper returns
    // a mix of types for these searches (Vacation home rental agency, Hotel,
    // individual VRBO listings, etc.) — VRPS targets residential buildings, so
    // anything outside this allow-list is dropped before it hits the DB.
    const places = rawPlaces.filter(p => {
      const haystack = [p.type, p.category, (p as { subtypes?: string }).subtypes]
        .filter(Boolean)
        .join(' | ')
      return /Condominium\s+complex|Apartment\s+building|Apartment\s+complex|\bCondominium\b/i.test(haystack)
    })

    // Deduplicate and save to Supabase
    const uniquePlaces = new Map<string, typeof places[0]>()
    const dbProperties: Array<{ id: string; outscraper_id: string; place: typeof places[0] }> = []
    const filteredOut = rawPlaces.length - places.length

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

    await updatePipelineRun(runId, {
      status: 'scraping_reviews',
      progress: `Found ${dbProperties.length} condo properties (filtered out ${filteredOut} non-condos). Fetching reviews...`,
    })

    // ── Step 2: Scrape Reviews (top N by review count) ──
    const sortedByReviews = dbProperties
      .sort((a, b) => (b.place.reviews || 0) - (a.place.reviews || 0))
      .slice(0, analyzeTop)

    const reviewData = new Map<string, { dbId: string; name: string; place: typeof places[0]; reviews: Array<{ text: string; reviewer: string; rating: number; date: string }> }>()

    for (let i = 0; i < sortedByReviews.length; i += 2) {
      const batch = sortedByReviews.slice(i, i + 2)
      await updatePipelineRun(runId, {
        status: 'scraping_reviews',
        progress: `Fetching reviews ${i + 1}-${Math.min(i + 2, sortedByReviews.length)} of ${sortedByReviews.length}...`,
      })

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
    await updatePipelineRun(runId, {
      status: 'analyzing',
      progress: `Running AI analysis on ${reviewData.size} properties...`,
    })

    let analyzedCount = 0
    let immediateCount = 0
    let nurtureCount = 0

    const entries = Array.from(reviewData.entries())
    for (let i = 0; i < entries.length; i++) {
      const [dbId, data] = entries[i]
      if (data.reviews.length === 0) continue

      await updatePipelineRun(runId, {
        status: 'analyzing',
        progress: `Analyzing ${data.name} (${i + 1}/${entries.length})...`,
      })
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

    // ── Step 4: Contact Enrichment ──
    await updatePipelineRun(runId, {
      status: 'enriching',
      progress: `Enriching contacts for ${entries.length} properties...`,
    })

    let enrichedCount = 0
    for (let i = 0; i < entries.length; i++) {
      const [dbId, data] = entries[i]
      await updatePipelineRun(runId, {
        status: 'enriching',
        progress: `Finding contacts for ${data.name} (${i + 1}/${entries.length})...`,
      })

      try {
        const enrichResult = await enrichPropertyContacts(
          dbId,
          data.name,
          data.place.city || '',
          data.place.site || null,
        )
        if (enrichResult.enriched) {
          await addPipelineStage(dbId, 'enriched')
          enrichedCount++
        }
      } catch (err) {
        console.error(`Enrichment failed for ${data.name}:`, err)
      }
    }

    const summary = {
      total_properties: dbProperties.length,
      reviews_fetched: reviewData.size,
      analyzed: analyzedCount,
      immediate: immediateCount,
      nurture: nurtureCount,
      enriched: enrichedCount,
      filtered_out: filteredOut,
    }
    await updatePipelineRun(runId, {
      status: 'complete',
      progress: `Pipeline complete! ${dbProperties.length} properties scraped, ${analyzedCount} analyzed, ${enrichedCount} enriched.`,
      summary,
    })
  } catch (error) {
    console.error('Pipeline failed:', error)
    await updatePipelineRun(runId, {
      status: 'error',
      progress: '',
      error: (error as Error).message,
    }).catch(e => console.error('Failed to record pipeline error:', e))
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const params: PipelineParams = {
    regions: body.regions ?? ['Orange Beach, AL'],
    searchTerms: body.searchTerms ?? ['condominium complex', 'condo resort', 'beach condo'],
    buildingLimit: body.buildingLimit ?? 10,
    reviewsLimit: body.reviewsLimit ?? 100,
    analyzeTop: body.analyzeTop ?? 5,
  }

  // Guard against starting a second pipeline while one is already running.
  // Now backed by Supabase, so this works across lambdas.
  const running = await getRunningPipelineRun()
  if (running) {
    return Response.json(
      { error: 'Pipeline already running', status: running.status, progress: running.progress, runId: running.id },
      { status: 409 },
    )
  }

  let run
  try {
    run = await createPipelineRun(params as unknown as Record<string, unknown>)
  } catch (err) {
    return Response.json(
      { error: 'Failed to create pipeline run', details: (err as Error).message },
      { status: 500 },
    )
  }

  // Kick off the pipeline. We intentionally don't await it — the long-running
  // work continues on the lambda after the response, and the client polls
  // GET /api/scrape/pipeline for progress and completion.
  runPipeline(run.id, params)

  return Response.json({ started: true, runId: run.id }, { status: 202 })
}

export async function GET() {
  const run = await getLatestPipelineRun()
  if (!run) {
    return Response.json({ status: 'idle', progress: '', error: null, lastScrapeAt: null, summary: null })
  }
  return Response.json({
    status: run.status,
    progress: run.progress,
    error: run.error,
    lastScrapeAt: run.completed_at,
    summary: run.summary,
    runId: run.id,
  })
}
