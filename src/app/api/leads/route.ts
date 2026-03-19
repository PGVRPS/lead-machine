import { getLeadsWithDetails } from '@/lib/supabase/db'

export async function GET() {
  try {
    const leads = await getLeadsWithDetails()
    return Response.json({ leads, count: leads.length })
  } catch (error) {
    console.error('Failed to fetch leads:', error)
    return Response.json({ error: (error as Error).message, leads: [], count: 0 }, { status: 500 })
  }
}
