import type { Analysis, LeadTier } from '@/types/database'
import { DEFAULT_SCORING_WEIGHTS, DEFAULT_TIER_THRESHOLDS } from './config'

export interface ScoreInput {
  estimatedUnits: number | null
  hasVacationRentals: boolean
  parkingScore: number // 0-10 from AI analysis
  securityPatrolMentioned: boolean
  passPriceMentioned: number | null // dollar amount if detected
  googleParkingMentions: number // count of reviews mentioning parking
}

export interface ScoringWeights {
  units_50_200: number
  units_200_350: number
  vacation_rentals: number
  parking_complaints: number
  security_patrol: number
  pass_price_40_plus: number
  google_parking_mentions: number
}

export interface TierThresholds {
  immediate: number
  nurture: number
  monitor: number
}

export interface ScoreResult {
  score: number
  tier: LeadTier
  breakdown: Record<string, number>
}

export function calculateLeadScore(
  input: ScoreInput,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  thresholds: TierThresholds = DEFAULT_TIER_THRESHOLDS
): ScoreResult {
  const breakdown: Record<string, number> = {}
  let total = 0

  // Unit count scoring
  if (input.estimatedUnits !== null) {
    if (input.estimatedUnits >= 50 && input.estimatedUnits <= 200) {
      breakdown.units_50_200 = weights.units_50_200
      total += weights.units_50_200
    } else if (input.estimatedUnits > 200 && input.estimatedUnits <= 350) {
      breakdown.units_200_350 = weights.units_200_350
      total += weights.units_200_350
    }
  }

  // Vacation rentals
  if (input.hasVacationRentals) {
    breakdown.vacation_rentals = weights.vacation_rentals
    total += weights.vacation_rentals
  }

  // Parking complaints (score 7+ from AI = full points, scale below that)
  if (input.parkingScore >= 7) {
    breakdown.parking_complaints = weights.parking_complaints
    total += weights.parking_complaints
  } else if (input.parkingScore >= 4) {
    const scaled = Math.round(weights.parking_complaints * (input.parkingScore / 10))
    breakdown.parking_complaints = scaled
    total += scaled
  }

  // Security patrol
  if (input.securityPatrolMentioned) {
    breakdown.security_patrol = weights.security_patrol
    total += weights.security_patrol
  }

  // Pass price $40+
  if (input.passPriceMentioned !== null && input.passPriceMentioned >= 40) {
    breakdown.pass_price_40_plus = weights.pass_price_40_plus
    total += weights.pass_price_40_plus
  }

  // Google review parking mentions
  if (input.googleParkingMentions > 0) {
    const mentionPoints = Math.min(
      weights.google_parking_mentions,
      Math.round(weights.google_parking_mentions * (input.googleParkingMentions / 5))
    )
    breakdown.google_parking_mentions = mentionPoints
    total += mentionPoints
  }

  // Cap at 100
  const score = Math.min(100, total)

  // Determine tier
  let tier: LeadTier
  if (score >= thresholds.immediate) {
    tier = 'immediate'
  } else if (score >= thresholds.nurture) {
    tier = 'nurture'
  } else if (score >= thresholds.monitor) {
    tier = 'monitor'
  } else {
    tier = 'disqualified'
  }

  return { score, tier, breakdown }
}

export function buildScoreInput(
  parkingAnalysis: Analysis | null,
  unitsAnalysis: Analysis | null,
  rentalsAnalysis: Analysis | null,
  reviewCount: number
): ScoreInput {
  return {
    estimatedUnits: unitsAnalysis?.estimated_units ?? null,
    hasVacationRentals: rentalsAnalysis?.has_vacation_rentals ?? false,
    parkingScore: parkingAnalysis?.parking_score ?? 0,
    securityPatrolMentioned: parkingAnalysis?.parking_categories?.['security_ticketing']
      ? parkingAnalysis.parking_categories['security_ticketing'] > 0
      : false,
    passPriceMentioned: null, // Extracted from reviews if available
    googleParkingMentions: parkingAnalysis?.parking_complaints?.length ?? 0,
  }
}
