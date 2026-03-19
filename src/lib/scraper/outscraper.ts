// eslint-disable-next-line @typescript-eslint/no-require-imports
const Outscraper = require('outscraper')

function getClient() {
  const apiKey = process.env.OUTSCRAPER_API_KEY
  if (!apiKey) throw new Error('OUTSCRAPER_API_KEY not configured')
  return new Outscraper(apiKey)
}

export interface OutscraperPlace {
  query: string
  name: string
  full_address: string
  city: string
  state: string
  postal_code: string
  latitude: number
  longitude: number
  rating: number
  reviews: number
  site: string
  phone: string
  place_id: string
  type: string
  category: string
  [key: string]: unknown
}

export interface OutscraperReview {
  review_text: string
  reviewer_name: string
  review_rating: number
  review_datetime_utc: string
  review_id: string
  [key: string]: unknown
}

export interface OutscraperPlaceWithReviews extends OutscraperPlace {
  reviews_data: OutscraperReview[]
}

/**
 * Search Google Maps for businesses matching a query in a specific location.
 * SDK signature: googleMapsSearch(query, limit, language, region, skip, dropDuplicates, enrichment, asyncRequest)
 */
export async function searchGoogleMaps(
  queries: string[],
  limit: number = 20,
  language: string = 'en',
): Promise<OutscraperPlace[]> {
  const client = getClient()

  const results = await client.googleMapsSearch(
    queries,
    limit,
    language,
    null,  // region
    0,     // skip
    false, // dropDuplicates
    null,  // enrichment
    false, // asyncRequest - MUST be false for sync results
  )

  // Results is an array of arrays (one per query)
  const places: OutscraperPlace[] = []
  if (Array.isArray(results)) {
    for (const queryResults of results) {
      if (Array.isArray(queryResults)) {
        places.push(...queryResults)
      } else if (queryResults && typeof queryResults === 'object' && queryResults.name) {
        places.push(queryResults as OutscraperPlace)
      }
    }
  }

  return places
}

/**
 * Fetch Google reviews for specific places.
 * SDK signature: googleMapsReviews(query, reviewsLimit, reviewsQuery, limit, sort, lastPaginationId, start, cutoff, cutoffRating, ignoreEmpty, source, language, region, fields, asyncRequest)
 */
export async function getGoogleReviews(
  queries: string[],
  reviewsLimit: number = 200,
  language: string = 'en',
): Promise<OutscraperPlaceWithReviews[]> {
  const client = getClient()

  const results = await client.googleMapsReviews(
    queries,
    reviewsLimit,
    null,      // reviewsQuery
    1,         // limit (places per query)
    'newest',  // sort
    null,      // lastPaginationId
    null,      // start
    null,      // cutoff
    null,      // cutoffRating
    false,     // ignoreEmpty
    'google',  // source
    language,  // language
    null,      // region
    '',        // fields
    false,     // asyncRequest
  )

  // Flatten results
  const places: OutscraperPlaceWithReviews[] = []
  if (Array.isArray(results)) {
    for (const queryResults of results) {
      if (Array.isArray(queryResults)) {
        places.push(...queryResults)
      } else if (queryResults && typeof queryResults === 'object' && queryResults.name) {
        places.push(queryResults as OutscraperPlaceWithReviews)
      }
    }
  }

  return places
}
