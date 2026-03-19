import { NextRequest } from 'next/server'
import { getGoogleReviews } from '@/lib/scraper/outscraper'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { placeIds, reviewsLimit = 200 } = body as {
      placeIds: string[]
      reviewsLimit?: number
    }

    if (!placeIds?.length) {
      return Response.json({ error: 'placeIds[] is required' }, { status: 400 })
    }

    if (!process.env.OUTSCRAPER_API_KEY) {
      return Response.json({ error: 'OUTSCRAPER_API_KEY not configured' }, { status: 500 })
    }

    console.log(`Scraping reviews for ${placeIds.length} places (up to ${reviewsLimit} reviews each)...`)

    // Process in batches of 3 to avoid rate limits
    const allResults: Array<{
      place_id: string
      name: string
      reviews: Array<{
        text: string
        reviewer: string
        rating: number
        date: string
      }>
    }> = []

    const batchSize = 3
    for (let i = 0; i < placeIds.length; i += batchSize) {
      const batch = placeIds.slice(i, i + batchSize)
      console.log(`Fetching reviews batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(placeIds.length / batchSize)}...`)

      const results = await getGoogleReviews(batch, reviewsLimit)

      for (const place of results) {
        if (!place.place_id) continue

        allResults.push({
          place_id: place.place_id,
          name: place.name,
          reviews: (place.reviews_data || []).map(r => ({
            text: r.review_text || '',
            reviewer: r.reviewer_name || 'Anonymous',
            rating: r.review_rating || 0,
            date: r.review_datetime_utc || '',
          })).filter(r => r.text.length > 0),
        })
      }
    }

    const totalReviews = allResults.reduce((sum, r) => sum + r.reviews.length, 0)

    return Response.json({
      success: true,
      results: allResults,
      places_processed: allResults.length,
      total_reviews: totalReviews,
    })
  } catch (error) {
    console.error('Review scrape failed:', error)
    return Response.json(
      { error: 'Review scrape failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
