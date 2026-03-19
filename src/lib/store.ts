// In-memory store for scraped data (Phase 3)
// Will be replaced by Supabase in production

import type { LeadWithDetails } from '@/types/database'

interface ScrapedProperty {
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
  reviews: Array<{
    text: string
    reviewer: string
    rating: number
    date: string
  }>
  analysis?: {
    parking?: {
      severity_score: number
      parking_issue: boolean
      total_parking_mentions: number
      complaints: Array<{ review_excerpt: string; category: string; severity: number }>
      summary: string
    }
    units?: {
      estimated_units: number
      confidence: string
      evidence: string
      in_target_range: boolean
    }
    rentals?: {
      has_vacation_rentals: boolean
      confidence: string
      evidence: string
      platforms: string[]
    }
  }
  score?: {
    score: number
    tier: string
    breakdown: Record<string, number>
  }
}

// Global in-memory store
const store: {
  properties: Map<string, ScrapedProperty>
  lastScrapeAt: string | null
  scrapeStatus: 'idle' | 'scraping_buildings' | 'scraping_reviews' | 'analyzing' | 'scoring' | 'complete' | 'error'
  scrapeError: string | null
  scrapeProgress: string
} = {
  properties: new Map(),
  lastScrapeAt: null,
  scrapeStatus: 'idle',
  scrapeError: null,
  scrapeProgress: '',
}

// Ensure singleton across hot reloads in dev
const globalStore = globalThis as unknown as { __leadStore?: typeof store }
if (!globalStore.__leadStore) {
  globalStore.__leadStore = store
}

export function getStore() {
  return globalStore.__leadStore!
}

export function getScrapedProperties(): ScrapedProperty[] {
  return Array.from(getStore().properties.values())
}

export function addScrapedProperty(placeId: string, property: ScrapedProperty) {
  getStore().properties.set(placeId, property)
}

export function getScrapedProperty(placeId: string): ScrapedProperty | undefined {
  return getStore().properties.get(placeId)
}

export function updatePropertyReviews(placeId: string, reviews: ScrapedProperty['reviews']) {
  const prop = getStore().properties.get(placeId)
  if (prop) {
    prop.reviews = reviews
    getStore().properties.set(placeId, prop)
  }
}

export function updatePropertyAnalysis(placeId: string, analysis: ScrapedProperty['analysis']) {
  const prop = getStore().properties.get(placeId)
  if (prop) {
    prop.analysis = analysis
    getStore().properties.set(placeId, prop)
  }
}

export function updatePropertyScore(placeId: string, score: ScrapedProperty['score']) {
  const prop = getStore().properties.get(placeId)
  if (prop) {
    prop.score = score
    getStore().properties.set(placeId, prop)
  }
}

export function setStatus(status: typeof store.scrapeStatus, progress?: string, error?: string) {
  const s = getStore()
  s.scrapeStatus = status
  if (progress !== undefined) s.scrapeProgress = progress
  if (error !== undefined) s.scrapeError = error
  if (status === 'complete') s.lastScrapeAt = new Date().toISOString()
}

export function getStatus() {
  const s = getStore()
  return {
    status: s.scrapeStatus,
    progress: s.scrapeProgress,
    error: s.scrapeError,
    lastScrapeAt: s.lastScrapeAt,
    propertyCount: s.properties.size,
  }
}

/**
 * Convert scraped properties to LeadWithDetails format for the UI
 */
export function toLeadWithDetails(placeId: string, prop: ScrapedProperty): LeadWithDetails {
  const id = placeId
  return {
    id,
    outscraper_id: placeId,
    name: prop.name,
    address: prop.address,
    city: prop.city,
    state: prop.state,
    zip: prop.zip,
    latitude: prop.latitude,
    longitude: prop.longitude,
    google_rating: prop.google_rating,
    review_count: prop.review_count,
    website: prop.website,
    phone: prop.phone,
    google_place_id: placeId,
    source: 'outscraper',
    scraped_at: getStore().lastScrapeAt || new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latest_parking_analysis: prop.analysis?.parking ? {
      id: `a-parking-${id}`,
      property_id: id,
      analysis_type: 'parking',
      parking_score: prop.analysis.parking.severity_score,
      parking_complaints: prop.analysis.parking.complaints,
      parking_categories: null,
      estimated_units: null,
      unit_confidence: null,
      unit_evidence: null,
      has_vacation_rentals: null,
      rental_evidence: null,
      rental_platforms: null,
      model_used: 'claude-sonnet-4-20250514',
      raw_response: null,
      analyzed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    } : null,
    latest_units_analysis: prop.analysis?.units ? {
      id: `a-units-${id}`,
      property_id: id,
      analysis_type: 'units',
      parking_score: null,
      parking_complaints: null,
      parking_categories: null,
      estimated_units: prop.analysis.units.estimated_units,
      unit_confidence: prop.analysis.units.confidence as 'high' | 'medium' | 'low',
      unit_evidence: prop.analysis.units.evidence,
      has_vacation_rentals: null,
      rental_evidence: null,
      rental_platforms: null,
      model_used: 'claude-sonnet-4-20250514',
      raw_response: null,
      analyzed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    } : null,
    latest_rentals_analysis: prop.analysis?.rentals ? {
      id: `a-rentals-${id}`,
      property_id: id,
      analysis_type: 'rentals',
      parking_score: null,
      parking_complaints: null,
      parking_categories: null,
      estimated_units: null,
      unit_confidence: null,
      unit_evidence: null,
      has_vacation_rentals: prop.analysis.rentals.has_vacation_rentals,
      rental_evidence: prop.analysis.rentals.evidence,
      rental_platforms: prop.analysis.rentals.platforms,
      model_used: 'claude-sonnet-4-20250514',
      raw_response: null,
      analyzed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    } : null,
    lead_score: prop.score ? {
      id: `ls-${id}`,
      property_id: id,
      score: prop.score.score,
      tier: prop.score.tier as 'immediate' | 'nurture' | 'monitor' | 'disqualified',
      score_breakdown: prop.score.breakdown,
      manual_override: false,
      override_reason: null,
      scored_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    } : null,
    contacts: [],
    current_stage: prop.score ? 'scored' : prop.analysis ? 'analyzed' : 'scraped',
    outreach_count: 0,
  }
}
