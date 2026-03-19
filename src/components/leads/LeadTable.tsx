'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react'
import type { LeadWithDetails } from '@/types/database'
import ScoreBadge from './ScoreBadge'

type SortKey = 'name' | 'city' | 'score' | 'units' | 'review_count'
type SortDir = 'asc' | 'desc'

const tierFilter = ['all', 'immediate', 'nurture', 'monitor', 'disqualified'] as const

export default function LeadTable({ leads }: { leads: LeadWithDetails[] }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedTier, setSelectedTier] = useState<(typeof tierFilter)[number]>('all')
  const [selectedCity, setSelectedCity] = useState<string>('all')

  const cities = useMemo(() => {
    const set = new Set(leads.map(l => l.city).filter(Boolean) as string[])
    return ['all', ...Array.from(set).sort()]
  }, [leads])

  const filtered = useMemo(() => {
    let result = [...leads]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.contacts[0]?.management_company?.toLowerCase().includes(q)
      )
    }

    if (selectedTier !== 'all') {
      result = result.filter(l => l.lead_score?.tier === selectedTier)
    }

    if (selectedCity !== 'all') {
      result = result.filter(l => l.city === selectedCity)
    }

    result.sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      switch (sortKey) {
        case 'name': aVal = a.name; bVal = b.name; break
        case 'city': aVal = a.city || ''; bVal = b.city || ''; break
        case 'score': aVal = a.lead_score?.score ?? 0; bVal = b.lead_score?.score ?? 0; break
        case 'units': aVal = a.latest_units_analysis?.estimated_units ?? 0; bVal = b.latest_units_analysis?.estimated_units ?? 0; break
        case 'review_count': aVal = a.review_count; bVal = b.review_count; break
      }

      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal)
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return result
  }, [leads, search, sortKey, sortDir, selectedTier, selectedCity])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ChevronUp className="w-3 h-3 opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-500" />
      : <ChevronDown className="w-3 h-3 text-blue-500" />
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties, cities, or management..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedTier}
            onChange={e => setSelectedTier(e.target.value as typeof selectedTier)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {tierFilter.map(t => (
              <option key={t} value={t}>{t === 'all' ? 'All Tiers' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {cities.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Cities' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  <span className="flex items-center gap-1">Property <SortIcon column="name" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('city')}>
                  <span className="flex items-center gap-1">City <SortIcon column="city" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('units')}>
                  <span className="flex items-center gap-1">Units <SortIcon column="units" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('score')}>
                  <span className="flex items-center gap-1">Score <SortIcon column="score" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Management</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Rentals</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('review_count')}>
                  <span className="flex items-center gap-1">Reviews <SortIcon column="review_count" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Stage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/leads/${lead.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      {lead.name}
                    </Link>
                    {lead.google_rating && (
                      <span className="ml-2 text-xs text-gray-400">{lead.google_rating} ★</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{lead.city}, {lead.state}</td>
                  <td className="px-4 py-3">
                    {lead.latest_units_analysis?.estimated_units ? (
                      <span className="font-medium">{lead.latest_units_analysis.estimated_units}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.lead_score ? (
                      <ScoreBadge score={lead.lead_score.score} tier={lead.lead_score.tier} />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {lead.contacts[0]?.management_company || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {lead.latest_rentals_analysis?.has_vacation_rentals ? (
                      <span className="text-green-600 text-xs font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 tabular-nums">{lead.review_count}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 capitalize">
                      {lead.current_stage?.replace('_', ' ') || 'new'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            No leads match your filters.
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
          Showing {filtered.length} of {leads.length} properties
        </div>
      </div>
    </div>
  )
}
