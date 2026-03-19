'use client'

import { useState, useEffect } from 'react'
import { Loader2, Play, CheckCircle, AlertCircle, Zap, MapPin, Flame } from 'lucide-react'
import { GULF_COAST_REGIONS, SEARCH_TERMS } from '@/lib/scoring/config'
import type { LeadWithDetails } from '@/types/database'
import ScoreBadge from '@/components/leads/ScoreBadge'
import Link from 'next/link'

type PipelineStatus = 'idle' | 'scraping_buildings' | 'scraping_reviews' | 'analyzing' | 'scoring' | 'complete' | 'error'

export default function ScrapePage() {
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['Orange Beach, AL'])
  const [selectedTerms, setSelectedTerms] = useState<string[]>(['condominium complex', 'condo resort', 'beach condo'])
  const [reviewsLimit, setReviewsLimit] = useState(100)
  const [analyzeTop, setAnalyzeTop] = useState(5)
  const [status, setStatus] = useState<PipelineStatus>('idle')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [leads, setLeads] = useState<LeadWithDetails[]>([])
  const [summary, setSummary] = useState<Record<string, number> | null>(null)

  // Poll for status while running
  useEffect(() => {
    if (status === 'idle' || status === 'complete' || status === 'error') return

    const interval = setInterval(async () => {
      const res = await fetch('/api/scrape/pipeline')
      const data = await res.json()
      setProgress(data.progress)
      if (data.status === 'complete' || data.status === 'error') {
        setStatus(data.status)
        if (data.error) setError(data.error)
        fetchLeads()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [status])

  async function fetchLeads() {
    const res = await fetch('/api/leads')
    const data = await res.json()
    setLeads(data.leads || [])
  }

  async function runPipeline() {
    setStatus('scraping_buildings')
    setProgress('Starting pipeline...')
    setError(null)
    setSummary(null)

    try {
      const res = await fetch('/api/scrape/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regions: selectedRegions,
          searchTerms: selectedTerms,
          reviewsLimit,
          analyzeTop,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setError(data.error || 'Pipeline failed')
        return
      }

      setStatus('complete')
      setSummary(data.summary)
      fetchLeads()
    } catch (err) {
      setStatus('error')
      setError((err as Error).message)
    }
  }

  function toggleRegion(region: string) {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    )
  }

  function toggleTerm(term: string) {
    setSelectedTerms(prev =>
      prev.includes(term) ? prev.filter(t => t !== term) : [...prev, term]
    )
  }

  const isRunning = !['idle', 'complete', 'error'].includes(status)
  const estimatedCost = (selectedRegions.length * selectedTerms.length * 0.05 + analyzeTop * reviewsLimit * 0.003).toFixed(2)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scrape Pipeline</h1>
        <p className="text-gray-500 text-sm mt-1">Search Google Maps for condos, pull reviews, run AI analysis, and score leads</p>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Pipeline Configuration</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Target Regions</label>
            <div className="flex flex-wrap gap-2">
              {GULF_COAST_REGIONS.map(region => (
                <button
                  key={region}
                  onClick={() => toggleRegion(region)}
                  disabled={isRunning}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    selectedRegions.includes(region)
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Search Terms</label>
            <div className="flex flex-wrap gap-2">
              {SEARCH_TERMS.map(term => (
                <button
                  key={term}
                  onClick={() => toggleTerm(term)}
                  disabled={isRunning}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    selectedTerms.includes(term)
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Reviews per property</label>
              <select
                value={reviewsLimit}
                onChange={e => setReviewsLimit(Number(e.target.value))}
                disabled={isRunning}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full bg-white"
              >
                <option value={50}>50 reviews</option>
                <option value={100}>100 reviews</option>
                <option value={200}>200 reviews</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Properties to analyze (AI)</label>
              <select
                value={analyzeTop}
                onChange={e => setAnalyzeTop(Number(e.target.value))}
                disabled={isRunning}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full bg-white"
              >
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              {selectedRegions.length} regions × {selectedTerms.length} terms = {selectedRegions.length * selectedTerms.length} searches
              <span className="ml-2 text-xs text-gray-400">(est. ~${estimatedCost} Outscraper cost)</span>
            </div>
            <button
              onClick={runPipeline}
              disabled={isRunning || selectedRegions.length === 0 || selectedTerms.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white ${
                isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRunning ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Running...</>
              ) : (
                <><Play className="w-4 h-4" /> Run Pipeline</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      {isRunning && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <div>
              <h3 className="font-semibold text-blue-800">Pipeline Running</h3>
              <p className="text-sm text-blue-600 mt-0.5">{progress}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {['scraping_buildings', 'scraping_reviews', 'analyzing', 'scoring'].map((step, i) => {
              const steps: PipelineStatus[] = ['scraping_buildings', 'scraping_reviews', 'analyzing', 'scoring']
              const currentIdx = steps.indexOf(status)
              const stepIdx = i
              return (
                <div key={step} className={`flex-1 h-2 rounded-full ${
                  stepIdx < currentIdx ? 'bg-blue-500' :
                  stepIdx === currentIdx ? 'bg-blue-400 animate-pulse' :
                  'bg-blue-200'
                }`} />
              )
            })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-blue-400">
            <span>Search</span>
            <span>Reviews</span>
            <span>AI Analysis</span>
            <span>Score</span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-800">Pipeline Failed</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && status === 'complete' && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-green-800">Pipeline Complete</h3>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <p className="text-2xl font-bold text-green-800">{summary.total_properties}</p>
              <p className="text-xs text-green-600">Properties found</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-800">{summary.reviews_fetched}</p>
              <p className="text-xs text-green-600">Reviews fetched</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-800">{summary.analyzed}</p>
              <p className="text-xs text-green-600">AI analyzed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{summary.immediate}</p>
              <p className="text-xs text-red-500">Hot leads</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{summary.nurture}</p>
              <p className="text-xs text-amber-500">Nurture</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {leads.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">Scraped Leads ({leads.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Property</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">City</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Rating</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Reviews</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Units</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Parking</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Rentals</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Score</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                  <td className="px-5 py-3">
                    <p className="font-medium">{lead.name}</p>
                    {lead.website && (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-700">
                        {lead.website.replace(/^https?:\/\//, '').split('/')[0]}
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{lead.city}, {lead.state}</td>
                  <td className="px-5 py-3">
                    {lead.google_rating ? <span className="text-amber-500">{lead.google_rating} ★</span> : '—'}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{lead.review_count}</td>
                  <td className="px-5 py-3">
                    {lead.latest_units_analysis?.estimated_units || '—'}
                  </td>
                  <td className="px-5 py-3">
                    {lead.latest_parking_analysis?.parking_score !== null && lead.latest_parking_analysis?.parking_score !== undefined ? (
                      <span className={`font-medium ${
                        lead.latest_parking_analysis.parking_score >= 7 ? 'text-red-600' :
                        lead.latest_parking_analysis.parking_score >= 4 ? 'text-amber-600' : 'text-green-600'
                      }`}>{lead.latest_parking_analysis.parking_score}/10</span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {lead.latest_rentals_analysis?.has_vacation_rentals !== null ? (
                      lead.latest_rentals_analysis?.has_vacation_rentals
                        ? <span className="text-green-600 text-xs font-medium">Yes</span>
                        : <span className="text-gray-400 text-xs">No</span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {lead.lead_score ? (
                      <ScoreBadge score={lead.lead_score.score} tier={lead.lead_score.tier} />
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
