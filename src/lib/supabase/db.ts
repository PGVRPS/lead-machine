import { createServerClient } from './server'
import { GULF_COAST_REGIONS, SEARCH_TERMS } from '@/lib/scoring/config'

// ── Scrape Config ──────────────────────────────────────────────────────

export async function getScrapeConfig(): Promise<{
  regions: string[]
  searchTerms: string[]
  scoringWeights: Record<string, number>
  tierThresholds: Record<string, number>
}> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('scrape_config')
    .select('regions, search_terms, scoring_weights, tier_thresholds')
    .limit(1)
    .single()

  const defaultWeights = { units_50_200: 25, units_200_350: 15, vacation_rentals: 20, parking_complaints: 20, security_patrol: 15, pass_price_40_plus: 10, google_parking_mentions: 10 }
  const defaultThresholds = { immediate: 80, nurture: 60, monitor: 40 }

  if (error || !data) {
    return {
      regions: [...GULF_COAST_REGIONS],
      searchTerms: [...SEARCH_TERMS],
      scoringWeights: defaultWeights,
      tierThresholds: defaultThresholds,
    }
  }

  return {
    regions: (data.regions as string[]) || [...GULF_COAST_REGIONS],
    searchTerms: (data.search_terms as string[]) || [...SEARCH_TERMS],
    scoringWeights: (data.scoring_weights as Record<string, number>) || defaultWeights,
    tierThresholds: (data.tier_thresholds as Record<string, number>) || defaultThresholds,
  }
}

export async function updateScrapeConfig(
  regions: string[],
  searchTerms: string[],
  scoringWeights?: Record<string, number>,
  tierThresholds?: Record<string, number>
) {
  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('scrape_config')
    .select('id')
    .limit(1)
    .single()

  const updateData: Record<string, unknown> = {
    regions,
    search_terms: searchTerms,
    updated_at: new Date().toISOString(),
  }
  if (scoringWeights) updateData.scoring_weights = scoringWeights
  if (tierThresholds) updateData.tier_thresholds = tierThresholds

  if (existing) {
    const { error } = await supabase
      .from('scrape_config')
      .update(updateData)
      .eq('id', existing.id)

    if (error) throw new Error(`Update scrape config failed: ${error.message}`)
  } else {
    const { error } = await supabase
      .from('scrape_config')
      .insert(updateData)

    if (error) throw new Error(`Insert scrape config failed: ${error.message}`)
  }
}

// ── Properties ──────────────────────────────────────────────────────────

export async function upsertProperty(property: {
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
}) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('properties')
    .upsert(
      {
        outscraper_id: property.google_place_id,
        name: property.name,
        address: property.address,
        city: property.city,
        state: property.state,
        zip: property.zip,
        latitude: property.latitude,
        longitude: property.longitude,
        google_rating: property.google_rating,
        review_count: property.review_count,
        website: property.website,
        phone: property.phone,
        google_place_id: property.google_place_id,
        source: 'outscraper',
        scraped_at: new Date().toISOString(),
      },
      { onConflict: 'outscraper_id' }
    )
    .select('id, outscraper_id')
    .single()

  if (error) throw new Error(`Upsert property failed: ${error.message}`)
  return data
}

// ── Reviews ─────────────────────────────────────────────────────────────

export async function insertReviews(
  propertyId: string,
  reviews: Array<{ text: string; reviewer: string; rating: number; date: string }>
) {
  const supabase = createServerClient()

  // Delete old reviews for this property first
  await supabase.from('reviews').delete().eq('property_id', propertyId)

  if (reviews.length === 0) return 0

  const rows = reviews.map(r => ({
    property_id: propertyId,
    review_text: r.text,
    reviewer_name: r.reviewer,
    rating: Math.min(5, Math.max(1, Math.round(r.rating))),
    review_date: r.date || null,
    scraped_at: new Date().toISOString(),
  }))

  // Insert in batches of 100
  let inserted = 0
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const { error } = await supabase.from('reviews').insert(batch)
    if (error) {
      console.error(`Insert reviews batch failed:`, error.message)
    } else {
      inserted += batch.length
    }
  }

  return inserted
}

// ── Analyses ────────────────────────────────────────────────────────────

export async function insertAnalysis(
  propertyId: string,
  type: 'parking' | 'units' | 'rentals',
  data: Record<string, unknown>,
  model: string
) {
  const supabase = createServerClient()

  const row: Record<string, unknown> = {
    property_id: propertyId,
    analysis_type: type,
    model_used: model,
    raw_response: data,
    analyzed_at: new Date().toISOString(),
  }

  if (type === 'parking') {
    row.parking_score = data.severity_score
    row.parking_complaints = data.complaints
    row.parking_categories = data.category_counts || null
  } else if (type === 'units') {
    row.estimated_units = data.estimated_units
    row.unit_confidence = data.confidence
    row.unit_evidence = data.evidence
  } else if (type === 'rentals') {
    row.has_vacation_rentals = data.has_vacation_rentals
    row.rental_evidence = data.evidence
    row.rental_platforms = data.platforms || []
  }

  const { error } = await supabase.from('analyses').insert(row)
  if (error) throw new Error(`Insert analysis failed: ${error.message}`)
}

// ── Lead Scores ─────────────────────────────────────────────────────────

export async function upsertLeadScore(
  propertyId: string,
  score: number,
  tier: string,
  breakdown: Record<string, number>
) {
  const supabase = createServerClient()

  // Delete old score for this property
  await supabase.from('lead_scores').delete().eq('property_id', propertyId)

  const { error } = await supabase.from('lead_scores').insert({
    property_id: propertyId,
    score,
    tier,
    score_breakdown: breakdown,
    scored_at: new Date().toISOString(),
  })

  if (error) throw new Error(`Upsert lead score failed: ${error.message}`)
}

// ── Pipeline Stages ─────────────────────────────────────────────────────

export async function addPipelineStage(propertyId: string, stage: string, notes?: string) {
  const supabase = createServerClient()
  await supabase.from('pipeline_stages').insert({
    property_id: propertyId,
    stage,
    notes,
  })
}

// ── Contacts ───────────────────────────────────────────────────────────

export async function insertContacts(
  propertyId: string,
  managementCompany: string | null,
  contacts: Array<{
    name: string | null
    title: string | null
    email: string | null
    phone: string | null
    linkedin_url?: string | null
  }>
) {
  const supabase = createServerClient()

  // Delete existing web_scrape contacts for this property (idempotent re-runs)
  // Preserve manually-added contacts
  await supabase.from('contacts').delete().eq('property_id', propertyId).eq('source', 'web_scrape')

  if (contacts.length === 0 && managementCompany) {
    // Insert a row with just the management company name
    const { error } = await supabase.from('contacts').insert({
      property_id: propertyId,
      management_company: managementCompany,
      source: 'web_scrape',
      verified: false,
    })
    if (error) console.error('Insert contact (company only) failed:', error.message)
    return 1
  }

  let inserted = 0
  for (const contact of contacts) {
    const { error } = await supabase.from('contacts').insert({
      property_id: propertyId,
      management_company: managementCompany,
      contact_name: contact.name,
      contact_title: contact.title,
      email: contact.email,
      phone: contact.phone,
      linkedin_url: contact.linkedin_url || null,
      source: 'web_scrape',
      verified: false,
    })
    if (error) {
      console.error(`Insert contact failed for ${contact.name}:`, error.message)
    } else {
      inserted++
    }
  }

  return inserted
}

// ── Read Leads ──────────────────────────────────────────────────────────

export async function getLeadsWithDetails() {
  const supabase = createServerClient()

  // Get all properties with their latest analyses and scores
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Fetch properties failed: ${error.message}`)
  if (!properties?.length) return []

  const propertyIds = properties.map(p => p.id)

  // Fetch related data in parallel
  const [analysesRes, scoresRes, contactsRes, reviewCountsRes] = await Promise.all([
    supabase.from('analyses').select('*').in('property_id', propertyIds),
    supabase.from('lead_scores').select('*').in('property_id', propertyIds),
    supabase.from('contacts').select('*').in('property_id', propertyIds),
    supabase.from('reviews').select('property_id').in('property_id', propertyIds),
  ])

  const analyses = analysesRes.data || []
  const scores = scoresRes.data || []
  const contacts = contactsRes.data || []

  // Build leads
  return properties.map(prop => {
    const propAnalyses = analyses.filter(a => a.property_id === prop.id)
    const propScore = scores.find(s => s.property_id === prop.id)
    const propContacts = contacts.filter(c => c.property_id === prop.id)

    const latestParking = propAnalyses
      .filter(a => a.analysis_type === 'parking')
      .sort((a, b) => new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime())[0] || null

    const latestUnits = propAnalyses
      .filter(a => a.analysis_type === 'units')
      .sort((a, b) => new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime())[0] || null

    const latestRentals = propAnalyses
      .filter(a => a.analysis_type === 'rentals')
      .sort((a, b) => new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime())[0] || null

    return {
      ...prop,
      latest_parking_analysis: latestParking,
      latest_units_analysis: latestUnits,
      latest_rentals_analysis: latestRentals,
      lead_score: propScore || null,
      contacts: propContacts,
      current_stage: propContacts.length > 0 ? 'enriched' : propScore ? 'scored' : latestParking ? 'analyzed' : 'scraped',
      outreach_count: 0,
    }
  })
}

// ── Outreach ────────────────────────────────────────────────────────────

export async function getOutreachWithDetails() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('outreach')
    .select(`
      id, subject, status, sent_at, opened_at, clicked_at,
      recipient_email, recipient_name,
      properties ( name ),
      contacts ( contact_name, email )
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Fetch outreach failed: ${error.message}`)
  return data || []
}

export async function createOutreach(params: {
  property_id: string | null
  contact_id: string | null
  subject: string
  body: string
  template?: string
  bigin_message_id?: string
  recipient_email?: string
  recipient_name?: string
}) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('outreach')
    .insert({
      property_id: params.property_id,
      contact_id: params.contact_id,
      subject: params.subject,
      body: params.body,
      template: params.template ?? 'initial_outreach',
      bigin_message_id: params.bigin_message_id ?? null,
      status: params.bigin_message_id ? 'sent' : 'draft',
      sent_at: params.bigin_message_id ? new Date().toISOString() : null,
      recipient_email: params.recipient_email ?? null,
      recipient_name: params.recipient_name ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Create outreach failed: ${error.message}`)
  return data
}

export async function updateContactBiginId(contactId: string, biginContactId: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('contacts')
    .update({ bigin_contact_id: biginContactId })
    .eq('id', contactId)
  if (error) throw new Error(`Update contact bigin id failed: ${error.message}`)
}

export async function getContactsWithEmail() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('contacts')
    .select(`
      id, contact_name, contact_title, email, phone,
      management_company, bigin_contact_id,
      properties ( id, name, city, state )
    `)
    .not('email', 'is', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Fetch contacts with email failed: ${error.message}`)
  return data || []
}

// ── Single property detail ───────────────────────────────────────────────

export async function getPropertyWithDetails(propertyId: string) {
  const supabase = createServerClient()

  const [propRes, analysesRes, scoreRes, contactsRes, reviewsRes] = await Promise.all([
    supabase.from('properties').select('*').eq('id', propertyId).single(),
    supabase.from('analyses').select('*').eq('property_id', propertyId),
    supabase.from('lead_scores').select('*').eq('property_id', propertyId).order('scored_at', { ascending: false }).limit(1),
    supabase.from('contacts').select('*').eq('property_id', propertyId),
    supabase.from('reviews').select('*').eq('property_id', propertyId).order('review_date', { ascending: false }),
  ])

  if (propRes.error || !propRes.data) return null

  const analyses = analysesRes.data || []
  return {
    property: propRes.data,
    analyses,
    latestParking: analyses.filter(a => a.analysis_type === 'parking').sort((a, b) => new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime())[0] || null,
    latestUnits: analyses.filter(a => a.analysis_type === 'units').sort((a, b) => new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime())[0] || null,
    latestRentals: analyses.filter(a => a.analysis_type === 'rentals').sort((a, b) => new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime())[0] || null,
    score: scoreRes.data?.[0] || null,
    contacts: contactsRes.data || [],
    reviews: reviewsRes.data || [],
  }
}
