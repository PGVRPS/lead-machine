import { analyzeWithClaude } from '../anthropic'

export interface ParkingAnalysisResult {
  parking_issue: boolean
  severity_score: number
  total_parking_mentions: number
  complaints: Array<{
    review_excerpt: string
    category: string
    severity: number
  }>
  category_counts: {
    parking_passes: number
    not_enough_spaces: number
    confusion: number
    towing: number
    security_ticketing: number
    unauthorized_parking: number
    pass_cost: number
  }
  summary: string
}

const SYSTEM_PROMPT = `You are an expert analyst for a parking technology company called VRPS. Your job is to analyze Google reviews of condo properties and detect parking-related complaints.

You must return ONLY valid JSON matching this exact structure (no other text):

{
  "parking_issue": boolean,
  "severity_score": number (0-10),
  "total_parking_mentions": number,
  "complaints": [
    {
      "review_excerpt": "exact quote from review",
      "category": "one of: parking_passes, not_enough_spaces, confusion, towing, security_ticketing, unauthorized_parking, pass_cost",
      "severity": number (1-10)
    }
  ],
  "category_counts": {
    "parking_passes": number,
    "not_enough_spaces": number,
    "confusion": number,
    "towing": number,
    "security_ticketing": number,
    "unauthorized_parking": number,
    "pass_cost": number
  },
  "summary": "one paragraph summary of parking situation"
}

Scoring guidelines:
- 0: No parking mentions at all
- 1-3: Minor mentions, generally positive or neutral
- 4-6: Some complaints but not a major issue
- 7-8: Significant parking problems, multiple complaint categories
- 9-10: Severe, pervasive parking issues across many reviews

Be precise with excerpts — use the actual text from the reviews.`

export async function analyzeParkingComplaints(
  propertyName: string,
  reviews: string[]
): Promise<{ result: ParkingAnalysisResult; model: string }> {
  const reviewText = reviews
    .slice(0, 200) // Cap at 200 reviews
    .map((r, i) => `Review ${i + 1}: "${r}"`)
    .join('\n\n')

  const userPrompt = `Analyze the following ${reviews.length} Google reviews for the condo property "${propertyName}".

Identify all parking-related complaints and score the overall parking complaint severity.

${reviewText}`

  return analyzeWithClaude<ParkingAnalysisResult>(SYSTEM_PROMPT, userPrompt)
}
