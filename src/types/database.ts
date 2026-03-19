// Supabase database types

export interface Property {
  id: string
  outscraper_id: string | null
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  latitude: number | null
  longitude: number | null
  google_rating: number | null
  review_count: number
  website: string | null
  phone: string | null
  google_place_id: string | null
  source: 'outscraper' | 'csv_import' | 'manual'
  scraped_at: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  property_id: string
  review_text: string | null
  reviewer_name: string | null
  rating: number | null
  review_date: string | null
  outscraper_review_id: string | null
  scraped_at: string | null
  created_at: string
}

export type AnalysisType = 'parking' | 'units' | 'rentals'

export interface ParkingComplaint {
  review_excerpt: string
  category: string
  severity: number
}

export interface Analysis {
  id: string
  property_id: string
  analysis_type: AnalysisType

  // Parking analysis
  parking_score: number | null
  parking_complaints: ParkingComplaint[] | null
  parking_categories: Record<string, number> | null

  // Unit estimation
  estimated_units: number | null
  unit_confidence: 'high' | 'medium' | 'low' | null
  unit_evidence: string | null

  // Vacation rental
  has_vacation_rentals: boolean | null
  rental_evidence: string | null
  rental_platforms: string[] | null

  model_used: string | null
  raw_response: unknown
  analyzed_at: string
  created_at: string
}

export type LeadTier = 'immediate' | 'nurture' | 'monitor' | 'disqualified'

export interface LeadScore {
  id: string
  property_id: string
  score: number
  tier: LeadTier
  score_breakdown: Record<string, number>
  manual_override: boolean
  override_reason: string | null
  scored_at: string
  created_at: string
}

export interface Contact {
  id: string
  property_id: string
  management_company: string | null
  contact_name: string | null
  contact_title: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  source: 'manual' | 'web_scrape' | 'clay'
  verified: boolean
  created_at: string
  updated_at: string
}

export type OutreachStatus = 'draft' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced'

export interface Outreach {
  id: string
  property_id: string
  contact_id: string | null
  template: string | null
  subject: string | null
  body: string | null
  status: OutreachStatus
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  resend_message_id: string | null
  created_at: string
}

export type ScrapeJobStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ScrapeJob {
  id: string
  job_type: 'buildings' | 'reviews'
  status: ScrapeJobStatus
  search_terms: string[] | null
  regions: string[] | null
  properties_found: number | null
  reviews_scraped: number | null
  error_message: string | null
  outscraper_request_id: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export type PipelineStage = 'scraped' | 'analyzed' | 'scored' | 'enriched' | 'outreach_sent' | 'responded' | 'meeting' | 'closed'

export interface PipelineStageRecord {
  id: string
  property_id: string
  stage: PipelineStage
  entered_at: string
  notes: string | null
}

export interface ScoringConfig {
  id: string
  weights: {
    units_50_200: number
    units_200_350: number
    vacation_rentals: number
    parking_complaints: number
    security_patrol: number
    pass_price_40_plus: number
    google_parking_mentions: number
  }
  tier_thresholds: {
    immediate: number
    nurture: number
    monitor: number
  }
  updated_at: string
}

// Joined types for UI
export interface LeadWithDetails extends Property {
  latest_parking_analysis: Analysis | null
  latest_units_analysis: Analysis | null
  latest_rentals_analysis: Analysis | null
  lead_score: LeadScore | null
  contacts: Contact[]
  current_stage: PipelineStage | null
  outreach_count: number
}
