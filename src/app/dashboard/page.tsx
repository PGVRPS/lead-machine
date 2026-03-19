import { getLeadsWithDetails } from '@/lib/supabase/db'
import PipelineStats from '@/components/dashboard/PipelineStats'
import ScoreDistribution from '@/components/dashboard/ScoreDistribution'
import RegionBreakdown from '@/components/dashboard/RegionBreakdown'
import Link from 'next/link'
import { ArrowRight, Flame, Radar } from 'lucide-react'
import ScoreBadge from '@/components/leads/ScoreBadge'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let leads: Awaited<ReturnType<typeof getLeadsWithDetails>> = []
  try {
    leads = await getLeadsWithDetails()
  } catch {
    // Supabase not connected
  }

  const stats = {
    total: leads.length,
    immediate: leads.filter(l => l.lead_score?.tier === 'immediate').length,
    nurture: leads.filter(l => l.lead_score?.tier === 'nurture').length,
    monitor: leads.filter(l => l.lead_score?.tier === 'monitor').length,
    disqualified: leads.filter(l => l.lead_score?.tier === 'disqualified').length,
    outreachSent: 0,
    opened: 0,
    replied: 0,
  }

  const cityCounts: Record<string, number> = {}
  for (const l of leads) {
    const city = l.city || 'Unknown'
    cityCounts[city] = (cityCounts[city] || 0) + 1
  }
  const byCity: Array<{ city: string; count: number }> = Object.keys(cityCounts).map(city => ({ city, count: cityCounts[city] }))

  const scoreDistribution = [
    { range: '80-100', count: leads.filter(l => (l.lead_score?.score ?? 0) >= 80).length },
    { range: '60-79', count: leads.filter(l => (l.lead_score?.score ?? 0) >= 60 && (l.lead_score?.score ?? 0) < 80).length },
    { range: '40-59', count: leads.filter(l => (l.lead_score?.score ?? 0) >= 40 && (l.lead_score?.score ?? 0) < 60).length },
    { range: '0-39', count: leads.filter(l => (l.lead_score?.score ?? 0) < 40 && l.lead_score).length },
  ]

  const hotLeads = leads
    .filter(l => l.lead_score && l.lead_score.score >= 60)
    .sort((a, b) => (b.lead_score?.score ?? 0) - (a.lead_score?.score ?? 0))
    .slice(0, 5)

  if (leads.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Overview</h1>
          <p className="text-gray-500 text-sm mt-1">VRPS AI Lead Machine — Gulf Coast condo parking leads</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Radar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No properties scraped yet</h3>
          <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Head to the Scrape page to search Google Maps for Gulf Coast condos and start building your lead pipeline.
          </p>
          <Link
            href="/dashboard/scrape"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Radar className="w-4 h-4" /> Go to Scrape Pipeline
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pipeline Overview</h1>
        <p className="text-gray-500 text-sm mt-1">VRPS AI Lead Machine — {leads.length} Gulf Coast properties tracked</p>
      </div>

      <PipelineStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreDistribution data={scoreDistribution} />
        <RegionBreakdown data={byCity} />
      </div>

      {hotLeads.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-sm">Top Leads</h3>
            </div>
            <Link href="/dashboard/leads" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {hotLeads.map(lead => (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{lead.name}</p>
                  <p className="text-xs text-gray-500">
                    {lead.city}, {lead.state}
                    {lead.latest_units_analysis?.estimated_units ? ` — ${lead.latest_units_analysis.estimated_units} units` : ''}
                  </p>
                </div>
                {lead.lead_score && (
                  <ScoreBadge score={lead.lead_score.score} tier={lead.lead_score.tier} />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
