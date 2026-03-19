import { getLeadsWithDetails } from '@/lib/supabase/db'
import LeadTable from '@/components/leads/LeadTable'
import Link from 'next/link'
import { Radar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  let leads: Awaited<ReturnType<typeof getLeadsWithDetails>> = []
  try {
    leads = await getLeadsWithDetails()
  } catch {
    // Supabase not connected
  }

  if (leads.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">All scraped and scored condo properties</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Radar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600">No leads yet</h3>
          <p className="text-sm text-gray-400 mt-1">Run a scrape to populate your lead pipeline.</p>
          <Link href="/dashboard/scrape" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Go to Scrape
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-gray-500 text-sm mt-1">{leads.length} scraped and scored condo properties</p>
      </div>
      <LeadTable leads={leads as Parameters<typeof LeadTable>[0]['leads']} />
    </div>
  )
}
