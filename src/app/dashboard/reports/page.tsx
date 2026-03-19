import { getLeadsWithDetails } from '@/lib/supabase/db'
import { Calendar, Download, Flame, Radar } from 'lucide-react'
import ScoreBadge from '@/components/leads/ScoreBadge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  let leads: Awaited<ReturnType<typeof getLeadsWithDetails>> = []
  try {
    leads = await getLeadsWithDetails()
  } catch {
    // Supabase not connected
  }

  const scored = leads.filter(l => l.lead_score)
  const hotLeads = scored.filter(l => l.lead_score!.tier === 'immediate').sort((a, b) => (b.lead_score?.score ?? 0) - (a.lead_score?.score ?? 0))
  const nurtureLeads = scored.filter(l => l.lead_score!.tier === 'nurture').sort((a, b) => (b.lead_score?.score ?? 0) - (a.lead_score?.score ?? 0))
  const monitorLeads = scored.filter(l => l.lead_score!.tier === 'monitor').sort((a, b) => (b.lead_score?.score ?? 0) - (a.lead_score?.score ?? 0))
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, l) => s + (l.lead_score?.score ?? 0), 0) / scored.length) : 0

  if (leads.length === 0) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Weekly Lead Report</h1></div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Radar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600">No data yet</h3>
          <p className="text-sm text-gray-400 mt-1">Run a scrape to generate your first report.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead Report</h1>
          <p className="text-gray-500 text-sm mt-1">{leads.length} properties in database</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Properties', value: String(leads.length), sub: 'in database' },
          { label: 'Hot Leads', value: String(hotLeads.length), sub: 'score 80+' },
          { label: 'Nurture Leads', value: String(nurtureLeads.length), sub: 'score 60-79' },
          { label: 'Avg Score', value: String(avgScore), sub: 'across scored leads' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium text-gray-700">{s.label}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {hotLeads.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold">Immediate Outreach ({hotLeads.length})</h3>
            </div>
          </div>
          <LeadReportTable leads={hotLeads} />
        </div>
      )}

      {nurtureLeads.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold">Nurture Sequence ({nurtureLeads.length})</h3>
          </div>
          <LeadReportTable leads={nurtureLeads} />
        </div>
      )}

      {monitorLeads.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold">Monitor ({monitorLeads.length})</h3>
          </div>
          <LeadReportTable leads={monitorLeads} />
        </div>
      )}
    </div>
  )
}

function LeadReportTable({ leads }: { leads: Array<Record<string, unknown>> }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/50">
          <th className="text-left px-5 py-3 font-medium text-gray-500">Property</th>
          <th className="text-left px-5 py-3 font-medium text-gray-500">City</th>
          <th className="text-left px-5 py-3 font-medium text-gray-500">Reviews</th>
          <th className="text-left px-5 py-3 font-medium text-gray-500">Units</th>
          <th className="text-left px-5 py-3 font-medium text-gray-500">Score</th>
        </tr>
      </thead>
      <tbody>
        {leads.map((lead: Record<string, unknown>) => (
          <tr key={lead.id as string} className="border-b border-gray-50">
            <td className="px-5 py-3">
              <Link href={`/dashboard/leads/${lead.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                {lead.name as string}
              </Link>
            </td>
            <td className="px-5 py-3 text-gray-600">{lead.city as string}</td>
            <td className="px-5 py-3 tabular-nums">{lead.review_count as number}</td>
            <td className="px-5 py-3 font-medium">
              {(lead.latest_units_analysis as Record<string, unknown> | null)?.estimated_units as number ?? '—'}
            </td>
            <td className="px-5 py-3">
              {(lead.lead_score as Record<string, unknown>) && (
                <ScoreBadge
                  score={(lead.lead_score as Record<string, unknown>).score as number}
                  tier={(lead.lead_score as Record<string, unknown>).tier as 'immediate' | 'nurture' | 'monitor' | 'disqualified'}
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
