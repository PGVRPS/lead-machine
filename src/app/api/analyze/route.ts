import { NextRequest } from 'next/server'
import { analyzeParkingComplaints } from '@/lib/ai/prompts/parking-detection'
import { estimateUnitCount } from '@/lib/ai/prompts/unit-estimation'
import { detectVacationRentals } from '@/lib/ai/prompts/rental-detection'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyName, address, city, state, reviewCount, reviews } = body as {
      propertyName: string
      address: string
      city: string
      state: string
      reviewCount: number
      reviews: string[]
    }

    if (!propertyName || !reviews?.length) {
      return Response.json(
        { error: 'propertyName and reviews[] are required' },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Run all three analyses in parallel
    const [parkingResult, unitsResult, rentalsResult] = await Promise.all([
      analyzeParkingComplaints(propertyName, reviews),
      estimateUnitCount(propertyName, address || '', city || '', state || '', reviewCount || 0, reviews.slice(0, 10)),
      detectVacationRentals(propertyName, city || '', state || '', reviews),
    ])

    return Response.json({
      success: true,
      parking: parkingResult.result,
      units: unitsResult.result,
      rentals: rentalsResult.result,
      model: parkingResult.model,
    })
  } catch (error) {
    console.error('Full analysis failed:', error)
    return Response.json(
      { error: 'Analysis failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
