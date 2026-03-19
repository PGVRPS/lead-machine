export const DEFAULT_SCORING_WEIGHTS = {
  units_50_200: 25,
  units_200_350: 15,
  vacation_rentals: 20,
  parking_complaints: 20,
  security_patrol: 15,
  pass_price_40_plus: 10,
  google_parking_mentions: 10,
} as const

export const DEFAULT_TIER_THRESHOLDS = {
  immediate: 80,
  nurture: 60,
  monitor: 40,
} as const

export const GULF_COAST_REGIONS = [
  'Gulf Shores, AL',
  'Orange Beach, AL',
  'Pensacola Beach, FL',
  'Destin, FL',
  'Miramar Beach, FL',
  'Fort Walton Beach, FL',
  'Panama City Beach, FL',
] as const

export const SEARCH_TERMS = [
  'condominium complex',
  'condo resort',
  'beach condo',
  'vacation rental condo',
  'condominium association',
  'beach resort condominiums',
] as const
