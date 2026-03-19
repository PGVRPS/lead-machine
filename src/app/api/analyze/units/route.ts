import { NextRequest } from 'next/server'
import { estimateUnitCount } from '@/lib/ai/prompts/unit-estimation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyName, address, city, state, reviewCount, sampleReviews } = body as {
      propertyName: string
      address: string
      city: string
      state: string
      reviewCount: number
      sampleReviews: string[]
    }

    if (!propertyName) {
      return Response.json(
        { error: 'propertyName is required' },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      )
    }

    const { result, model } = await estimateUnitCount(
      propertyName,
      address || '',
      city || '',
      state || '',
      reviewCount || 0,
      sampleReviews || []
    )

    return Response.json({
      success: true,
      analysis: result,
      model,
    })
  } catch (error) {
    console.error('Unit estimation failed:', error)
    return Response.json(
      { error: 'Analysis failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
