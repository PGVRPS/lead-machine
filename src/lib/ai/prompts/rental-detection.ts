import { analyzeWithClaude } from '../anthropic'

export interface RentalDetectionResult {
  has_vacation_rentals: boolean
  confidence: 'high' | 'medium' | 'low'
  evidence: string
  platforms: string[]
  rental_indicators: string[]
}

const SYSTEM_PROMPT = `You are analyzing whether a condo property allows vacation rentals (short-term rentals).

Look for evidence of:
- Airbnb, VRBO, Booking.com, or other platform mentions
- "Vacation rental" or "short-term rental" references
- Reviews mentioning they "rented" or "booked" the unit
- Check-in/check-out procedures typical of rentals
- Rental management company references
- "Owner" vs "guest/renter" distinctions in reviews
- References to rental programs or rental pools

Gulf Coast condos frequently allow vacation rentals — most beachfront condos do.

Return ONLY valid JSON:

{
  "has_vacation_rentals": boolean,
  "confidence": "high" | "medium" | "low",
  "evidence": "brief explanation with specific references",
  "platforms": ["airbnb", "vrbo", etc.],
  "rental_indicators": ["list of specific phrases from reviews that indicate rental activity"]
}`

export async function detectVacationRentals(
  propertyName: string,
  city: string,
  state: string,
  reviews: string[]
): Promise<{ result: RentalDetectionResult; model: string }> {
  const reviewText = reviews
    .slice(0, 30) // 30 reviews is enough for rental detection
    .map((r, i) => `Review ${i + 1}: "${r}"`)
    .join('\n')

  const userPrompt = `Determine whether this condo property allows vacation rentals:

Property: ${propertyName}
Location: ${city}, ${state}

Reviews:
${reviewText}

Look for any references to Airbnb, VRBO, vacation rental, short-term rental, booking, rental management, or rental programs.`

  return analyzeWithClaude<RentalDetectionResult>(SYSTEM_PROMPT, userPrompt)
}
