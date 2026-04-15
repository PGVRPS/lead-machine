import { NextResponse } from 'next/server'
import { getOutreachWithDetails, getContactsWithEmail } from '@/lib/supabase/db'

export async function GET() {
  try {
    const [outreach, contacts] = await Promise.all([
      getOutreachWithDetails(),
      getContactsWithEmail(),
    ])
    return NextResponse.json({ outreach, contacts })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[GET /api/outreach]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
