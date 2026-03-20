import { getScrapeConfig, updateScrapeConfig } from '@/lib/supabase/db'

export async function GET() {
  try {
    const config = await getScrapeConfig()
    return Response.json(config)
  } catch (error) {
    console.error('Failed to fetch scrape config:', error)
    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { regions, searchTerms, scoringWeights, tierThresholds } = body

    if (!Array.isArray(regions) || !Array.isArray(searchTerms)) {
      return Response.json(
        { error: 'regions and searchTerms must be arrays' },
        { status: 400 }
      )
    }

    await updateScrapeConfig(regions, searchTerms, scoringWeights, tierThresholds)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to update scrape config:', error)
    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
