import { NextRequest } from 'next/server'
import { detectVacationRentals } from '@/lib/ai/prompts/rental-detection'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyName, city, state, reviews } = body as {
      propertyName: string
      city: string
      state: string
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

    const { result, model } = await detectVacationRentals(
      propertyName,
      city || '',
      state || '',
      reviews
    )

    return Response.json({
      success: true,
      analysis: result,
      model,
    })
  } catch (error) {
    console.error('Rental detection failed:', error)
    return Response.json(
      { error: 'Analysis failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
