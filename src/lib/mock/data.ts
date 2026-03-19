import type {
  Property,
  Review,
  Analysis,
  LeadScore,
  Contact,
  Outreach,
  PipelineStageRecord,
  LeadWithDetails,
} from '@/types/database'

// ── Gulf Coast Mock Properties ──────────────────────────────────────────

export const mockProperties: Property[] = [
  {
    id: 'p-001', outscraper_id: 'os-001', name: 'SeaChase', address: '25100 Perdido Beach Blvd',
    city: 'Orange Beach', state: 'AL', zip: '36561', latitude: 30.2635, longitude: -87.6386,
    google_rating: 4.3, review_count: 487, website: 'https://seachase.com', phone: '(251) 981-4100',
    google_place_id: 'gp-001', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-002', outscraper_id: 'os-002', name: 'Turquoise Place', address: '26302 Perdido Beach Blvd',
    city: 'Orange Beach', state: 'AL', zip: '36561', latitude: 30.2589, longitude: -87.6512,
    google_rating: 4.6, review_count: 1203, website: 'https://turquoiseplace.com', phone: '(251) 981-1300',
    google_place_id: 'gp-002', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-003', outscraper_id: 'os-003', name: 'Phoenix West II', address: '25300 Perdido Beach Blvd',
    city: 'Orange Beach', state: 'AL', zip: '36561', latitude: 30.2628, longitude: -87.6400,
    google_rating: 4.4, review_count: 342, website: 'https://phoenixwestii.com', phone: '(251) 974-1600',
    google_place_id: 'gp-003', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-004', outscraper_id: 'os-004', name: 'Treasure Island Resort', address: '16701 Front Beach Rd',
    city: 'Panama City Beach', state: 'FL', zip: '32413', latitude: 30.1766, longitude: -85.8055,
    google_rating: 4.1, review_count: 892, website: 'https://treasureislandpcb.com', phone: '(850) 234-2232',
    google_place_id: 'gp-004', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-005', outscraper_id: 'os-005', name: 'Sterling Shores', address: '1751 Scenic Hwy 98',
    city: 'Destin', state: 'FL', zip: '32541', latitude: 30.3832, longitude: -86.4958,
    google_rating: 4.5, review_count: 256, website: 'https://sterlingshores.com', phone: '(850) 837-1700',
    google_place_id: 'gp-005', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-006', outscraper_id: 'os-006', name: 'Grand Caribbean', address: '8743 Thomas Dr',
    city: 'Panama City Beach', state: 'FL', zip: '32408', latitude: 30.1710, longitude: -85.7622,
    google_rating: 3.9, review_count: 621, website: null, phone: '(850) 234-6671',
    google_place_id: 'gp-006', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-007', outscraper_id: 'os-007', name: 'Pelican Beach Resort', address: '1002 Hwy 98 E',
    city: 'Destin', state: 'FL', zip: '32541', latitude: 30.3890, longitude: -86.4780,
    google_rating: 4.2, review_count: 578, website: 'https://pelicanbeach.com', phone: '(850) 654-1425',
    google_place_id: 'gp-007', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-008', outscraper_id: 'os-008', name: 'Majestic Sun', address: '660 Scenic Gulf Dr',
    city: 'Miramar Beach', state: 'FL', zip: '32550', latitude: 30.3766, longitude: -86.3690,
    google_rating: 4.4, review_count: 412, website: 'https://majesticsun.com', phone: '(850) 837-5300',
    google_place_id: 'gp-008', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-009', outscraper_id: 'os-009', name: 'Emerald Isle', address: '770 Sundial Ct',
    city: 'Fort Walton Beach', state: 'FL', zip: '32548', latitude: 30.3725, longitude: -86.6128,
    google_rating: 4.0, review_count: 189, website: null, phone: '(850) 862-2000',
    google_place_id: 'gp-009', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-010', outscraper_id: 'os-010', name: 'Portofino Island Resort', address: '10 Portofino Dr',
    city: 'Pensacola Beach', state: 'FL', zip: '32561', latitude: 30.3317, longitude: -87.1292,
    google_rating: 4.3, review_count: 1547, website: 'https://portofinoisland.com', phone: '(850) 916-5000',
    google_place_id: 'gp-010', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-011', outscraper_id: 'os-011', name: 'Calypso Resort & Towers', address: '15817 Front Beach Rd',
    city: 'Panama City Beach', state: 'FL', zip: '32413', latitude: 30.1771, longitude: -85.8280,
    google_rating: 4.2, review_count: 734, website: 'https://calypsoresort.com', phone: '(850) 234-3456',
    google_place_id: 'gp-011', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-012', outscraper_id: 'os-012', name: 'Tidewater Beach Resort', address: '16819 Front Beach Rd',
    city: 'Panama City Beach', state: 'FL', zip: '32413', latitude: 30.1762, longitude: -85.8041,
    google_rating: 4.3, review_count: 523, website: 'https://tidewaterbeachresort.com', phone: '(850) 588-8000',
    google_place_id: 'gp-012', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-013', outscraper_id: 'os-013', name: 'Perdido Towers', address: '28103 Perdido Beach Blvd',
    city: 'Orange Beach', state: 'AL', zip: '36561', latitude: 30.2544, longitude: -87.6700,
    google_rating: 3.8, review_count: 156, website: null, phone: '(251) 981-2667',
    google_place_id: 'gp-013', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-014', outscraper_id: 'os-014', name: 'Crystal Tower', address: '1051 W Beach Blvd',
    city: 'Gulf Shores', state: 'AL', zip: '36542', latitude: 30.2441, longitude: -87.7000,
    google_rating: 4.1, review_count: 298, website: 'https://crystaltower.com', phone: '(251) 948-6400',
    google_place_id: 'gp-014', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-015', outscraper_id: 'os-015', name: 'Beach Club Resort', address: '925 W Beach Blvd',
    city: 'Gulf Shores', state: 'AL', zip: '36542', latitude: 30.2448, longitude: -87.6955,
    google_rating: 4.5, review_count: 867, website: 'https://beachclubal.com', phone: '(251) 540-2500',
    google_place_id: 'gp-015', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-016', outscraper_id: 'os-016', name: 'Ariel Dunes', address: '660 Scenic Gulf Dr',
    city: 'Miramar Beach', state: 'FL', zip: '32550', latitude: 30.3770, longitude: -86.3685,
    google_rating: 4.3, review_count: 201, website: null, phone: '(850) 837-9800',
    google_place_id: 'gp-016', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-017', outscraper_id: 'os-017', name: 'Shores of Panama', address: '9900 S Thomas Dr',
    city: 'Panama City Beach', state: 'FL', zip: '32408', latitude: 30.1680, longitude: -85.7544,
    google_rating: 4.0, review_count: 1089, website: 'https://shoresofpanama.com', phone: '(850) 588-8206',
    google_place_id: 'gp-017', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-018', outscraper_id: 'os-018', name: 'Emerald Grande', address: '10 Harbor Blvd',
    city: 'Destin', state: 'FL', zip: '32541', latitude: 30.3945, longitude: -86.5120,
    google_rating: 4.6, review_count: 956, website: 'https://emeraldgrande.com', phone: '(850) 337-8700',
    google_place_id: 'gp-018', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-019', outscraper_id: 'os-019', name: 'Summerwinds Resort', address: '17751 Front Beach Rd',
    city: 'Panama City Beach', state: 'FL', zip: '32413', latitude: 30.1808, longitude: -85.7900,
    google_rating: 3.7, review_count: 334, website: null, phone: '(850) 234-1004',
    google_place_id: 'gp-019', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-020', outscraper_id: 'os-020', name: 'Caribe Resort', address: '28103 Perdido Beach Blvd',
    city: 'Orange Beach', state: 'AL', zip: '36561', latitude: 30.2555, longitude: -87.6680,
    google_rating: 4.4, review_count: 678, website: 'https://cariberesort.com', phone: '(251) 923-0100',
    google_place_id: 'gp-020', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-021', outscraper_id: 'os-021', name: 'Palms of Destin', address: '4203 Indian Bayou Trail',
    city: 'Destin', state: 'FL', zip: '32541', latitude: 30.3900, longitude: -86.4810,
    google_rating: 4.2, review_count: 145, website: null, phone: '(850) 650-7400',
    google_place_id: 'gp-021', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-022', outscraper_id: 'os-022', name: 'Island Tower', address: '6 Fourth St',
    city: 'Gulf Shores', state: 'AL', zip: '36542', latitude: 30.2460, longitude: -87.6870,
    google_rating: 4.0, review_count: 217, website: null, phone: '(251) 948-5555',
    google_place_id: 'gp-022', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-023', outscraper_id: 'os-023', name: 'Lighthouse Condo', address: '455 E Beach Blvd',
    city: 'Gulf Shores', state: 'AL', zip: '36542', latitude: 30.2430, longitude: -87.6810,
    google_rating: 4.3, review_count: 445, website: 'https://lighthousecondo.com', phone: '(251) 948-6000',
    google_place_id: 'gp-023', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-024', outscraper_id: 'os-024', name: 'Sandestin Golf & Beach Resort', address: '9300 Emerald Coast Pkwy',
    city: 'Miramar Beach', state: 'FL', zip: '32550', latitude: 30.3792, longitude: -86.3620,
    google_rating: 4.1, review_count: 2341, website: 'https://sandestin.com', phone: '(850) 267-8000',
    google_place_id: 'gp-024', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
  {
    id: 'p-025', outscraper_id: 'os-025', name: 'Margaritaville Beach Hotel', address: '165 Fort Pickens Rd',
    city: 'Pensacola Beach', state: 'FL', zip: '32561', latitude: 30.3290, longitude: -87.1380,
    google_rating: 4.5, review_count: 3211, website: 'https://margaritavilleresorts.com', phone: '(850) 916-9755',
    google_place_id: 'gp-025', source: 'outscraper', scraped_at: '2026-03-10T06:00:00Z',
    created_at: '2026-03-10T06:00:00Z', updated_at: '2026-03-10T06:00:00Z',
  },
]

// ── Mock Reviews (sample per property) ──────────────────────────────────

const parkingReviews = [
  'Great condo but the parking situation is terrible. Not enough spaces for all the guests and we had to park on the street.',
  'Love the beach access! However, the paper parking passes are confusing. We got a warning for not displaying it correctly.',
  'Beautiful property but watch out - they WILL tow your car if you don\'t have the right parking pass. Very strict.',
  'Parking is a nightmare here during peak season. Security patrols constantly checking for passes.',
  'The parking pass system needs to be modernized. It\'s all paper-based and confusing for guests checking in.',
  'We were ticketed for parking in the wrong spot even though we had a valid pass. The system is broken.',
  'Nice resort but parking costs $45/day on top of the rental fee. Seems excessive.',
  'Security was checking parking passes at 6 AM! The paper system with windshield stickers is outdated.',
  'Unauthorized vehicles get towed without warning. Make sure your rental company gives you the pass code.',
  'The parking garage is always full. Had to carry beach gear from overflow parking 3 blocks away.',
]

const positiveReviews = [
  'Amazing views and great amenities. The pool area is fantastic!',
  'We had a wonderful family vacation. The condo was clean and well-maintained.',
  'Beautiful sunrise views every morning. Will definitely come back!',
  'Perfect location, right on the beach. Kids loved the pool.',
  'Great value for a beachfront property. The staff was very helpful.',
]

function generateReviews(propertyId: string, hasParkingIssues: boolean): Review[] {
  const reviews: Review[] = []
  const numReviews = 5 + Math.floor(Math.random() * 10)

  for (let i = 0; i < numReviews; i++) {
    const isParkingReview = hasParkingIssues && i < 3 + Math.floor(Math.random() * 3)
    const reviewPool = isParkingReview ? parkingReviews : positiveReviews
    const text = reviewPool[Math.floor(Math.random() * reviewPool.length)]
    reviews.push({
      id: `r-${propertyId}-${i}`,
      property_id: propertyId,
      review_text: text,
      reviewer_name: `Reviewer ${i + 1}`,
      rating: isParkingReview ? (2 + Math.floor(Math.random() * 2)) : (4 + Math.floor(Math.random() * 2)),
      review_date: `2026-0${1 + Math.floor(Math.random() * 3)}-${10 + Math.floor(Math.random() * 18)}T00:00:00Z`,
      outscraper_review_id: `or-${propertyId}-${i}`,
      scraped_at: '2026-03-10T06:00:00Z',
      created_at: '2026-03-10T06:00:00Z',
    })
  }
  return reviews
}

// Properties with parking issues (these get high scores)
const parkingIssuePropertyIds = ['p-001', 'p-004', 'p-005', 'p-006', 'p-007', 'p-010', 'p-011', 'p-013', 'p-017', 'p-019', 'p-020', 'p-023', 'p-024']

export const mockReviews: Review[] = mockProperties.flatMap(p =>
  generateReviews(p.id, parkingIssuePropertyIds.includes(p.id))
)

// ── Mock Analyses ───────────────────────────────────────────────────────

export const mockAnalyses: Analysis[] = mockProperties.flatMap(p => {
  const hasParkingIssues = parkingIssuePropertyIds.includes(p.id)
  const parkingScore = hasParkingIssues ? 6 + Math.random() * 4 : Math.random() * 4
  const unitBase = [60, 80, 100, 120, 150, 180, 200, 240, 280, 320]
  const units = unitBase[Math.floor(Math.random() * unitBase.length)]
  const hasRentals = Math.random() > 0.2 // 80% have vacation rentals

  return [
    {
      id: `a-parking-${p.id}`,
      property_id: p.id,
      analysis_type: 'parking' as const,
      parking_score: Math.round(parkingScore * 10) / 10,
      parking_complaints: hasParkingIssues ? [
        { review_excerpt: 'parking situation is terrible', category: 'not_enough_spaces', severity: 8 },
        { review_excerpt: 'paper parking passes are confusing', category: 'parking_passes', severity: 7 },
        { review_excerpt: 'they WILL tow your car', category: 'towing', severity: 9 },
      ] : [],
      parking_categories: hasParkingIssues
        ? { not_enough_spaces: 3, parking_passes: 4, towing: 2, confusion: 3, security_ticketing: 2 }
        : { not_enough_spaces: 0, parking_passes: 0, towing: 0, confusion: 0, security_ticketing: 0 },
      estimated_units: null,
      unit_confidence: null,
      unit_evidence: null,
      has_vacation_rentals: null,
      rental_evidence: null,
      rental_platforms: null,
      model_used: 'claude-sonnet-4-20250514',
      raw_response: null,
      analyzed_at: '2026-03-10T07:00:00Z',
      created_at: '2026-03-10T07:00:00Z',
    },
    {
      id: `a-units-${p.id}`,
      property_id: p.id,
      analysis_type: 'units' as const,
      parking_score: null,
      parking_complaints: null,
      parking_categories: null,
      estimated_units: units,
      unit_confidence: units > 100 ? 'high' : 'medium',
      unit_evidence: `Based on building size and public records, estimated ${units} units.`,
      has_vacation_rentals: null,
      rental_evidence: null,
      rental_platforms: null,
      model_used: 'claude-sonnet-4-20250514',
      raw_response: null,
      analyzed_at: '2026-03-10T07:00:00Z',
      created_at: '2026-03-10T07:00:00Z',
    },
    {
      id: `a-rentals-${p.id}`,
      property_id: p.id,
      analysis_type: 'rentals' as const,
      parking_score: null,
      parking_complaints: null,
      parking_categories: null,
      estimated_units: null,
      unit_confidence: null,
      unit_evidence: null,
      has_vacation_rentals: hasRentals,
      rental_evidence: hasRentals ? 'Multiple listings found on Airbnb and VRBO' : 'No vacation rental listings found',
      rental_platforms: hasRentals ? ['airbnb', 'vrbo'] : [],
      model_used: 'claude-sonnet-4-20250514',
      raw_response: null,
      analyzed_at: '2026-03-10T07:00:00Z',
      created_at: '2026-03-10T07:00:00Z',
    },
  ]
})

// ── Mock Lead Scores ────────────────────────────────────────────────────

export const mockLeadScores: LeadScore[] = mockProperties.map(p => {
  const parkingAnalysis = mockAnalyses.find(a => a.property_id === p.id && a.analysis_type === 'parking')!
  const unitsAnalysis = mockAnalyses.find(a => a.property_id === p.id && a.analysis_type === 'units')!
  const rentalsAnalysis = mockAnalyses.find(a => a.property_id === p.id && a.analysis_type === 'rentals')!

  const breakdown: Record<string, number> = {}
  let total = 0

  const units = unitsAnalysis.estimated_units ?? 0
  if (units >= 50 && units <= 200) { breakdown.units_50_200 = 25; total += 25 }
  else if (units > 200 && units <= 350) { breakdown.units_200_350 = 15; total += 15 }

  if (rentalsAnalysis.has_vacation_rentals) { breakdown.vacation_rentals = 20; total += 20 }

  const ps = parkingAnalysis.parking_score ?? 0
  if (ps >= 7) { breakdown.parking_complaints = 20; total += 20 }
  else if (ps >= 4) { const s = Math.round(20 * (ps / 10)); breakdown.parking_complaints = s; total += s }

  if ((parkingAnalysis.parking_categories as Record<string, number>)?.security_ticketing > 0) {
    breakdown.security_patrol = 15; total += 15
  }

  const mentions = parkingAnalysis.parking_complaints?.length ?? 0
  if (mentions > 0) {
    const pts = Math.min(10, Math.round(10 * (mentions / 5)))
    breakdown.google_parking_mentions = pts; total += pts
  }

  const score = Math.min(100, total)
  const tier = score >= 80 ? 'immediate' : score >= 60 ? 'nurture' : score >= 40 ? 'monitor' : 'disqualified'

  return {
    id: `ls-${p.id}`,
    property_id: p.id,
    score,
    tier: tier as LeadScore['tier'],
    score_breakdown: breakdown,
    manual_override: false,
    override_reason: null,
    scored_at: '2026-03-10T07:30:00Z',
    created_at: '2026-03-10T07:30:00Z',
  }
})

// ── Mock Contacts ───────────────────────────────────────────────────────

const managementCompanies = [
  { company: 'Waves Association Management', name: 'Lynda Smith', email: 'lsmith@wavesam.com' },
  { company: 'ResortQuest by Wyndham', name: 'Mike Turner', email: 'mturner@resortquest.com' },
  { company: 'CAMS (Community Association Mgmt)', name: 'Jennifer Davis', email: 'jdavis@camsmgmt.com' },
  { company: 'Associa Gulf Coast', name: 'Robert Chen', email: 'rchen@associa.com' },
  { company: 'FirstService Residential', name: 'Amanda Johnson', email: 'ajohnson@fsresidential.com' },
  { company: 'Seawind Association Mgmt', name: 'David Williams', email: 'dwilliams@seawindmgmt.com' },
]

export const mockContacts: Contact[] = mockProperties.map((p, i) => {
  const mgmt = managementCompanies[i % managementCompanies.length]
  return {
    id: `c-${p.id}`,
    property_id: p.id,
    management_company: mgmt.company,
    contact_name: mgmt.name,
    contact_title: 'Property Manager',
    email: mgmt.email,
    phone: p.phone,
    linkedin_url: null,
    source: 'manual' as const,
    verified: Math.random() > 0.5,
    created_at: '2026-03-10T08:00:00Z',
    updated_at: '2026-03-10T08:00:00Z',
  }
})

// ── Mock Outreach ───────────────────────────────────────────────────────

export const mockOutreach: Outreach[] = mockLeadScores
  .filter(ls => ls.tier === 'immediate')
  .slice(0, 5)
  .map((ls, i) => {
    const prop = mockProperties.find(p => p.id === ls.property_id)!
    const contact = mockContacts.find(c => c.property_id === ls.property_id)!
    const statuses: Outreach['status'][] = ['sent', 'opened', 'clicked', 'replied', 'sent']
    return {
      id: `o-${i}`,
      property_id: ls.property_id,
      contact_id: contact.id,
      template: 'initial',
      subject: `Parking modernization for ${prop.name}`,
      body: `Hi ${contact.contact_name},\n\nWe work with several Gulf Coast condo associations to modernize their parking systems using license plate registration instead of paper passes.\n\nBest,\nSean`,
      status: statuses[i],
      sent_at: '2026-03-12T10:00:00Z',
      opened_at: i < 3 ? '2026-03-12T14:00:00Z' : null,
      clicked_at: i === 2 ? '2026-03-12T14:05:00Z' : null,
      resend_message_id: `rsnd-${i}`,
      created_at: '2026-03-12T10:00:00Z',
    }
  })

// ── Aggregated Lead Data ────────────────────────────────────────────────

export const mockLeadsWithDetails: LeadWithDetails[] = mockProperties.map(p => {
  const parkingAnalysis = mockAnalyses.find(a => a.property_id === p.id && a.analysis_type === 'parking') ?? null
  const unitsAnalysis = mockAnalyses.find(a => a.property_id === p.id && a.analysis_type === 'units') ?? null
  const rentalsAnalysis = mockAnalyses.find(a => a.property_id === p.id && a.analysis_type === 'rentals') ?? null
  const leadScore = mockLeadScores.find(ls => ls.property_id === p.id) ?? null
  const contacts = mockContacts.filter(c => c.property_id === p.id)
  const outreachCount = mockOutreach.filter(o => o.property_id === p.id).length

  return {
    ...p,
    latest_parking_analysis: parkingAnalysis,
    latest_units_analysis: unitsAnalysis,
    latest_rentals_analysis: rentalsAnalysis,
    lead_score: leadScore,
    contacts,
    current_stage: outreachCount > 0 ? 'outreach_sent' : leadScore ? 'scored' : 'scraped',
    outreach_count: outreachCount,
  }
})

// ── Pipeline Stats ──────────────────────────────────────────────────────

export function getMockPipelineStats() {
  const leads = mockLeadsWithDetails
  return {
    total: leads.length,
    immediate: leads.filter(l => l.lead_score?.tier === 'immediate').length,
    nurture: leads.filter(l => l.lead_score?.tier === 'nurture').length,
    monitor: leads.filter(l => l.lead_score?.tier === 'monitor').length,
    disqualified: leads.filter(l => l.lead_score?.tier === 'disqualified').length,
    outreachSent: mockOutreach.filter(o => o.status !== 'draft').length,
    opened: mockOutreach.filter(o => o.opened_at).length,
    replied: mockOutreach.filter(o => o.status === 'replied').length,
    byCity: Object.entries(
      leads.reduce((acc, l) => {
        const city = l.city || 'Unknown'
        acc[city] = (acc[city] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([city, count]) => ({ city, count })),
    scoreDistribution: [
      { range: '80-100', count: leads.filter(l => (l.lead_score?.score ?? 0) >= 80).length },
      { range: '60-79', count: leads.filter(l => (l.lead_score?.score ?? 0) >= 60 && (l.lead_score?.score ?? 0) < 80).length },
      { range: '40-59', count: leads.filter(l => (l.lead_score?.score ?? 0) >= 40 && (l.lead_score?.score ?? 0) < 60).length },
      { range: '0-39', count: leads.filter(l => (l.lead_score?.score ?? 0) < 40).length },
    ],
  }
}
