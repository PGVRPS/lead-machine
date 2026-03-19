'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertCircle, ParkingCircle, Building, Home } from 'lucide-react'
import type { ParkingAnalysisResult } from '@/lib/ai/prompts/parking-detection'
import type { UnitEstimationResult } from '@/lib/ai/prompts/unit-estimation'
import type { RentalDetectionResult } from '@/lib/ai/prompts/rental-detection'

interface AnalysisPanelProps {
  propertyName: string
  address: string
  city: string
  state: string
  reviewCount: number
  reviews: string[]
}

interface AnalysisResults {
  parking: ParkingAnalysisResult | null
  units: UnitEstimationResult | null
  rentals: RentalDetectionResult | null
}

export default function AnalysisPanel({ propertyName, address, city, state, reviewCount, reviews }: AnalysisPanelProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [results, setResults] = useState<AnalysisResults>({ parking: null, units: null, rentals: null })
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)

  async function runAnalysis() {
    setStatus('running')
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyName,
          address,
          city,
          state,
          reviewCount,
          reviews,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setResults({
        parking: data.parking,
        units: data.units,
        rentals: data.rentals,
      })
      setModel(data.model)
      setStatus('done')
    } catch (err) {
      setError((err as Error).message)
      setStatus('error')
    }
  }

  if (status === 'idle') {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              AI Analysis
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Run Claude AI analysis on {reviews.length} reviews to detect parking complaints, estimate units, and check for vacation rentals.
            </p>
          </div>
          <button
            onClick={runAnalysis}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" /> Run Analysis
          </button>
        </div>
      </div>
    )
  }

  if (status === 'running') {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          <div>
            <h3 className="font-semibold">Running AI Analysis...</h3>
            <p className="text-sm text-gray-600 mt-0.5">Analyzing {reviews.length} reviews with Claude. This takes 10-20 seconds.</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" /> Detecting parking complaints...
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" /> Estimating unit count...
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" /> Checking vacation rental activity...
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-800">Analysis Failed</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={runAnalysis}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // status === 'done'
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          AI Analysis Complete
          {model && <span className="text-xs text-gray-400 font-normal">({model})</span>}
        </h3>
        <button
          onClick={runAnalysis}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:text-gray-800"
        >
          Re-run
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Parking Results */}
        {results.parking && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ParkingCircle className="w-4 h-4 text-red-500" />
              <h4 className="font-semibold text-sm">Parking Analysis</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Severity Score</span>
                <span className={`text-lg font-bold ${
                  results.parking.severity_score >= 7 ? 'text-red-600' :
                  results.parking.severity_score >= 4 ? 'text-amber-600' : 'text-green-600'
                }`}>{results.parking.severity_score}/10</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Parking Mentions</span>
                <span className="text-sm font-medium">{results.parking.total_parking_mentions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Has Issues</span>
                <span className={`text-sm font-medium ${results.parking.parking_issue ? 'text-red-600' : 'text-green-600'}`}>
                  {results.parking.parking_issue ? 'Yes' : 'No'}
                </span>
              </div>
              {results.parking.summary && (
                <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">{results.parking.summary}</p>
              )}
            </div>
          </div>
        )}

        {/* Units Results */}
        {results.units && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building className="w-4 h-4 text-blue-500" />
              <h4 className="font-semibold text-sm">Unit Estimation</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated Units</span>
                <span className="text-lg font-bold">{results.units.estimated_units}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence</span>
                <span className={`text-sm font-medium capitalize ${
                  results.units.confidence === 'high' ? 'text-green-600' :
                  results.units.confidence === 'medium' ? 'text-amber-600' : 'text-gray-500'
                }`}>{results.units.confidence}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">In Target (50-350)</span>
                <span className={`text-sm font-medium ${results.units.in_target_range ? 'text-green-600' : 'text-gray-500'}`}>
                  {results.units.in_target_range ? 'Yes' : 'No'}
                </span>
              </div>
              {results.units.evidence && (
                <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">{results.units.evidence}</p>
              )}
            </div>
          </div>
        )}

        {/* Rentals Results */}
        {results.rentals && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-4 h-4 text-emerald-500" />
              <h4 className="font-semibold text-sm">Vacation Rentals</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Allows Rentals</span>
                <span className={`text-sm font-bold ${results.rentals.has_vacation_rentals ? 'text-green-600' : 'text-gray-500'}`}>
                  {results.rentals.has_vacation_rentals ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence</span>
                <span className={`text-sm font-medium capitalize ${
                  results.rentals.confidence === 'high' ? 'text-green-600' :
                  results.rentals.confidence === 'medium' ? 'text-amber-600' : 'text-gray-500'
                }`}>{results.rentals.confidence}</span>
              </div>
              {results.rentals.platforms.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Platforms</span>
                  <span className="text-sm font-medium">{results.rentals.platforms.join(', ')}</span>
                </div>
              )}
              {results.rentals.evidence && (
                <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">{results.rentals.evidence}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Parking Complaints from AI */}
      {results.parking && results.parking.complaints.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="font-semibold text-sm mb-3">AI-Detected Parking Complaints ({results.parking.complaints.length})</h4>
          <div className="space-y-2">
            {results.parking.complaints.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                  c.severity >= 8 ? 'bg-red-200 text-red-800' :
                  c.severity >= 5 ? 'bg-amber-200 text-amber-800' :
                  'bg-gray-200 text-gray-700'
                }`}>{c.severity}/10</span>
                <div>
                  <p className="text-sm text-gray-700">&ldquo;{c.review_excerpt}&rdquo;</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{c.category.replace(/_/g, ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
