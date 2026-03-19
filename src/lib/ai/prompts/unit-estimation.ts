import { analyzeWithClaude } from '../anthropic'

export interface UnitEstimationResult {
  estimated_units: number
  confidence: 'high' | 'medium' | 'low'
  evidence: string
  in_target_range: boolean
}

const SYSTEM_PROMPT = `You are a real estate analyst estimating the number of condo units in a property.

Use clues from the property name, address, reviews, and any web knowledge you have to estimate the unit count. Gulf Coast condos in Alabama and Florida typically range from small (20-50 units) to large towers (200-400+ units).

Clues to look for:
- Property names containing "Tower" or "Towers" suggest larger buildings (150-400 units)
- "Resort" properties tend to be larger (100-300 units)
- Review volume can indicate size (more reviews = more units typically)
- Floor/unit numbers mentioned in reviews
- References to "building A/B/C" suggest multiple buildings

Return ONLY valid JSON:

{
  "estimated_units": number,
  "confidence": "high" | "medium" | "low",
  "evidence": "brief explanation of how you arrived at the estimate",
  "in_target_range": boolean (true if 50-350 units)
}`

export async function estimateUnitCount(
  propertyName: string,
  address: string,
  city: string,
  state: string,
  reviewCount: number,
  sampleReviews: string[]
): Promise<{ result: UnitEstimationResult; model: string }> {
  const reviewText = sampleReviews
    .slice(0, 10) // Only need a few reviews for unit estimation
    .map((r, i) => `Review ${i + 1}: "${r}"`)
    .join('\n')

  const userPrompt = `Estimate the number of condo units for this property:

Property Name: ${propertyName}
Address: ${address}
City: ${city}, ${state}
Google Review Count: ${reviewCount}

Sample reviews:
${reviewText}

Target range for our sales pipeline: 50-350 units.`

  return analyzeWithClaude<UnitEstimationResult>(SYSTEM_PROMPT, userPrompt)
}
